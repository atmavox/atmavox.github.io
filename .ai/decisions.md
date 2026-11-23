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
- **Decisão:** Firebase Auth + Firestore (projeto planejado como `atmavox-ativacao`; criado em 2026-11-21
  com o nome `atmavox` e ID `atmavox-b72a4`, porque `atmavox` já existia; plano Spark gratuito), importado com
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

## ADR-008 · ESLint 9 em vez do 10, por causa do jsx-a11y

- **Status:** aceita · 2026-11-21
- **Contexto:** o template do Vite veio com ESLint 10, mas o `eslint-plugin-jsx-a11y` (6.10.2, a versão mais
  recente) só aceita até o ESLint 9. As regras de acessibilidade são exigência do projeto (público leigo,
  contraste AA, foco visível).
- **Decisão:** usar ESLint 9.39 com o jsx-a11y oficialmente compatível.
- **Alternativas consideradas:** forçar o plugin no ESLint 10 com `overrides` (sem suporte, pode quebrar sem
  aviso); ficar sem jsx-a11y e checar acessibilidade só no Lighthouse (perde o aviso na hora de codar).
- **Consequências:** ➕ lint de acessibilidade funcionando e suportado. ➖ o npm avisa que o ESLint 9 não é mais
  suportado; como é ferramenta só de desenvolvimento (não vai para o site), o risco é baixo. Quando o
  jsx-a11y aceitar o ESLint 10, atualizar e marcar esta decisão como substituída.

## ADR-009 · Jornada carregada sob demanda por uma porta de entrada

- **Status:** aceita · 2026-11-21
- **Contexto:** quem chega pela bio cai no hub; a maioria não abre a jornada. E a `ui/` não deve
  importar `infrastructure/` (regra de dependência).
- **Decisão:** `features/jornada/JourneyEntry.tsx` cria os serviços (`createServices`) e monta a
  `JourneyApp` dentro do `JourneyContext`. O `app/App.tsx` carrega esse arquivo com `React.lazy`.
- **Consequências:** ➕ o hub não baixa o código da jornada (~13 kB gzip a menos); a `ui/` só conhece
  interfaces. ➖ um instante de carregamento ao abrir a jornada pela primeira vez.

## ADR-010 · Hub com duas estruturas: abas no celular, revista no computador

- **Status:** aceita · 2026-11-21
- **Contexto:** o público chega pelo Instagram no celular, mas o site também será aberto no computador.
  Foram comparados três layouts em protótipos clicáveis (lista, revista, app com abas) em quatro tamanhos.
- **Decisão:** abaixo de 700 px, "app com abas" (Início · Ouvir · Jornadas · Contato, barra embaixo); a
  partir de 700 px, "revista" (página única com menu no topo). Os blocos (cartões de áudio, encontro,
  jornada, redes) são os mesmos componentes nas duas; só a composição muda. A escolha é feita por
  `matchMedia` (um hook), não por CSS escondendo uma das duas, para não duplicar o DOM nem ids.
- **Alternativas consideradas:** uma estrutura só com CSS responsivo (mais simples, mas abas no
  computador ou página longa no celular pioravam a experiência de um dos lados).
- **Consequências:** ➕ cada tela tem a navegação que lhe cabe; rotas `#/ouvir` etc. funcionam nas duas.
  ➖ duas composições para manter (os blocos são compartilhados para limitar isso).

## ADR-011 · Player de áudio próprio e vídeos com fachada

- **Status:** aceita · 2026-11-21
- **Contexto:** o site vai ter áudios (práticas, encontros gravados) e vídeos. Embutir o YouTube direto
  pesa (~1 MB por player), rastreia e o áudio para quando a tela do celular bloqueia.
- **Decisão:** áudios em MP3 servidos pelo próprio GitHub Pages (`public/audio/`), tocados por um
  `<audio>` único controlado por um store em `shared/` (mini player persistente, Media Session para a
  tela bloqueada). Vídeos do YouTube como fachada: miniatura + botão; o iframe de
  `youtube-nocookie.com` só entra ao tocar.
- **Alternativas consideradas:** só YouTube (simples, mas visual e comportamento ruins para áudio);
  serviços de podcast/SoundCloud (contas externas, visual de terceiros).
