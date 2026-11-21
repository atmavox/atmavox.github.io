# Decisões de arquitetura (ADRs)

Formato de cada registro: **contexto → decisão → consequências**. Decisões não se apagam: para mudar,
adicione um registro novo e marque o antigo como "Substituída por ADR-00X".

---

## ADR-001 · Um projeto só para o hub e a jornada

- **Status:** aceita · 2026-11-21
- **Contexto:** precisamos de um link único para a bio do Instagram, sem custo, com a página principal e o
  workbook. O Lovable não importa repositórios existentes, e domínio próprio custa (Registro.br ou o plano
  pago do Lovable).
- **Decisão:** um repositório (`atmavox/atmavox.github.io`) com duas features isoladas: `hub/` e `jornada/`.
- **Consequências:** ➕ um deploy, uma URL, identidade visual compartilhada. ➖ é preciso disciplina de
  fronteiras entre as pastas (regra no CLAUDE.md e no ESLint).

## ADR-002 · GitHub Pages numa organização, sem Lovable por enquanto

- **Status:** aceita · 2026-11-21
- **Contexto:** a URL não pode expor o usuário pessoal nem o nome do projeto, e tudo precisa ser grátis.
- **Decisão:** organização gratuita `atmavox` no GitHub, dona do repositório `atmavox.github.io`, publicado
  pelo GitHub Pages em `https://atmavox.github.io`. O repositório é público (exigência do Pages gratuito).
  O Lovable fica fora do fluxo: ele só sincroniza com repositórios que ele mesmo cria.
- **Consequências:** ➕ custo zero, URL limpa, a Andreia é dona da organização. ➖ código público (as
  respostas das pessoas não ficam no repositório). ➖ sem o editor visual do Lovable. Para usá-lo no futuro:
  criar o projeto no Lovable e copiar o código para o repositório que ele gerar.

## ADR-003 · React + TypeScript + Vite + Tailwind v4

- **Status:** aceita · 2026-11-21
- **Contexto:** o workbook nasceu como um HTML único gerado por IA (CSS, conteúdo e JS misturados).
- **Decisão:** React 19, TypeScript estrito, Vite, Tailwind v4 com tokens semânticos. É a mesma base do
  Lovable, o que mantém aberta a porta para usá-lo depois.
- **Consequências:** ➕ componentes reutilizáveis, tipos, bom suporte de IA. ➖ etapa de build (resolvida pelo
  GitHub Actions).

## ADR-004 · Clean Architecture enxuta na jornada

- **Status:** aceita · 2026-11-21
- **Contexto:** a jornada tem regras (progresso, merge, validação) e dois tipos de persistência.
- **Decisão:** camadas `domain` / `content` / `application` / `infrastructure` / `ui`, com portas e
  adaptadores. O hub fica sem camadas (é só conteúdo e layout).
- **Consequências:** ➕ regras testáveis sem navegador; trocar Firebase por outro backend não mexe na UI.
  ➖ mais arquivos do que um app simples teria.

## ADR-005 · Firebase opcional, carregado sob demanda

- **Status:** aceita · 2026-11-21
- **Contexto:** o login serve só para salvar o progresso; ninguém deve ser obrigado a criar conta.
- **Decisão:** Firebase Auth + Firestore (projeto `atmavox-ativacao`, plano Spark gratuito), importado com
  `import()` só quando configurado. `localStorage` sempre como base.
- **Consequências:** ➕ funciona offline e sem conta; quem não loga não baixa o SDK. ➖ precisa de merge ao
  logar (regra documentada e testada).

## ADR-006 · Sem roteador nem biblioteca de estado

- **Status:** aceita · 2026-11-21
- **Contexto:** poucas rotas e um único estado relevante (o progresso da jornada).
- **Decisão:** hash routing próprio (um hook) e um store pequeno com `useSyncExternalStore`.
- **Consequências:** ➕ menos dependências, nada de 404 no Pages. ➖ se o site crescer muito, reavaliar.

## ADR-007 · ESLint + Prettier

- **Status:** aceita · 2026-11-21
- **Decisão:** ESLint (já vem no template do Vite) com typescript-eslint, react-hooks, react-refresh e
  jsx-a11y; Prettier para formatação; `no-restricted-imports` para proteger as camadas.
- **Alternativa considerada:** Biome (mais rápido, uma ferramenta só), descartado por ter menos plugins
  (acessibilidade) e por não ser o padrão do Vite nem do Lovable.

---

## Modelo

```md
## ADR-00X · Título curto

- **Status:** proposta | aceita | substituída por ADR-00Y · AAAA-MM-DD
- **Contexto:** que problema ou força nos levou a decidir?
- **Decisão:** o que foi escolhido.
- **Alternativas consideradas:** o que ficou de fora e por quê.
- **Consequências:** ➕ ganhos · ➖ custos.
```
