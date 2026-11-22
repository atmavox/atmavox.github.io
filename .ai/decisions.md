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
  desenvolvedor pede; **patch** o Claude sobe a cada correção ou ajuste pequeno.
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
