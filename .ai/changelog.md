# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/).

Categorias: **Adicionado**, **Alterado**, **Corrigido**, **Removido**, **Segurança**.
Ao terminar uma tarefa, o Claude Code registra a mudança em "Não lançado". Quando a versão do
`site.json` sobe, a seção vira essa versão, com data (regras de versão em `conventions.md`).

## [Não lançado]

## [1.16.0] · 2026-11-23

### Adicionado

- Modo Andreía: editor para cada jornada (`#/jornada/{id}/editar`), aberto pelo produto. Jornada nova
  começa com o esqueleto da estrutura (dias vazios por semana ou em "Dias", um conteúdo por tema),
  com campo de Texto da Abertura. Até publicar, as participantes veem "ainda não está disponível".

## [1.15.0] · 2026-11-23

### Adicionado

- Jornada montada pela estrutura do produto: por semana (Semana I…N + Revisões), por tema (uma aba por
  tema, sem dias, com "Concluir tema ✦" abrindo o próximo) ou por dias (uma aba "Dias"). A Abertura
  de uma jornada nova mostra o título e a frase do produto; o cabeçalho mostra o nome da jornada.

## [1.14.0] · 2026-11-23

### Alterado

- Jornada: os dias abrem pelo calendário (ADR-024), um novo a cada 00h de Brasília a partir de "Começar
  a jornada", concluído ou não o anterior; dias que passaram ficam abertos. Dia fechado mostra quando
  abre, e a tela vira o dia sozinha. Quem já estava no meio continua com o que tinha aberto.

## [1.13.1] · 2026-11-23

### Corrigido

- Hubs: com a conta da Andreía, aparece a faixa azul do Modo Andreía (Editar a jornada, Produtos, Acessos)
  e o menu da bolinha ganha os mesmos atalhos.
- Jornada: botão "← Jornadas" no cabeçalho para voltar ao hub de jornadas.

## [1.13.0] · 2026-11-23

### Adicionado

- Imagem do banner dos produtos: no editor, "Escolher imagem" reduz a foto no aparelho (WebP) e guarda
  em `media/`; ela aparece em todo cartão do produto (vitrine, hubs, perfil, janelas de login e preço),
  com o fundo da marca enquanto carrega ou quando não há foto.

## [1.12.1] · 2026-11-23

### Corrigido

- Encontros na página inicial: "Um quadro recorrente, ao vivo no TikTok." no lugar de "Sem programação
  fixa…".

## [1.12.0] · 2026-11-23

### Adicionado

- Modo Andreía · Acessos (`#/admin/acessos`, mock aprovado): liberar um produto à mão pelo e-mail da
  pessoa, com o prazo do produto, para sempre ou até uma data; lista dos liberados (à mão ou por
  pagamento) com "Revogar" (pede confirmação) e "Renovar" nos vencidos.
- Ao entrar, a pessoa grava o próprio e-mail e nome em `users/{uid}` (só ela e a admin leem): é como a
  Andreía acha alguém. Regras novas no `firestore.rules` (publicar de novo, `firebase-setup.md` seção 9).

## [1.11.0] · 2026-11-23

### Adicionado

- Modo Andreía de produtos (`#/admin/produtos`, mock aprovado): no computador, lista de produtos ao lado
  e editor em blocos (Básico, Estrutura ou Mídia, Preço e acesso, Situação), com "Ver como fica no
  hub" antes de salvar; no celular, passo a passo (Tipo, Conteúdo, Preço e acesso, Situação) que termina
  em "Revisar". Salva o catálogo no Firestore, o `free` de cada conteúdo e os links das meditações
  (só para quem tem acesso). Atalhos no menu da conta da Andreía e na faixa do editor da jornada.
- O catálogo do site passa a vir do Firestore (`catalog/public`), guardado no aparelho; o do código
  fica como reserva.

### Alterado

- Publicar a jornada no editor não mexe mais no campo `free` (quem decide grátis ou paga é o catálogo).

### Corrigido

- Transições suaves no site todo: troca de página e de aba, janelas (login, preço, prévia) e menus
  entram devagar; botões e links mudam de cor com suavidade e "afundam" de leve ao clicar.
- Logo ao lado de "Atmavox" no cabeçalho da página inicial (computador).

## [1.10.0] · 2026-11-23

### Adicionado