- **Consequências:** ➕ leve, bonito, funciona com a tela bloqueada, custo zero. ➖ arquivos de áudio no
  repositório (manter cada um com poucos MB; o Pages tem limite de 1 GB por site).

## ADR-012 · Firestore "lite" e login do Google por janela

- **Status:** aceita · 2026-11-21
- **Contexto:** a nuvem só guarda um documento por pessoa e jornada; não precisamos de tempo real nem de
  cache offline do Firestore (o `localStorage` já é a base).
- **Decisão:** `firebase/firestore/lite` (REST, bem menor) + `firebase/auth`, num chunk carregado sob
  demanda. Google entra por janela (`signInWithPopup`); se o navegador bloquear, cai para redirecionamento.
  `@grpc/grpc-js` forçado para `^1.14.7` via `overrides` (alerta de segurança; só é usado no Node, não no
  site).
- **Consequências:** ➕ ~62 kB gzip só para quem loga; nada muda para quem não loga. ➖ sem atualização em
  tempo real entre dois aparelhos abertos ao mesmo tempo (vale o merge ao entrar e o último envio).

## ADR-013 · Jornada em sequência: só avança quem completa a etapa anterior

- **Status:** aceita · 2026-11-21
- **Contexto:** pedido do cliente: a participante só passa para a próxima etapa quando a anterior está
  completa, valendo para etapas do dia, dias, semanas e abas. Antes, tudo ficava aberto e qualquer dia
  podia ser marcado no rastreador.
- **Decisão:** regras puras em `domain/access.ts` (etapas, dias, revisões) e `application/tabAccess.ts`
  (ordem das abas). O progresso ganha `completedSteps` (etapas com "Feito"; união no merge). Concluir um
  dia e marcar "Feito" são **definitivos** (não há desmarcar), para a sequência não se desfazer. Progresso
  feito antes da regra é **respeitado** (dia/aba com qualquer resposta ou marcação continua aberto). A
  admin tem `bypass`, pronto para a Fase 4.
- **Alternativas consideradas:** bloqueio por data (um dia por dia de calendário), descartado pelo cliente
  (o próximo dia abre na hora).
- **Consequências:** ➕ a jornada é vivida na ordem pensada pela Andreía; regra testada sem tela.
  ➖ não dá para "pular" para ver o conteúdo adiante (só a admin, no modo dela).

## ADR-014 · Imagens do modo admin no Firestore; vídeo e áudio por link

- **Status:** aceita · 2026-11-21
- **Contexto:** o modo Andreía (Fase 4) precisa de imagens nos blocos. O Firebase Storage não tem plano
  gratuito para projetos novos; o padrão usado em outro projeto do desenvolvedor (omni-sheet-vault: MinIO
  numa VM Oracle Always Free, com backend que assina links) e a alternativa Cloudflare R2 exigem cartão e
  um backend para guardar a chave secreta, que este site estático não tem.
- **Decisão:** imagens reduzidas no navegador para WebP (~100–200 kB) e gravadas como documentos numa
  coleção do Firestore (limite de 1 MB por documento), com regras que só deixam a admin gravar. Vídeos
  são só links. Áudios são links ou arquivos incluídos pelo desenvolvedor no repositório.
- **Alternativas consideradas:** Cloudflare R2 + Worker (cartão para ativar); MinIO na VM Oracle (cartão
  na verificação, VM para manter, acoplamento com outro projeto); imagens no repositório via API do GitHub
  (exigiria um token no navegador).
- **Consequências:** ➕ custo zero, nenhum serviço ou conta nova, nada muda para quem não é admin.
  ➖ serve para poucas imagens por jornada; leituras contam na cota diária do Firestore (folgada para o
  público esperado); se um dia houver muitas imagens, reavaliar.

## ADR-015 · Conteúdo editável: rascunho, publicada e histórico como JSON no Firestore

- **Status:** aceita · 2026-11-21
- **Contexto:** o modo Andreía edita a jornada sem desenvolvedor, com "Salvar dia" e "Publicar" separados
  (Fase 4). As participantes não podem baixar o SDK do Firebase só para ler o conteúdo, e conteúdo
  quebrado não pode chegar à tela delas.
