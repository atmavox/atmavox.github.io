# Marca

## Conceito visual

O eixo da marca é **cinza → âmbar → dourado**: sair do Estado Cinza e acender a Chama Interna. Ele aparece
na evolução das abas, no rastreador de dias e nos destaques. O visual é elegante, quente, com muito respiro e
sem fotos genéricas de banco de imagens.

Elementos recorrentes: o **símbolo** (abaixo), uma **chama** estilizada (encerramento da jornada) e o ✦, que
marca conclusão.

### Símbolo / logo ("Forma de onda", escolhido em 2026-11-22)

Cinco barras de áudio arredondadas, **simétricas em torno de uma linha central** (como a voz num gravador),
sem fundo: as quatro de fora em dourado, a do centro, mais alta, em âmbar. Representa a voz ("vox").
Substituiu os "Anéis nítidos" (2026-11-21), que pareciam um alvo.

- Escolhida pela cliente entre oito rodadas de mocks, todas guardadas em `Downloads/atmavox-icones.html`
  (opção v3 · 06). O que ela recusou: formas de fogo, linhas em diagonal (parecem gráfico financeiro),
  barras apoiadas numa base e qualquer coisa que lembre wifi.
- Arquivo: `public/favicon.svg` (também usado no README). No fundo claro usa tons mais escuros; no escuro,
  mais claros (`prefers-color-scheme` dentro do SVG).
- No site: `shared/ui/BrandMark.tsx`, com os tokens `--logo` (barras de fora) e `--logo-center` (centro),
  iguais às cores do favicon. Com `speaking`, cada barra "fala" bem devagar (ciclo de 8 s, ritmos
  diferentes; parada com movimento reduzido).
- Onde aparece (mock aprovado em 2026-11-22, `Downloads/atmavox-hub-logo-fundo.html`):
  - **Hub no computador:** grande (760 px) e 25% visível no fundo do topo, cortada pela borda esquerda,
    atrás da pergunta, falando. Não há mais logo pequena acima de "Consciência · presença · expansão".
  - **Hub no celular:** pequena (22 px), parada e nas cores normais, ao lado de "ATMAVOX" no cabeçalho.
    Sem logo no fundo.
  - **Capa da jornada:** grande, falando. **"Sobre" sem foto:** parada.
- Proporções (viewBox 64): barras com traço 6 e ponta redonda em x 12, 22, 32, 42, 52; meias-alturas 5, 13,
  23, 13, 5 em torno de y 32.
- Junto do nome: "ATMAVOX" em Playfair Display, caixa alta, espaçamento ~0,2em, em dourado.
- Em estudo: paleta "Sombra/Estado Cinza/Luz/Pérola" tirada do briefing de marca de 10/2026 (v8 no arquivo
  de ícones). A cliente manteve a paleta atual por enquanto.

## Paleta (tokens)

Claro **"Areia"** (padrão desde 2026-11-21, pedido do cliente) e escuro **"Sépia"**, escolhidos em 2026-11-21 entre 5 opções de cada, num
protótipo com contraste medido (o claro anterior, quase branco, ofuscava).

| Token          | Escuro    | Claro     | Uso                                |
| -------------- | --------- | --------- | ---------------------------------- |
| `--bg`         | `#211a14` | `#ebe2d4` | fundo                              |
| `--surface`    | `#2c231b` | `#f2eadf` | cartões                            |
| `--surface-2`  | `#362c22` | `#e3d8c7` | hover, áreas secundárias           |
| `--field`      | `#261e17` | `#f5eee4` | campos de texto                    |
| `--text`       | `#f3e9dc` | `#2a231d` | texto principal                    |
| `--text-muted` | `#cdbca6` | `#54483e` | texto secundário                   |
| `--text-faint` | `#a39580` | `#665a4e` | dicas, legendas                    |
| `--accent`     | `#dc9530` | `#8a510b` | âmbar: ações, destaque, progresso  |
| `--gold`       | `#d8b25f` | `#735214` | dourado: afirmações, logo          |
| `--wine`       | `#6b2536` | `#74283a` | vinho: profundidade (rituais, CTA) |
| `--gray-state` | `#9d958e` | `#625d57` | o "cinza" de onde as abas partem   |
| `--line`       | texto 14% | texto 14% | bordas e divisórias                |