- Página de perfil (`#/perfil`, mock aprovado), aberta por "Meu perfil" na bolinha da conta: abas
  Visão geral, Jornadas, Meditações e Conta (trocam ao clicar). A Visão geral mostra a trilha da jornada
  em andamento (trechos feitos, o próximo dia com "Continuar" e os que vêm depois) e os números (dias,
  reflexões, vitórias, meditações). Cada jornada e meditação diz o tipo de acesso: "Grátis", "Para
  sempre", "Até dd/mm/aaaa" ou "Venceu em…". O progresso é lido da conta, só os números (as reflexões
  não saem da jornada).

## [1.9.2] · 2026-11-23

### Alterado

- Login nos hubs: o cabeçalho dos hubs de jornadas e meditações (mock aprovado, opção 3) tem Início,
  Jornadas e Meditações em abas e a conta ("Entrar" ou a inicial, com menu); no celular, a barra de
  baixo vira Início · Jornadas · Meditações. A página inicial continua sem login.
- Sair da conta, pelo hub ou pela jornada, apaga as reflexões guardadas no aparelho (elas continuam na
  conta).

## [1.9.1] · 2026-11-23

### Corrigido

- A aba do navegador se chama "AtmaVox" em todas as páginas (vitrine, jornada e Modo Andreía).

## [1.9.0] · 2026-11-23

### Adicionado

- Pagamento pelo Mercado Pago (ADR-023): Worker gratuito na Cloudflare (`worker/`) que cria a cobrança
  com o preço do catálogo, confere a assinatura do aviso de pagamento, consulta o pagamento na API do
  Mercado Pago e grava o acesso; renovação soma o prazo, estorno tira o acesso daquele pagamento.
- Janela de preço com "Pagar e começar"/"Pagar e ouvir" (ligado por `VITE_PAYMENTS_URL`; sem ela,
  "Pagamento em breve") e página de retorno (`#/pagamento/…`): aprovado, em análise ou não concluído.
- Guia das contas e segredos em `.ai/pagamentos.md`.

### Corrigido

- Documentação cortada por um erro de script: ADR-017 (regra de versão), nota do login compartilhado
  em `features.md` e dois itens colados no roadmap.

## [1.8.1] · 2026-11-23

### Corrigido

- O vídeo da página inicial (ao pausar) e o mini player (ao fechar ou quando o áudio termina) saem
  devagar, esmaecendo e recolhendo em menos de meio segundo, em vez de sumir de uma vez. Sem animação
  para quem pede menos movimento no aparelho.

## [1.8.0] · 2026-11-23

### Adicionado

- Acesso pago (ADR-020): os acessos de quem entra são lidos com o login (`users/{uid}/access`); no hub,
  "Sua" e "Continuar" com acesso válido, preço e "Renovar" com acesso vencido, e o filtro "Minhas".
- Meditação paga com acesso: o conteúdo vem do Firestore com o token e a página mostra o player e
  "Baixar e-book" (só links https).
- Jornada paga sem acesso não abre: mostra que é paga e leva ao preço no hub.
- Regras do Firestore: catálogo público, conteúdo pago só com acesso (sem listar), acessos lidos só pela
  pessoa e gravados só pela admin ou pelo servidor; o editor grava `free` ao publicar. Passo a passo em
  `firebase-setup.md` (seção 8).
- Teste que impede conteúdo de produto pago de ficar no código do site.

### Corrigido

- Comentário do `JourneyEntry` com um caractere de controle.

## [1.7.0] · 2026-11-22

### Adicionado

- Login do site todo em `shared/auth` (ADR-022): quem entra no hub já está logado na jornada. No hub,
  depois do login, as gratuitas mostram "Grátis", as pagas o preço com cadeado, e aparece o filtro
  "Grátis" (jornadas e meditações).
- Produto pago: sem login, a janela de login abre no próprio hub mostrando o produto; depois, a janela
  de preço (mock F·2) com o que inclui, o prazo de acesso e o pagamento pelo Mercado Pago, ainda
  desativado ("Pagamento em breve") até a integração.

### Alterado

- A jornada só sincroniza o progresso por cima da sessão do site; o Firebase continua baixando só quando
  alguém entra.

## [1.6.2] · 2026-11-22

### Corrigido

- Menu do computador: Encontros, Sobre e Contato são trechos da página inicial, então "Início" continua
  marcado e o item clicado só pisca; Jornadas e Meditações, páginas próprias, ficam marcadas. Clicar de
  novo no trecho em que já se está volta a rolar até ele.