- **Decisão:** a jornada inteira vai como um JSON num campo `content`: `drafts/{id}` (rascunho salvo),
  `published/{id}` (no ar) e `drafts/{id}/versions/{auto}` (uma cópia por publicação). As participantes
  leem `published` por `fetch` na API REST; o site guarda uma cópia no aparelho e usa a versão do código
  se a nuvem falhar. Tudo que vem da nuvem passa por `parseJourney`. Edições não salvas ficam no aparelho
  da Andreía. O **número do dia é a identidade** (respostas `d{n}:…`); a ordem na jornada define a
  sequência, então reordenar não mistura respostas. Blocos novos ganham ids novos; remover um bloco não
  apaga respostas.
- **Alternativas consideradas:** um documento por dia (mais leituras e publicação não atômica);
  conteúdo no repositório com commit pela API do GitHub (exigiria token no navegador).
- **Consequências:** ➕ publicação atômica, leitura leve, histórico com "voltar para esta versão".
  ➖ limite de 1 MB por documento (a jornada tem ~60 kB); editar revisões e encerramento fica para depois.

## ADR-016 · Cada área do site tem o seu áudio

- **Status:** aceita · 2026-11-22 · ajusta o ADR-011 (que deixava o som seguir por todas as páginas)
- **Contexto:** o áudio de boas-vindas da página inicial continuava tocando, com o mini player, ao entrar
  na jornada. O cliente considerou isso um defeito: a jornada tem os próprios áudios e ritmo.
- **Decisão:** o player continua único, mas ao passar do hub para a jornada (ou o contrário) o que estava
  tocando para e o mini player fecha (`useStopAudioOnAreaChange` no `App.tsx`). Dentro da mesma área,
  trocar de aba não interrompe o som.
- **Consequências:** ➕ cada área começa em silêncio; continua um `<audio>` só. ➖ quem quiser ouvir o
  áudio da página inicial enquanto faz a jornada não consegue (não é um uso esperado).

## ADR-017 · Versão do site no `site.json`

- **Status:** aceita · 2026-11-22
- **Contexto:** o cliente quer saber qual versão do site está no ar e controlar quando ela muda.
- **Decisão:** `site.json` na raiz guarda `site`, `client` e `version` (SemVer). O site lê o arquivo por
  `shared/brand/site.ts`, que valida o formato, e mostra a versão no rodapé. O `package.json` repete a
  mesma versão, e um teste garante que as duas não se separam. **Major** e **minor** sobem só quando o
  desenvolvedor pede; **patch** o Claude sobe a cada correção ou ajuste pequeno. _Atualizado em
  2026-11-22:_ **minor** sobe a cada etapa terminada e **patch** a cada correção pedida, sem esperar
  pedido; **major** continua só quando o desenvolvedor pede (`conventions.md`).
- **Alternativas consideradas:** só o `package.json` (o cliente pediu um arquivo com o nome do site e do
  cliente); injetar a versão no build pelo Vite (mais uma configuração sem ganho real).
- **Consequências:** ➕ versão visível e conferida por teste. ➖ duas cópias do número (protegidas pelo
  teste).

## ADR-018 · PWA só com manifest, sem service worker (por enquanto)

- **Status:** aceita · 2026-11-22
- **Contexto:** ao "baixar" o site no celular, ele abria com a barra do navegador e a barra de botões
  branca: sem manifest, o Android cria só um atalho para uma página do navegador.
- **Decisão:** `public/manifest.webmanifest` com `display: standalone` e cores Areia, ícones PNG gerados por
  `scripts/generate-pwa-icons.ps1` (System.Drawing, sem dependência nova) e as metatags da Apple no
  `index.html`. Sem service worker e sem plugin (ex.: `vite-plugin-pwa`).
- **Alternativas consideradas:** `vite-plugin-pwa` com Workbox (resolve o uso offline, mas um service
  worker mal configurado pode servir versões velhas do site depois de cada deploy; fica para quando o
  offline for prioridade, item "PWA offline" do roadmap); gerar os ícones com `sharp` (mais uma dependência
  para um trabalho feito uma vez).
- **Consequências:** ➕ app instalável e sem barra do navegador, sem risco de cache velho, zero dependências.
  ➖ não funciona offline; o script de ícones só roda no Windows.

## ADR-019 · Jornadas e meditações como produtos de um catálogo

- **Status:** aceita · 2026-11-22 (mocks aprovados: `Downloads/atmavox-pagina-inicial.html` e
  `Downloads/atmavox-hubs.html`)
