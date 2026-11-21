# Marca

## Conceito visual

O eixo da marca é **cinza → âmbar → dourado**: sair do Estado Cinza e acender a Chama Interna. Ele aparece
na evolução das abas, no rastreador de dias e nos destaques. O visual é elegante, quente, com muito respiro e
sem fotos genéricas de banco de imagens.

Elementos recorrentes: **três anéis concêntricos** girando devagar com um ponto âmbar no centro (capa), e uma
**chama** estilizada (encerramento). O símbolo ✦ marca conclusão.

## Paleta (tokens)

| Token          | Escuro    | Claro     | Uso                                |
| -------------- | --------- | --------- | ---------------------------------- |
| `--bg`         | `#1b1714` | `#f6f0e7` | fundo                              |
| `--surface`    | `#25201c` | `#fffcf7` | cartões                            |
| `--surface-2`  | `#2e2823` | `#f1e8db` | hover, áreas secundárias           |
| `--field`      | `#1f1b18` | `#fbf7f1` | campos de texto                    |
| `--text`       | `#f5efe6` | `#2a231d` | texto principal                    |
| `--text-muted` | `#cbbfb1` | `#5c5046` | texto secundário                   |
| `--text-faint` | `#9a9186` | `#71665b` | dicas, legendas                    |
| `--accent`     | `#d9922b` | `#96590e` | âmbar: ações, destaque, progresso  |
| `--gold`       | `#d9b261` | `#876119` | dourado: afirmações, logo          |
| `--wine`       | `#6b2536` | `#7a2a3d` | vinho: profundidade (rituais, CTA) |
| `--gray-state` | `#96918b` | `#6d6760` | o "cinza" de onde as abas partem   |
| `--line`       | texto 14% | texto 14% | bordas e divisórias                |

- Classes do Tailwind (em `src/shared/theme/theme.css`): `bg`, `surface`, `surface-2`, `field`, `ink`
  (`--text`), `ink-muted`, `ink-faint`, `accent`, `gold`, `wine`, `gray-state`, `line`. Ex.: `bg-surface`,
  `text-ink-muted`, `border-line`. Fontes: `font-sans` (Jost) e `font-display` (Playfair Display).
- O **escuro** é mais claro que o original (`#0A0A0A` → `#1b1714`, um marrom quente), por pedido da Andreia.
- No **claro**, o âmbar escurece para manter contraste AA em textos pequenos.
- Contraste medido em 2026-11-21: todo texto tem **≥ 4,5:1** sobre `bg`, `surface` e `surface-2` nos dois
  temas. Para chegar lá, `text-faint`, `gray-state` (escuro e claro), `accent` e `gold` (claro) foram
  ajustados o mínimo possível em relação à paleta proposta (antes: `#8e8377`/`#8a7c6f`, `#6f6860`/`#a59c92`,
  `#a1600f`, `#8a6319`). **Pendente:** aprovação visual da Andreia.
- Paleta original do HTML, para referência: preto `#0A0A0A`, âmbar `#C9831A`, branco quente `#F5EFE6`,
  cinza névoa `#2C2C2C`, dourado `#D4A853`, vinho `#5C1F2E`, nude `#C4A882`.

## Tipografia

- **Playfair Display**: títulos, números dos dias, afirmações (itálico).
- **Jost**: texto corrido e interface. Rótulos em CAIXA ALTA com espaçamento largo (`tracking` 0.15–0.3em).

## Tom de voz

- Segunda pessoa, no feminino ("presa", "guiada", "honesta").
- Direto, acolhedor e firme. Frases curtas. Nada de jargão técnico nem promessas exageradas.
- Palavras da marca: presença, ativação, chama, cinza, direção, ancorar, mover, ritual.
- Assinatura: "Com presença e direção — Andreia Oliveira · ATMAVOX".

## Links

| Canal                         | Link                                              |
| ----------------------------- | ------------------------------------------------- |
| Site                          | https://atmavox.github.io                         |
| Áudio "Retorne ao Seu Centro" | https://youtu.be/jKuKSAQUTCA                      |
| Instagram                     | https://instagram.com/atmavox                     |
| Facebook                      | https://facebook.com/atmavox                      |
| YouTube                       | https://youtube.com/@atmavox                      |
| TikTok                        | **confirmar o @** (no Keepo o link está quebrado) |
| WhatsApp                      | https://wa.me/5547991889442                       |
| Página antiga (Keepo)         | https://atmavox.keepo.bio                         |

Mensagens prontas de WhatsApp usam `?text=` codificado, uma por produto (ex.: "Olá, Andreia! Quero entrar
na lista de espera do Ritual Matinal de 7 dias.").
