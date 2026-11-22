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
- Jornada interativa em `#/jornada` (F2): Abertura com rastreador, Semanas I–III com os dias
  expansíveis, Revisões, Vitórias e Encerramento. Tudo o que se escreve, marca ou escolhe é salvo na
  hora no `localStorage` e continua lá ao recarregar.
- Rotas por hash e carregamento sob demanda da jornada (ADR-009).
- Marcação mínima nos textos (`**negrito**`, `*itálico*`, `[link](https://…)`) com `RichText`.
- Sincronização da jornada com a nuvem (F5, `application/account.ts`): mescla aparelho + nuvem ao entrar,
  envia mudanças com 800 ms de pausa, avisa quando está sem conexão e tenta de novo, e ao sair envia o
  pendente e apaga o progresso do aparelho. Testada com nuvem e login em memória.
- Firebase sob demanda (ADR-012): login com Google e e-mail/senha, recuperação de senha, mensagens de erro
  em português, Firestore "lite" em `users/{uid}/journeys/{journeyId}`, regras de segurança em
  `firestore.rules`, `.env.example` e variáveis do Firebase no deploy.
- Login na jornada (F5): botão "Entrar" no cabeçalho (só aparece com o Firebase configurado), janela com
  Google ou e-mail/senha, criar conta e recuperar senha; depois de entrar, a inicial da pessoa com um
  ponto de status ("Salvando…", "Salvo na nuvem", "Sem conexão — salvo no aparelho") e "Sair da conta"
  com confirmação. A janela deixa o resto da página inerte e fecha com Esc.
- Hub novo (F1, ADR-010) no lugar da página "em breve": abas no celular (Início · Ouvir · Jornadas ·
  Contato) e revista a partir de 700 px, com áudio grátis, encontros Zerando o Dia e Pausa Sagrada,
  jornadas, sobre a Andreía, redes e assinatura. O que ainda falta (horários, foto, MP3, algumas redes)
  fica escondido ou com alternativa, sem marcadores `[...]` no site.
- TikTok (@atmavox) nas redes do hub; corrige o link quebrado que existia no Keepo.
- Mídia (ADR-011, `shared/media`): player de áudio único para o site todo, com mini player fixo (pausar,
  voltar 15 s, posição, fechar), controles na tela bloqueada (Media Session) e vídeos do YouTube com
  fachada (o player só carrega ao tocar). Ícones com `lucide-react`.
- Abas com evolução (F3): cada aba vai do cinza ao âmbar conforme o progresso, com barrinha, legenda
  (`14%`, `3/7`, `4/11`…) e ✦ quando completa; barra de progresso geral no cabeçalho.

### Segurança

- `@grpc/grpc-js` (dependência do Firebase) forçado para `^1.14.7`: `npm audit` sem vulnerabilidades.

### Corrigido

- Letras cirílicas no original: "Neutра" (dia 1) e "aprenди" (dia 3).
- Semana II definida duas vezes no original: ficou a versão mais completa.
- O áudio do dia 5 e a "aba Encerramento" do dia 21 viraram links clicáveis.
- O botão do Protocolo Presencial apontava para o Keepo; agora abre o WhatsApp com mensagem pronta.
- Reflexões, emoções, humor e vitórias sumiam ao recarregar no original; agora tudo é salvo.
- Vitórias eram montadas com `innerHTML` (injeção de HTML); agora são texto puro (com teste).

### Removido

- Arquivos de exemplo do template do Vite (contador, logos, `App.css`, `index.css`, `icons.svg`).

### Alterado

- Reposicionamento da marca na documentação: slogan "Consciência, presença e expansão", tom de voz por
  perguntas e sem venda, assinatura "Com presença — Andreía Oliveirà", grafia oficial do nome e
  especificação nova do hub (abas no celular, revista no computador; ADR-010 e ADR-011).
- No site: slogan novo no título, na descrição e no hub; assinatura "Com presença — Andreía Oliveirà" no
  hub e no Encerramento da jornada; mensagem pronta do WhatsApp com "Olá, Andreía!".

- TypeScript estrito (`strict` e `noUncheckedIndexedAccess`) no app e na config do Vite.
- Versão do Node na documentação: de 22 para 24 LTS.
- ESLint de 10 para 9, por compatibilidade com o jsx-a11y (ADR-008).
- Tokens `text-faint`, `gray-state`, `accent` e `gold` ajustados para contraste AA (ver `brand.md`).
- Paleta nova: escuro "Sépia" e claro "Areia" (o claro anterior, quase branco, ofuscava). Favicon e
  `theme-color` acompanham.
