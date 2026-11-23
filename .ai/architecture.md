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
    auth/                 login do site (ADR-022): sessão, janela de login, Firebase Auth sob demanda
    firebase/             config e app do Firebase, divididos entre o login e a nuvem da jornada
    brand/                links da marca (redes, áudio, WhatsApp) e assinatura
    catalog/              produtos do catálogo (ADR-019): product.ts (tipos), parseCatalog.ts, offer.ts
                          (tag e botão de cada produto, acesso, preço), seedCatalog.ts (catálogo do código)
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
| `#/jornada/{id}`                                    | Abertura da jornada (pede login, ADR-020) |
| `#/jornada/{id}/semana-1`…`3`                       | Semanas                                   |
| `#/jornada/{id}/revisoes`                           | Revisões semanais                         |
| `#/jornada/{id}/vitorias`                           | Registro de vitórias                      |
| `#/jornada/{id}/encerramento`                       | Encerramento                              |
| `#/jornada`, `#/jornada/semana-1`…                  | Links antigos: abrem `chama-interna-21`   |
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
                                      # dayTitles: JSON dos títulos dos dias dados no produto, até o
                                      # primeiro rascunho (ADR-025; o setDoc do rascunho o descarta)
 drafts/{journeyId}/versions/{auto}   # uma cópia por publicação (histórico)
 media/{auto}                         # dataUrl: imagem WebP/JPEG reduzida; width, height (ADR-014)
```

Regras do Firestore (`firestore.rules`): cada pessoa só lê e escreve `users/{seu uid}/**`; `published`
e `media` têm leitura pública e gravação só da admin; `drafts` é só da admin; cada pessoa só lê o
próprio `admins/{uid}`. O restante é negado.

### Catálogo e acesso (ADR-019 e ADR-020; regras em `firestore.rules`, acessos lidos por REST com o token)

```
catalog/public                        # content: JSON com Product[]; updatedAt (leitura pública, por REST)
published/{productId}                 # content: jornada ou meditação; free: boolean (cópia do catálogo)
users/{uid}/access/{productId}        # grantedAt, expiresAt | null, source: 'manual' | 'payment', ref?
interest/{productId}/people/{uid}     # "Quero ser avisada" de um produto "Em breve"; createdAt
```

```ts
type Territory = 'estado-cinza' | 'consciencia' | 'presenca' | 'expansao'
type Pricing = { type: 'free' } | { type: 'paid'; priceCents: number; accessMonths: number | null } // null = acesso para sempre

interface ProductBase {
  id: string // slug imutável: chave do progresso, do acesso e das rotas
  title: string
  phrase: string // frase emblemática do cartão
  bannerMediaId?: string // imagem em media/{id} (ADR-014)
  territory: Territory
  status: 'draft' | 'soon' | 'published' // draft não aparece; soon = "Em breve"
  pricing: Pricing
  featured: boolean // aparece na página inicial
  order: number
}
interface JourneyProduct extends ProductBase {
  kind: 'journey'
  structure: 'days' | 'weeks' | 'parts' | 'themes' // "Por dias", "3 semanas", "2 partes", "Por temas"
  durationLabel: string // gerado: "21 dias", "4 temas"
  themes: { label: string; title: string; lastDay?: number }[] // semanas, partes (com o último dia) ou temas
  dayCount?: number // quantos dias (não vale para temas)
  previewDays?: string[] // os 3 primeiros dias com título: cartões I, II, III do banner (ADR-025)
}
// Trechos de dias (semanas, partes, temas): shared/catalog/journeyLayout.ts (`dayGroups`, `cardTiles`).
interface MeditationProduct extends ProductBase {
  kind: 'meditation'
  media: 'audio' | 'video'
  durationSec: number
  group: string // agrupamento no hub: "Manhã", "Noite", "Encontros gravados"…
  ebook?: { pages: number } // o link de download fica no published, nunca no catálogo
}
type Product = JourneyProduct | MeditationProduct
```

Regras novas: `catalog/public` com leitura pública e gravação só da admin; `published/{id}` com `get`
só se `resource.data.free == true`, acesso válido ou admin (sem `list`); `access` lido pela própria
pessoa e gravado só pela admin; `interest/{id}/people/{uid}` gravado pela própria pessoa e lido pela
admin. Preço em centavos (inteiro) para não ter erro de arredondamento.

Rotas novas: `#/jornadas` e `#/meditacoes` (hubs), `#/jornada/{productId}/…` (a `#/jornada` atual passa
a abrir `chama-interna-21`) e `#/meditacao/{productId}`.

As participantes leem `published` e `media` por `fetch` na API REST: o SDK do Firebase só carrega para
quem entra na conta.

## Tema

- Tokens em CSS variables (`--bg`, `--surface`, `--text`, `--accent`…) trocados por `data-theme` no
  `<html>`.
- Um script inline no `index.html` aplica o tema salvo antes da primeira pintura (sem "piscar").
- O Tailwind expõe os tokens como cores (`bg-surface`, `text-accent`).

## Modo Andreía de produtos (`features/produtos`)

Carregado sob demanda em `#/admin/produtos` (só a admin baixa). `domain/productForm.ts` (formulário,
validação, conversão para o produto), `application/saveProduct.ts` (grava conteúdo e depois catálogo),
`infrastructure/productsBackend.ts` (REST com o token da admin: `catalog/public`, `published/{id}`,
`admins/{uid}`) e `ui/` (lista + editor + prévia; passo a passo no celular). O site lê o catálogo pela
`CatalogStore` (`shared/catalog`, contexto em `app/`), com cópia no aparelho e o do código de reserva.

## Pagamentos (ADR-023)

```
worker/                 Worker da Cloudflare (fora do site; publicado com `npx wrangler@4 deploy`)
  src/index.ts          liga os segredos às peças
  src/app.ts            rotas /checkout, /webhook, /retorno (testadas sem rede)
  src/mercadoPago.ts    cobrança, consulta do pagamento, assinatura do webhook
  src/firebaseToken.ts  confere o token de login do Firebase
  src/firestore.ts      conta de serviço do Google + leitura do catálogo e gravação do acesso
```

O Worker importa de `src/shared/catalog` (catálogo, prazo de acesso): uma regra só para site e servidor.
No site, `shared/catalog/checkout.ts` chama o Worker e `PaymentReturnPage` mostra o resultado.

## Deploy

```
push na main → GitHub Actions: npm ci → npm run check → npm run build → deploy no GitHub Pages
```

- Repositório `atmavox/atmavox.github.io` → site na raiz `https://atmavox.github.io` (`base: '/'`).
- Variáveis do Firebase: Settings → Secrets and variables → Actions → **Variables**.
- No Firebase Auth, adicione `atmavox.github.io` aos domínios autorizados.