- **Contexto:** o site deixa de ter uma jornada só. A página inicial vira vitrine, nascem o hub de
  jornadas e o de meditações, e a Andreía quer criar jornadas e meditações grátis ou pagas, com preço e
  prazo de acesso. A vitrine precisa saber o que existe sem baixar o conteúdo de nada.
- **Decisão:** um **catálogo** público separado do conteúdo.
  - `catalog/public` guarda, como JSON num campo `content` (mesmo padrão do ADR-015), a lista de
    produtos: só o que a vitrine e os hubs mostram (nome, frase, banner, território, estrutura, temas,
    duração, preço, prazo, destaque, ordem, status). Lido por REST, sem login e sem o SDK.
  - O **conteúdo** de cada produto continua em `published/{productId}` (jornada: dias e blocos;
    meditação: link do áudio ou vídeo e do e-book), com a cópia `free` do catálogo para as regras.
  - O **id do produto** é um slug imutável (ex.: `chama-interna-21`): é a chave do progresso
    (`users/{uid}/journeys/{id}`), do acesso e das rotas. Renomear muda só o título.
  - Tipos e regras puras (formato, `parseCatalog`, qual tag mostrar) ficam em `src/shared/catalog/`,
    porque o hub e a jornada usam os dois. Modelo completo em `architecture.md` e regras de tela em
    `features.md` (F9).
- **Alternativas consideradas:** um documento por produto (uma leitura por cartão na vitrine);
  catálogo no código (a Andreía não conseguiria criar produtos sem desenvolvedor); manter tudo em
  `published` (a vitrine baixaria o conteúdo inteiro, inclusive o pago).
- **Consequências:** ➕ uma leitura para montar a vitrine e os hubs; conteúdo pago nunca passa pela
  vitrine; mesmo formato para jornadas e meditações. ➖ o catálogo e o `published` precisam ser gravados
  juntos (em lote) para o `free` não divergir; limite de 1 MB no catálogo (folgado: cada produto tem
  ~1 kB).

## ADR-020 · Login nas jornadas e acesso pago liberado por documento

- **Status:** aceita · 2026-11-22 · muda o ADR-015 (o `published` deixa de ser leitura pública para
  tudo) e o `purpose.md` (a jornada era aberta e sem login)
- **Contexto:** jornadas e meditações podem ser pagas. Num site estático no GitHub Pages, tudo que está
  no código é público; e no plano gratuito do Firebase não há Cloud Functions para validar compras.
- **Decisão:**
  - **Jornadas pedem login**, grátis ou pagas: o progresso e o acesso ficam na conta. Quem já tinha
    progresso no aparelho entra e o merge de sempre junta tudo. **Meditações grátis** tocam sem login;
    as pagas pedem login.
  - **Acesso** = documento `users/{uid}/access/{productId}` com `grantedAt`, `expiresAt` (ou `null` para
    sempre), `source` (`manual` ou `payment`) e `ref` (o pagamento). A pessoa só lê o próprio; **só a
    admin grava** (liberação manual no Modo Andreía). Um pagamento automático, se vier (Fase 5, passo
    7), grava com credencial de servidor, que não passa pelas regras.
  - **Regras:** `published/{id}` só é lido (`get`, nunca `list`) se `free == true`, se a pessoa tem
    acesso válido (`expiresAt` nulo ou no futuro) ou se é admin. Quem tem acesso lê por REST com o token
    do login.
  - **Conteúdo pago sai do código do site:** a cópia da jornada que hoje vai no código (usada se a nuvem
    falhar) deixa de existir para produtos pagos; sem nuvem, a tela pede para tentar de novo.
  - **Fluxo de tela** (mock aprovado): vitrine sem preço; no hub, "Pago" antes do login; "Começar" abre o
    login sobre a tela desfocada; depois do login, a janela de preço (só se paga e sem acesso).
  - **Acesso vencido:** o progresso continua guardado; o conteúdo volta a mostrar o preço para renovar.
- **Alternativas consideradas:** conteúdo pago no código com "cadeado" só na tela (qualquer pessoa lê no
  código-fonte); liberar por _custom claims_ (exige Cloud Functions, plano pago); senha por jornada
  (fácil de repassar e sem prazo).
