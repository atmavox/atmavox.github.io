# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/).

Categorias: **Adicionado**, **Alterado**, **Corrigido**, **Removido**, **Segurança**.
Ao terminar uma tarefa, o Claude Code registra a mudança em "Não lançado". Quando a versão do
`site.json` sobe, a seção vira essa versão, com data (regras de versão em `conventions.md`).

## [Não lançado]

### Adicionado

- App na tela inicial (PWA, F8): `manifest.webmanifest` com abertura sem a barra do navegador e cores
  Areia, ícones 192/512/maskable/Apple gerados por `scripts/generate-pwa-icons.ps1`, metatags da Apple e
  teste do manifest (ADR-018).

### Alterado

- Logo nova "Forma de onda": cinco barras de áudio simétricas, a do centro em âmbar e "falando" devagar.
  Substitui os "Anéis nítidos", que pareciam um alvo. Vale para o favicon, o hub, a capa da jornada e o
  README (`shared/ui/BrandMark.tsx`, que substitui o `BrandRings.tsx`).
- Hub no computador: a logo pequena acima do título saiu; no lugar, a logo grande e transparente (25%)
  no fundo do topo, cortada pela borda esquerda, com as barras "falando" bem devagar.
- Hub no celular: logo pequena e parada ao lado de "ATMAVOX" no cabeçalho.
- Logo com tokens próprios (`--logo`, `--logo-center`), iguais às cores do favicon.

## [1.0.0] · 2026-11-22

Primeira versão numerada: tudo o que foi feito até o site entrar no ar.

### Adicionado

- Controle de versão do site: `site.json` (site, cliente e versão) mostrado no rodapé do hub; o
  `package.json` acompanha (ADR-017).
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
- Logo nova "Anéis nítidos": fundo transparente, anéis grossos e ponto âmbar maior; o favicon se adapta ao
  navegador claro ou escuro, e os anéis do site seguem o mesmo desenho.
- Lixeira em cada cartão do quadro de todos os dias (Modo Andreía), com a mesma confirmação do editor.
- "Apagar dia" no Modo Andreía: botão no editor do dia, com confirmação. O dia sai do rascunho salvo
  (e do ar ao publicar); o número dele fica aposentado para nenhum dia novo herdar respostas antigas;
  nenhuma semana fica vazia. A barra de progresso geral passa a contar os dias que a jornada tem hoje.
- Controle de volume no mini player: alto-falante (toca para silenciar e voltar) e barra fina horizontal,
  no estilo da barra de posição. Começa em 70% e lembra a escolha na próxima visita. No iPhone/iPad, onde
  o Safari só aceita os botões do aparelho, o controle não aparece.
- Retrato da Andreía em alta definição no hub: a imagem (gerada por IA, pequena no Keepo) foi ampliada 4×
  com o Real-ESRGAN, rodando no computador do desenvolvedor, e misturada ao original (65/35, com grão
  leve) para não ficar com pele "pintada". Três larguras: 600, 1200 e 1800 px (18, 40 e 68 kB).
- Documentação do Modo Andreía (Fase 4, passo 7): F7 em `features.md`, coleções e regras do Firestore
  em `architecture.md`, `guia-modo-andreia.md` (passo a passo simples para ela) e roadmap da Fase 4
  com as pendências.
- Bloco de imagem (Fase 4, passo 6, ADR-014): no Modo Andreía, "Escolher imagem" reduz a foto no
  navegador (WebP até 1200 px, ~200 kB) e grava no Firestore; a descrição para leitor de tela é
  obrigatória e a legenda, opcional. Na jornada, a imagem aparece com a descrição e a legenda, lida por
  REST sem carregar o Firebase.
- Blocos novos na tela da participante (Fase 4, passo 5): texto, citação, divisor, vídeo e áudio por
  link. YouTube aparece com a miniatura e só carrega ao tocar; arquivo de áudio toca no player do site;
  links de outros sites (Drive, SoundCloud, Instagram, Vimeo…) viram um cartão que abre o link numa aba
  nova. No editor, uma dica explica como cada link de áudio vai aparecer.
- Modo Andreía refeito fiel ao protótipo aprovado (`Downloads/atmavox-modo-admin-v2.html`): barra
  azul-petróleo no topo (tokens `admin`, `ok`, `draft`), quadro com cartões por semana (arrastar ou
  setas para reordenar, "X de Y dias salvos", "Ver como participante", confirmação antes de publicar),
  dia como documento editável no lugar (cada texto se edita com um clique, ferramentas ao passar o
  mouse, "+" entre blocos com ladrilhos de ícones próprios), histórico em gaveta lateral e avisos curtos
  no rodapé. Na jornada, a admin vê uma faixa azul com "Editar a jornada →".