- Classes do Tailwind (em `src/shared/theme/theme.css`): `bg`, `surface`, `surface-2`, `field`, `ink`
  (`--text`), `ink-muted`, `ink-faint`, `accent`, `gold`, `wine`, `gray-state`, `line`. Ex.: `bg-surface`,
  `text-ink-muted`, `border-line`. Fontes: `font-sans` (Jost) e `font-display` (Playfair Display).
- O **escuro** é mais claro que o original (`#0A0A0A` → `#211a14`, um marrom-sépia), por pedido da
  Andreía.
- No **claro**, o âmbar escurece para manter contraste AA em textos pequenos.
- Contraste medido em 2026-11-21: todo texto tem **≥ 4,5:1** sobre `bg`, `surface` e `surface-2` nos dois
  temas (pior par: 4,6:1), e o texto dos botões sobre `accent` também.
- Histórico: a primeira paleta era escuro `#1b1714` / claro `#f6f0e7` (cartões `#fffcf7`).
- Paleta original do HTML, para referência: preto `#0A0A0A`, âmbar `#C9831A`, branco quente `#F5EFE6`,
  cinza névoa `#2C2C2C`, dourado `#D4A853`, vinho `#5C1F2E`, nude `#C4A882`.

## Tipografia

- **Playfair Display**: títulos, números dos dias, afirmações (itálico).
- **Jost**: texto corrido e interface. Rótulos em CAIXA ALTA com espaçamento largo (`tracking` 0.15–0.3em).

## Nome, slogan e assinatura

- **Nome:** **Andreía Oliveirà**, sempre com os dois acentos (numerologia). Vale para todo texto público:
  site, metadados, mensagens prontas de WhatsApp. No código, o nome vem de `shared/brand/links.ts`.
- **Slogan:** "Consciência, presença e expansão." (substituiu "Protocolo de Ativação de Energia, Presença
  e Direção" em 2026-11).
- **Assinatura:** "Com presença — Andreía Oliveirà" (com travessão). Fica em `BRAND_SIGNATURE` e aparece
  no rodapé do hub e no fim do Encerramento da jornada.
- **Posicionamento:** "Ativadora de consciência e possibilidades."

## Tom de voz

Fonte: conversa de posicionamento da Andreía (PDF "Posicionamento do Atmavox", 2026-11, fora do repo).

- Segunda pessoa, no feminino ("presa", "guiada", "honesta").
- **Perguntas em vez de respostas prontas.** Oferecer perspectiva, não empurrar transformação.
- Observadora sem ser passiva; provocadora sem ser agressiva; profunda sem ser complicada; espiritual sem
  frases prontas; leve sem perder inteligência.
- **Sem tom de venda:** nada de funil, urgência ou promessa. Ofertas pagas são extensões naturais do
  universo, nunca o centro.
- Não prometer que ferramentas energéticas substituem acompanhamento psicológico ou médico.
- Palavras da marca: consciência, presença, expansão, possibilidades, perceber, experimentar, ativação,
  chama, ritual.
- **Evitar "direção"** em textos novos da marca. Ocorrências dentro do conteúdo da jornada (Semana III, dia
  17, revisões) são texto da Andreía e só mudam com aprovação dela (pendente).
- Encontros recorrentes: **Zerando o Dia** (consciência e perspectiva: "O que hoje merece ser percebido de
  outra maneira?") e **Pausa Sagrada** (presença e experiência: "O que você consegue perceber quando deixa
  de tentar resolver tudo por alguns instantes?").

## Links

| Canal                         | Link                                          |
| ----------------------------- | --------------------------------------------- |
| Site                          | https://atmavox.github.io                     |
| Vídeo "Retorne ao Seu Centro" | https://youtu.be/jKuKSAQUTCA (jornada, dia 5) |
| Instagram                     | https://instagram.com/atmavox                 |
| Facebook                      | https://facebook.com/atmavox                  |
| YouTube                       | https://youtube.com/@atmavox                  |
| TikTok                        | https://www.tiktok.com/@atmavox               |
| Threads                       | **confirmar**                                 |
| Telegram                      | **confirmar** (canal/grupo)                   |
| WhatsApp                      | https://wa.me/5547991889442                   |
| Página antiga (Keepo)         | https://atmavox.keepo.bio                     |

Redes sem link confirmado **não aparecem** no site até serem confirmadas.

Mensagens prontas de WhatsApp usam `?text=` codificado, uma por produto (ex.: "Olá, Andreía! Quero entrar
na lista de espera do Ritual Matinal de 7 dias.").