- **Consequências:** ➕ custo zero; quem não pagou não recebe o conteúdo; a Andreía consegue liberar
  acesso à mão desde o primeiro dia, antes de qualquer integração de pagamento. ➖ proteção "suave":
  links de vídeo, áudio e e-book podem ser repassados por quem tem acesso; o repositório é público, então
  o **histórico do git** continua com a jornada de 21 dias e o `workbook-original.html` (apagar o
  histórico exigiria reescrever a `main`; aceito pelo desenvolvedor em 2026-11-22). O **e-book** é um
  link para baixar o documento (ex.: Google Drive), guardado só no `published`; cada leitura de
  conteúdo pago custa uma leitura extra (o documento de acesso), folgado na cota gratuita.

## ADR-021 · Página inicial como vitrine; textos fixos no código por enquanto

- **Status:** aceita · 2026-11-22 · complementa o ADR-010 (as duas estruturas, abas no celular e revista
  no computador, continuam)
- **Contexto:** a página inicial aprovada mostra jornadas em destaque, meditações, encontros, frase de
  efeito, depoimentos, redes e A Ativadora. Os encontros não têm horário fixo: acontecem como quadro ao
  vivo no TikTok.
- **Decisão:** jornadas e meditações da vitrine vêm do catálogo (ADR-019), pelo `featured` e pela
  `order`. Encontros, frases, depoimento (um, de exemplo, até a Andreía mandar os reais), redes e A
  Ativadora continuam em `features/hub/content.ts`. Os encontros perdem os horários e apontam para o
  TikTok. Esses textos vão para o Firestore só quando o Modo Andreía precisar editá-los.
- **Alternativas consideradas:** tudo no Firestore já agora (mais leituras e telas de edição que ainda
  ninguém pediu).
- **Consequências:** ➕ a vitrine muda sozinha quando a Andreía publica um produto; menos trabalho agora.
  ➖ trocar frase, depoimento ou encontro ainda pede desenvolvedor.

## ADR-022 · Login do site em `shared/auth`, com a jornada sincronizando por cima

- **Status:** aceita · 2026-11-22 · ajusta o ADR-005 (o Firebase continua carregando sob demanda)
- **Contexto:** o login vivia dentro da jornada (`account.ts`), misturado com a sincronização do
  progresso. O hub agora também precisa dele: preço e "Grátis" depois do login, e login antes de comprar
  uma jornada ou meditação paga (ADR-020). O hub e a jornada não podem importar um do outro.
- **Decisão:**
  - `shared/auth` guarda a **sessão do site** (`createAuthSession`): quem está logado, entrar com Google
    ou e-mail, sair, token para leituras protegidas e a sessão lembrada no aparelho. Também a janela de
    login (`LoginDialog`) e o Firebase Auth (`loadFirebaseAuth`), baixado só quando alguém entra.
  - `app/` cria a sessão uma vez e a entrega pelo `AuthContext` (`null` sem as variáveis do Firebase).
  - A jornada (`createAccount`) recebe a sessão e só cuida do que é dela: mesclar e enviar o progresso,
    o papel de admin e o editor. A nuvem da jornada usa o mesmo app do Firebase (`getFirebaseApp`).
  - No hub, `usePurchaseFlow` decide o caminho de um produto pago: login (mostrando o produto) e depois
    a janela de preço.
- **Alternativas consideradas:** o hub importar a conta da jornada (quebra a fronteira entre as
  features); duas sessões independentes (o Firebase teria dois "logados" que podem divergir).
- **Consequências:** ➕ um login só, visto pelo site inteiro; a jornada ficou menor; testes com
  `createTestAccount`. ➖ a sessão e a conta são dois objetos para manter em sincronia (a conta escuta a
  sessão); `shared/` passou a conhecer o Firebase (a regra do ESLint ganhou uma exceção para `firebase/*`).

## ADR-023 · Pagamento pelo Mercado Pago com um Worker gratuito na Cloudflare

- **Status:** aceita · 2026-11-23 (escolha do desenvolvedor e da Andreía em 2026-11-22)
- **Contexto:** jornadas e meditações pagas precisam de cobrança automática, sem mensalidade e sem
  expor chaves num site estático. O plano gratuito do Firebase não tem Cloud Functions.