## [1.6.1] · 2026-11-22

Reúne as etapas D.1 a D.5 (uma minor cada: 1.2.0 a 1.6.0) e as correções pedidas no caminho (áudio de
boas-vindas novo e vídeo em largura total). As versões subiram juntas porque a regra de versão por etapa
entrou agora (`conventions.md`).

### Adicionado

- Catálogo de produtos em `shared/catalog` (ADR-019): tipos de jornada e meditação, leitura segura do
  catálogo vindo da nuvem (um produto quebrado não derruba os outros), regra única de tag e botão de cada
  produto (F9), prazo de acesso por meses de calendário, preço em reais e o catálogo inicial do código.
- Página inicial como vitrine (mock aprovado, direção 4; ADR-021): botões "Conhecer as jornadas" e
  "Ouvir uma meditação" no topo; fileira de jornadas do catálogo, sem preço, com "Em breve" e "Quero ser
  avisada"; meditações ("Pausas guiadas para voltar ao centro"), incluindo o vídeo "Retorne ao Seu
  Centro"; faixa dos encontros levando ao TikTok; frase da marca com a logo falando atrás; redes
  sociais; A Ativadora com as práticas e o botão "Ativação individual". Fileiras sem barra de rolagem:
  setas no computador (só quando sobra cartão), deslizar e pontinhos no celular.
- Hub de jornadas (`#/jornadas`, F9): visão expandida (cartões largos por território) e compacta (uma
  linha por jornada), com a escolha lembrada no aparelho; filtros abertos por padrão e recolhíveis
  (busca sem acento por nome, frase, território ou tema; territórios com contagem; disponíveis ou em
  breve; duração); "Limpar filtros" quando nada aparece. No celular, compacta por padrão, filtros que
  deslizam e botão "Filtros". Sem login, as pagas mostram "Pago" e nenhum preço.- Hub de meditações (`#/meditacoes`, F9): capas com tipo, play e tag; filtros por áudio, vídeo e e-book
  (só os que têm resultado); página de cada meditação (`#/meditacao/{id}`) com o áudio no player do site
  ou o vídeo. Boas-vindas e Retorne ao Seu Centro entram no catálogo; a vitrine e a aba Meditações do
  celular passam a usar ele. Na página inicial, o vídeo abre na largura toda da seção de meditações.- "Quem já viveu" pronto para depoimentos reais (carrossel com mais de um); fica escondido enquanto não
  houver nenhum.

- Jornada pede login (ADR-020): sem conta, o hub de jornadas fica desfocado e abre a janela "Entre para
  guardar sua jornada", com a jornada escolhida, Google, e-mail e senha; fechar volta ao hub. Quem já
  tinha entrado vê "Carregando…" enquanto a sessão volta, sem a janela piscar. Sem Firebase configurado
  (desenvolvimento e testes), a jornada abre direto.
- Rotas por jornada: `#/jornada/chama-interna-21/semana-1`. Os links antigos (`#/jornada/semana-1`)
  continuam abrindo a jornada de 21 dias; uma jornada que ainda não existe mostra "ainda não está
  disponível" com o caminho para o hub.

### Alterado

- Áudio de boas-vindas novo (gravação da Andreía), agora com música de fundo: 1 min, volume
  equilibrado com o resto do site (receita em `features.md`, F1 → Mídia).

- Celular: abas Início · Jornadas · Meditações · Contato ("Ouvir" virou "Meditações"; `#/ouvir` continua
  funcionando). Computador: menu Início, Jornadas, Meditações, Encontros, Sobre, Contato; "Jornadas"
  abre o hub numa página própria, e "Conhecer" nos cartões da vitrine leva a ele.
- Encontros sem horário: a faixa diz que acontecem como quadro ao vivo no TikTok e leva para lá (antes,
  "Horários no Instagram").
- Propósito do site: a página inicial vira vitrine, nascem os hubs de jornadas e de meditações, e
  jornadas e meditações podem ser pagas; jornadas passam a pedir login (`purpose.md`).
- Decisões registradas para o que vem: catálogo de produtos (ADR-019), login e acesso pago liberado por
  documento (ADR-020) e página inicial como vitrine (ADR-021); especificação F9 em `features.md` e
  modelo planejado em `architecture.md`.

## [1.1.0] · 2026-11-22

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
