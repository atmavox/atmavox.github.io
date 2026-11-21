# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/).

Categorias: **Adicionado**, **Alterado**, **Corrigido**, **Removido**, **Segurança**.
Ao terminar uma tarefa, o Claude Code registra a mudança em "Não lançado". Ao publicar, a seção vira uma
versão com data.

## [Não lançado]

### Adicionado

- Repositório `atmavox/atmavox.github.io` criado na organização `atmavox`.
- `CLAUDE.md` e pasta `.ai/` com propósito, convenções, stack, arquitetura, marca, glossário, features,
  decisões, roadmap e changelog.
- HTML original do workbook guardado em `.ai/reference/workbook-original.html`.
- `README.md` do projeto na raiz; o índice da `.ai/` passou para `.ai/README.md`.
- `.nvmrc` fixando o Node 24 LTS.
- Prettier (com `eslint-config-prettier`), jsx-a11y, Vitest + Testing Library + jsdom.
- Scripts `typecheck`, `test`, `test:watch`, `format`, `format:check` e `check`.
- `no-restricted-imports` protegendo as camadas (`domain/` e `content/` puros) e as fronteiras
  `hub/` ↔ `jornada/` ↔ `shared/`.
- `.gitattributes` forçando quebra de linha LF.
- Tailwind CSS v4 com os tokens da marca (escuro e claro) em `src/shared/theme/theme.css`.
- Fontes Jost e Playfair Display hospedadas no próprio site (Fontsource).
- Foco visível em âmbar e suporte a `prefers-reduced-motion`.
- Página "em breve" no hub: anéis da marca, título, áudio grátis, Instagram e WhatsApp.
- Estrutura `src/app`, `src/features/hub` e `src/shared` (`brand/links.ts`, `lib/whatsapp.ts`,
  `ui/BrandRings.tsx`), com testes.
- `index.html` em português (`lang="pt-BR"`), com título, descrição, Open Graph e favicon da marca.
- Workflow do GitHub Actions: checa e gera o build em todo push e PR; publica no Pages a cada push na
  `main`.

- Tema claro e escuro (F4): segue o sistema na primeira visita, guarda a escolha, sem "piscar"; botão
  sol/lua no hub.

- Domínio da jornada (`features/jornada/domain`): formato da jornada, progresso (dias, textos, emoções,
  humor, vitórias), leitura segura de dados salvos, merge aparelho + nuvem e validação de vitórias, com
  testes.
- Conteúdo dos 21 dias, revisões, vitórias e encerramento como dados tipados (`features/jornada/content`),
  conferido texto a texto contra o original.

### Corrigido

- Letras cirílicas no original: "Neutра" (dia 1) e "aprenди" (dia 3).
- Semana II definida duas vezes no original: ficou a versão mais completa.
- O áudio do dia 5 e a "aba Encerramento" do dia 21 viraram links clicáveis.
- O botão do Protocolo Presencial apontava para o Keepo; agora abre o WhatsApp com mensagem pronta.

### Removido

- Arquivos de exemplo do template do Vite (contador, logos, `App.css`, `index.css`, `icons.svg`).

### Alterado

- TypeScript estrito (`strict` e `noUncheckedIndexedAccess`) no app e na config do Vite.
- Versão do Node na documentação: de 22 para 24 LTS.
- ESLint de 10 para 9, por compatibilidade com o jsx-a11y (ADR-008).
- Tokens `text-faint`, `gray-state`, `accent` e `gold` ajustados para contraste AA (ver `brand.md`).