- Botão "Entrar com Google" com o logo oficial do Google.
- Modo Andreía, editor da jornada (Fase 4, passo 4, ADR-015): botão "Editar a jornada" no menu da
  conta admin leva a `#/jornada/editar`. Visão geral com os dias por semana e o estado de cada um, tema
  da semana, novo dia e ordem dos dias; editor de cada dia com blocos (ritual, pergunta, afirmação,
  fechamento, check-in, texto, citação, divisor, vídeo e áudio por link), "Salvar dia", "Descartar",
  "Publicar jornada" (só sem rascunhos e sem campos faltando) e histórico com "Voltar para esta versão".
- Papel de admin (Fase 4, passo 3): ao entrar, o site confere se existe `admins/{uid}`; a admin vê a
  jornada inteira sem cadeados e o menu da conta mostra "Modo Andreía". Regras do Firestore: só a admin
  grava a versão publicada, os rascunhos e as imagens; cada pessoa só lê o próprio `admins/{uid}`.
- Conteúdo da jornada pode vir da nuvem (Fase 4, passo 2): o site abre com a cópia do aparelho ou a
  versão do código e troca pela versão publicada em `published/{journeyId}` quando ela chega, lida por
  `fetch` na API REST do Firestore (quem não loga continua sem baixar o SDK). Conteúdo inválido, de
  outra jornada ou nuvem fora do ar são ignorados. Regra de leitura pública em `firestore.rules`.
- Base do modo Andreía (Fase 4, passo 1): cada bloco do dia tem um id fixo, tipos novos de bloco
  (texto, citação, divisor, imagem, vídeo e áudio por link; os só de leitura não pedem "Feito"), a
  sequência dos dias segue a ordem na jornada e o rastreador da Abertura acompanha a quantidade de dias.
  Leitura segura de jornada vinda da nuvem (`parseJourney`): recusa blocos desconhecidos, ids repetidos
  e links que não sejam http(s).
- Jornada em sequência (ADR-013): etapas do dia com "Feito ✦", dias que abrem só depois do anterior,
  abas na ordem Abertura → Semanas → Revisões → Vitórias → Encerramento, com cadeados e aviso para
  links de abas ainda fechadas; botão "Começar a jornada" / "Continuar no dia N" na Abertura.
- Cabeçalho da jornada em duas linhas: no computador as 7 abas dividem a largura toda (antes "Vitórias"
  ficava cortada e "Encerramento" sumia), com barras e legendas maiores e o % geral da jornada; no celular
  a aba atual se centraliza sozinha. Conteúdo um pouco mais largo no computador.
- Áudio de boas-vindas tratado: sem o ruído de fundo ("crunchy"), silêncios totais nas pausas e voz
  nítida, com volume no padrão de podcast (−16 LUFS).
- Tema claro ("Areia") é o padrão na primeira visita; quem já escolheu um tema continua nele.
- Retrato da Andreía (a foto do Keepo, em WebP de 13 e 33 kB) no início do hub, junto da mensagem "Um
  espaço para perceber, questionar e experimentar. Com Andreía Oliveirà.", e como foto redonda em "Sobre".
- O mini player fecha sozinho quando o áudio termina.
- Mini player agora é uma barra fina no topo, logo abaixo do cabeçalho (no celular o cabeçalho do hub
  ficou fixo para o player continuar visível).
- README novo, com apresentação do projeto, como rodar, deploy, custo zero e roadmap.
- Áudio de boas-vindas (48 s) no cartão "Comece aqui" do hub, tocando no player do site com mini player;
  o vídeo do YouTube saiu da tela inicial (fica para a jornada, dia 5).
- Firebase configurado no projeto `atmavox-b72a4`; o deploy lê as variáveis das Variables ou dos Secrets
  do GitHub.
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

- A barra de progresso do mini player andava aos saltos (o navegador só informa a posição ~4x por
  segundo) e parecia travada; agora acompanha o áudio a cada quadro da tela, sem saltos.
- O áudio da página inicial (e o mini player) ia junto para a jornada. Agora, ao passar do hub para a
  jornada ou o contrário, o som para e o mini player fecha; trocar de aba na mesma área não interrompe
  (ADR-016, com teste).
- Dias criados no Modo Andreía (22 em diante) não podiam ser concluídos: o progresso só aceitava os
  dias 1 a 21. Agora aceita qualquer dia da jornada (com teste).

- No celular, a página da jornada "arrastava" para o lado: os textos só para leitor de tela das abas
  (posição absoluta) escapavam da fileira de abas e alargavam a página para 625 px numa tela de 375 px.

- Letras cirílicas no original: "Neutра" (dia 1) e "aprenди" (dia 3).
- Semana II definida duas vezes no original: ficou a versão mais completa.
- O áudio do dia 5 e a "aba Encerramento" do dia 21 viraram links clicáveis.
- O botão do Protocolo Presencial apontava para o Keepo; agora abre o WhatsApp com mensagem pronta.
- Reflexões, emoções, humor e vitórias sumiam ao recarregar no original; agora tudo é salvo.
- Vitórias eram montadas com `innerHTML` (injeção de HTML); agora são texto puro (com teste).

### Removido

- Desmarcar dias concluídos e marcar dias pelo rastreador da Abertura (a jornada agora só avança).

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
