# Arquitetura

## Visão geral

Um app Vite + React com duas features isoladas (hub e jornada) e uma pasta compartilhada. A jornada segue
uma Clean Architecture enxuta; o hub é mais simples (é quase só conteúdo e layout).

```
src/
  app/                    composição
    App.tsx               providers (tema, jornada) + roteamento
    routes.ts             tabela de rotas
  features/
    hub/
      content.ts          produtos, links, textos do hub
      components/         Hero, ProductCard, FreeAudio, SocialLinks…
      HubPage.tsx
    jornada/
      domain/             tipos e regras puras: journey.ts, progress.ts (+ testes)
      content/            chama-interna-21.ts (os 21 dias), copy.ts (capa, encerramento)
      application/        ports.ts (interfaces), JourneyStore.ts, navigation.ts
      infrastructure/     LocalProgressRepository, firebase/, createServices.ts
      ui/                 páginas (Abertura, Semana, Revisões, Vitórias, Encerramento) e componentes
  shared/
    brand/                links da marca (redes, áudio, WhatsApp) e assinatura
    theme/                tokens CSS, ThemeProvider, botão de tema
    ui/                   componentes genéricos (Button, Card, ProgressBar)
    lib/                  utilitários sem regra de negócio
```

## Regra de dependência (jornada)

```
ui  →  application  →  domain  ←  content
              ↑
      infrastructure (implementa as interfaces de application/ports.ts)
```

- `domain/` não importa nada de fora: nem React, nem Firebase, nem `ui/`. O ESLint garante.
- `application/` conhece `domain/` e define **portas** (interfaces): `ProgressRepository`, `AuthService`.
- `infrastructure/` implementa as portas (localStorage, Firestore, Firebase Auth).
- `createServices.ts` é a **composition root**: o único lugar que escolhe as implementações.
- `hub/` e `jornada/` não importam um do outro. O que for comum vai para `shared/`.

## Rotas (hash)

| Rota                     | Tela                 |
| ------------------------ | -------------------- |
| `#/`                     | Hub                  |
| `#/jornada`              | Abertura da jornada  |
| `#/jornada/semana-1`…`3` | Semanas              |
| `#/jornada/revisoes`     | Revisões semanais    |
| `#/jornada/vitorias`     | Registro de vitórias |
| `#/jornada/encerramento` | Encerramento         |

O hash evita o 404 do GitHub Pages ao recarregar uma página interna e permite compartilhar o link de uma aba.

## Fluxo de dados da jornada

```
ação da pessoa → store.update(comandoDoDomínio)
                  ├─ salva na hora no localStorage
                  ├─ notifica a UI (useSyncExternalStore)
                  └─ se logada: envia ao Firestore com debounce (~800 ms)

login  → carrega a nuvem → mergeProgress(aparelho, nuvem) → grava nos dois
logout → envia o que estiver pendente → limpa o aparelho (reflexões são íntimas)
```

### Regras do merge

- Dias concluídos e vitórias: **união** (nunca perde).
- Textos, emoções e humor: vence o lado com conteúdo; se os dois têm, vence o mais recente.
- Texto vazio nunca apaga texto existente.

## Modelo no Firestore

```
users/{uid}/journeys/{journeyId}      # journeyId = "chama-interna-21"
  version: 1
  completedDays: number[]
  entries: { "d1:reflexao": "…", "r7:q1": "…" }
  emotions: { "1": ["Pesada"] }
  moods: { "1": 3 }
  victories: [{ id, date, day, action, result, createdAt }]
  updatedAt: number
```

Regras do Firestore: cada pessoa só lê e escreve `users/{seu uid}/**`. O restante é negado.

## Tema

- Tokens em CSS variables (`--bg`, `--surface`, `--text`, `--accent`…) trocados por `data-theme` no
  `<html>`.
- Um script inline no `index.html` aplica o tema salvo antes da primeira pintura (sem "piscar").
- O Tailwind expõe os tokens como cores (`bg-surface`, `text-accent`).

## Deploy

```
push na main → GitHub Actions: npm ci → npm run check → npm run build → deploy no GitHub Pages
```

- Repositório `atmavox/atmavox.github.io` → site na raiz `https://atmavox.github.io` (`base: '/'`).
- Variáveis do Firebase: Settings → Secrets and variables → Actions → **Variables**.
- No Firebase Auth, adicione `atmavox.github.io` aos domínios autorizados.
