# Arquitetura

## Visão geral

Um app Vite + React com duas features isoladas (hub e jornada) e uma pasta compartilhada. A jornada segue
uma Clean Architecture enxuta; o hub é mais simples (é quase só conteúdo e layout).

```
src/
  app/                    composição
    App.tsx               roteamento por hash: hub ou jornada (carregada sob demanda)
  features/
    hub/
      content.ts          textos e listas do hub (áudios, encontros, jornadas, vídeos, redes, sobre)
      navigation.ts       seções/rotas (#/ouvir…) e o ponto de troca de layout (700 px)
      HubPage.tsx         escolhe a composição pela largura (ADR-010)
      layouts/            HubTabs (celular, abas embaixo) e HubMagazine (tablet/computador)
      components/         blocos comuns: AudioItem, EncounterCard, JourneyCard, SocialLinks…
    jornada/
      JourneyEntry.tsx    porta de entrada (lazy): cria os serviços e monta a UI
      domain/             regras puras: journey.ts (formato e blocos), progress.ts, access.ts (avanço em
                          sequência), journeyEditing.ts (editor), parseJourney.ts (conteúdo da nuvem)
      content/            chama-interna-21.ts (os 21 dias), copy.ts (capa, revisões, vitórias, encerramento)
      application/        ports.ts, services.ts, JourneyStore.ts (progresso), JourneyContent.ts (conteúdo
                          publicado), JourneyEditor.ts (Modo Andreía), MediaCache.ts (imagens),
                          account.ts (login e admin), navigation.ts, tabAccess.ts
      infrastructure/     localStorage, Firestore REST (conteúdo e imagens, sem SDK), firebase/ (SDK sob
                          demanda: login, progresso, admin, editor), compressImage.ts, versões em
                          memória para testes, createServices.ts
      ui/                 JourneyApp, JourneyHeader, pages/ (uma por aba), components/ (dia, blocos…),
                          account/ (login), admin/ (Modo Andreía, carregado sob demanda)
  shared/
    brand/                links da marca (redes, áudio, WhatsApp) e assinatura
    theme/                tokens CSS, useTheme, botão de tema
    ui/                   componentes genéricos (BrandMark, RichText)
    lib/                  utilitários sem regra de negócio (whatsapp, inlineMarkup, useHashRoute, useMediaQuery)
    media/                player de áudio único + MiniPlayer + YouTubeFacade (ADR-011) + mediaLinks
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
  `JourneyEntry.tsx` (raiz da feature) é quem o chama e entrega os serviços à `ui/` via contexto.
- `hub/` e `jornada/` não importam um do outro. O que for comum vai para `shared/`.

## Rotas (hash)

| Rota                                                | Tela                                      |
| --------------------------------------------------- | ----------------------------------------- |
| `#/`                                                | Hub (início)                              |
| `#/ouvir`, `#/encontros`, `#/jornadas`, `#/contato` | Hub: aba no celular, âncora no computador |
| `#/jornada`                                         | Abertura da jornada                       |
| `#/jornada/semana-1`…`3`                            | Semanas                                   |
| `#/jornada/revisoes`                                | Revisões semanais                         |
| `#/jornada/vitorias`                                | Registro de vitórias                      |
| `#/jornada/encerramento`                            | Encerramento                              |
| `#/jornada/editar`                                  | Modo Andreía (só admin)                   |

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

Conteúdo editável (ADR-015) e papel de admin:

```n admins/{uid}                         # existe = é admin (criado à mão no console)
 published/{journeyId}                # content: JSON da jornada no ar; publishedAt
 drafts/{journeyId}                   # content: rascunho salvo; updatedAt
 drafts/{journeyId}/versions/{auto}   # uma cópia por publicação (histórico)
 media/{auto}                         # dataUrl: imagem WebP/JPEG reduzida; width, height (ADR-014)
```

Regras do Firestore (`firestore.rules`): cada pessoa só lê e escreve `users/{seu uid}/**`; `published`
e `media` têm leitura pública e gravação só da admin; `drafts` é só da admin; cada pessoa só lê o
próprio `admins/{uid}`. O restante é negado.

As participantes leem `published` e `media` por `fetch` na API REST: o SDK do Firebase só carrega para
quem entra na conta.

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