- **Decisão:**
  - **Mercado Pago Checkout Pro**: a pessoa paga na página do Mercado Pago (Pix ou cartão); o site
    nunca vê dados de pagamento. Sem mensalidade; taxa por venda (Pix ~0,99%).
  - **Worker na Cloudflare** (`worker/`, plano gratuito), com três rotas:
    - `POST /checkout`: confere o token de login do Firebase (assinatura do Google, projeto, prazo),
      lê o preço **no catálogo** (do Firestore, ou o do código) e cria a cobrança, com
      `external_reference = uid|produto` montado no servidor;
    - `POST /webhook`: confere a assinatura do Mercado Pago (`x-signature`, HMAC-SHA256, aviso de até
      10 min), consulta o pagamento na API do Mercado Pago (a fonte da verdade), confere moeda e valor
      e grava `users/{uid}/access/{produto}` com a conta de serviço do Firebase. Repetir o aviso não
      duplica; renovar antes de vencer soma o prazo; estorno tira só o acesso daquele pagamento;
    - `GET /retorno`: devolve a pessoa a `#/pagamento/{aprovado|pendente|recusado}/{produto}`.
  - Segredos (Access Token, assinatura do webhook, conta de serviço) só nos segredos do Worker.
  - No site, `VITE_PAYMENTS_URL` liga o botão "Pagar"; sem ela, "Pagamento em breve".
  - Publicação com `npx wrangler@4` (sem dependência nova no projeto). Guia em `pagamentos.md`.
- **Alternativas consideradas:** Pix manual com liberação à mão (continua possível no Modo Andreía,
  mas exige conferir cada pagamento); Hotmart/Kiwify (≈ 9% + R$ 2,49 por venda e o conteúdo já está
  no site); InfinitePay e Asaas (avaliados no comparativo de 2026-11-22); Cloud Functions do Firebase
  (exige plano pago).
- **Consequências:** ➕ venda automática, custo zero fixo, preço e comprador conferidos no servidor,
  testes cobrindo assinatura, token, renovação e estorno. ➖ mais uma conta (Cloudflare) e três
  segredos para cuidar; o texto exato assinado pelo webhook vem dos SDKs oficiais e precisa ser
  conferido com o simulador do painel antes de abrir as vendas.

## ADR-024 · Dias liberados pelo calendário, um por meia-noite de Brasília

- **Status:** aceita · 2026-11-23 (pedido do desenvolvedor e da Andreía); altera a parte "dias" do
  ADR-013
- **Contexto:** a estrutura escolhida no produto define quando cada parte da jornada abre. Em
  "por dias" e "por semana", a pessoa vive a jornada no ritmo do calendário, um dia de cada vez, e não
  "maratona" concluindo vários dias seguidos.
- **Decisão:**
  - O progresso guarda `startedAt` ("Começar a jornada"). O primeiro dia abre na hora; depois, **um dia
    novo a cada 00h de Brasília** (UTC-3 fixo), concluído ou não o anterior. Dias que passaram ficam
    abertos (quem volta depois de 3 dias encontra 3 dias novos).
  - As abas de semana abrem junto com o primeiro dia delas. Dentro do dia, as etapas continuam em
    sequência; Revisões, Vitórias e Encerramento continuam abrindo por conclusão.
  - A Chama Interna passa para a regra nova. Quem já tinha começado ganha, ao carregar, um início
    `N` dias atrás (N = dias concluídos): mantém o que já tinha aberto e o próximo dia abre na
    meia-noite seguinte. Ao mesclar aparelho e nuvem, vale o início mais antigo.
  - A tela troca de dia sozinha à meia-noite (um relógio único, `ui/releaseClock.ts`) e mostra nos dias
    fechados quando eles abrem ("Abre amanhã, à meia-noite" / "Abre em dd/mm").
  - **Estruturas (passo 2):** a jornada guarda `structure` (`weeks` | `themes` | `days`; sem ela,
    `weeks`) e as abas saem dela (`journeyTabs`): `semana-N` + Revisões; `tema-N` com o nome do tema;
    ou uma aba `dias`. **Por tema não há dias:** cada tema é uma unidade de conteúdo só (guardada como
    um dia, para reaproveitar etapas e respostas), com "Concluir tema ✦"; concluir abre o próximo tema,
    sem calendário. Revisões só existem por semana.
