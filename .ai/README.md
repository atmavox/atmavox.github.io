# .ai/ — contexto do projeto para IA

Esta pasta é a memória do projeto. O Claude Code lê o `CLAUDE.md` (na raiz) automaticamente. Ele importa
`purpose.md` e `conventions.md` e aponta para o resto, que deve ser lido **sob demanda**, conforme a tarefa.
Também serve para pessoas: quem chegar ao projeto entende o que é, por que existe e como foi decidido.

## Índice

| Arquivo                            | Para que serve                                                   | Quando ler                             |
| ---------------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| `purpose.md`                       | O que é a Atmavox, para quem é o site, objetivos e não-objetivos | sempre (importado no CLAUDE.md)        |
| `conventions.md`                   | Clean code, SOLID, nomes, estilo, testes, commits                | sempre (importado no CLAUDE.md)        |
| `tech-stack.md`                    | Tecnologias e o motivo de cada uma                               | ao adicionar ou atualizar dependência  |
| `architecture.md`                  | Pastas, camadas, fluxo de dados, rotas, deploy                   | ao criar arquivos ou mover código      |
| `brand.md`                         | Paleta, tipografia, tom de voz, links da marca                   | ao mexer em visual ou textos de UI     |
| `glossary.md`                      | Termos da marca e termos técnicos do projeto                     | quando um termo não estiver claro      |
| `features.md`                      | Especificação de cada feature e critérios de aceite              | ao implementar ou mudar uma feature    |
| `decisions.md`                     | Registro das decisões de arquitetura (ADRs)                      | antes de reverter uma escolha          |
| `firebase-setup.md`                | Passo a passo do console do Firebase e das variáveis do deploy   | ao configurar ou mexer no login        |
| `guia-modo-andreia.md`             | Guia simples para a Andreía editar e publicar a jornada          | ao mudar o Modo Andreía (manter igual) |
| `roadmap.md`                       | O que vem a seguir, em ordem                                     | ao escolher a próxima tarefa           |
| `changelog.md`                     | Histórico de mudanças                                            | ao finalizar uma tarefa                |
| `reference/workbook-original.html` | HTML original do workbook, fonte do conteúdo                     | ao migrar ou conferir textos           |

## Regras para manter esta pasta útil

- **Curto e verdadeiro vence longo e desatualizado.** Se o código mudou, atualize o `.md` no mesmo commit.
- **Decisões não se apagam:** se mudar de ideia, registre uma nova decisão que substitui a antiga.
- O `changelog.md` segue o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