- **Alternativas consideradas:** hora de um servidor (exigiria serviço pago ou mais uma rota no Worker
  a cada abertura); liberar uma semana inteira por vez (descartado pelo desenvolvedor); um dia novo só
  depois de concluir o anterior (nada se acumula; descartado).
- **Consequências:** ➕ ritmo diário de verdade, regra pura e testada, sem custo. ➖ a hora vem do
  relógio do aparelho: quem adiantar o relógio abre antes (aceito, como a proteção leve do ADR-020).

## ADR-025 · Jornada em partes e títulos dos dias fora do catálogo

- **Status:** aceita · 2026-11-23 (mock `Downloads/atmavox-estrutura-produto-v2.html`, aprovado)
- **Contexto:** a Andreía quer dividir os dias em partes de tamanho livre ("Parte 1 · Descobrindo você
  mesma", dias 1 a 10; "Parte 2 · Desabrochando", 11 a 21) e dar título a cada dia já no cadastro do
  produto. Os 3 primeiros dias com título viram os cartões do banner (I, II, III). O catálogo é público
  (ADR-019): tudo o que está nele pode ser lido sem comprar.
- **Decisão:**
  - Estrutura nova `parts` no catálogo e na jornada. No produto, cada parte é um item de `themes` com
    `lastDay` (a última vai até o fim); a jornada guarda as partes como `weeks` de tamanhos livres, com
    abas `parte-N`, dias pelo calendário (como as semanas) e **sem Revisões**.
  - O produto ganha `dayCount` (número) e a duração passa a ser gerada ("21 dias", "4 temas").
    `shared/catalog/journeyLayout.ts` é a fonte única dos trechos de dias (`dayGroups`): hub, perfil e
    esqueleto da jornada usam a mesma conta.
  - **Títulos dos dias:** no catálogo vão só os 3 do banner (`previewDays`). A lista inteira vai para
    `drafts/{id}`, campo `dayTitles` (JSON), que só a admin lê. O editor da jornada usa esses títulos ao
    montar os dias enquanto não há rascunho (`withDayTitles`, só em dias intocados).
  - Quando o editor da jornada salva qualquer coisa (`drafts/{id}.content`) ou a jornada é publicada, a
    estrutura **trava** no produto: duração, divisões, ordem e nomes passam a mudar só em "Editar a
    jornada".
- **Alternativas consideradas:** todos os títulos no catálogo (mais simples, mas ficariam legíveis sem
  comprar); o Modo Andreía de produtos gravar a jornada inteira no rascunho (exigiria que `produtos`
  conhecesse o formato da jornada); partes como semanas com Revisões (as revisões são fixas por semana).
- **Consequências:** ➕ partes e títulos sem expor o conteúdo; uma conta só para os trechos de dias.
  ➖ depois da trava, títulos mudados no editor da jornada não atualizam os cartões do banner sozinhos
  (ficam os do último "Salvar" do produto).

## ADR-026 · Arrastar para ordenar próprio, com pointer events

- **Status:** aceita · 2026-11-23
- **Contexto:** o quadro de dias usava o arrastar nativo do HTML (`draggable`), que não funciona com o
  dedo. A Estrutura do produto precisa de ordenar semanas, partes, temas e títulos no computador e no
  celular ("segurar o cartão em qualquer lugar"), com animação suave.
- **Decisão:** um motor pequeno em `shared/ui/sortable.ts` (+ `useSortable`), sem biblioteca: pointer
  events para mouse e dedo; puxador arrasta na hora; no celular, segurar 450 ms sem mexer ativa o
  arrastar (mexer antes é rolar a página); setas do teclado no puxador; o lugar de soltar é o mais
  perto do centro (serve para lista e grade); os outros escorregam e, ao soltar, tudo desliza (FLIP).
  Quando a lista muda por fora (item criado ou apagado), os vizinhos também deslizam e o novo aparece
  suave. Respeita `prefers-reduced-motion`.
- **Alternativas consideradas:** dnd-kit (bom, mas mais uma dependência para um uso simples);
  manter o `draggable` (sem toque).
- **Consequências:** ➕ funciona no celular, sem dependência, um jeito só no site todo. ➖ código
  próprio para manter; o "segurar" precisa ser conferido em aparelhos reais.

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
