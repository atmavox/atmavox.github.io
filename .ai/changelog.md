# Changelog

Todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/).

Categorias: **Adicionado**, **Alterado**, **Corrigido**, **Removido**, **Segurança**.
Ao terminar uma tarefa, o Claude Code registra a mudança em "Não lançado". Quando a versão do
`site.json` sobe, a seção vira essa versão, com data (regras de versão em `conventions.md`).

## [Não lançado]

## [1.31.2] · 2026-11-24

### Alterado

- Modo Andreía · Terapias e Agenda: o "Salvo" vem com o ícone de check do projeto (sem o caractere ✓)
  e some sozinho depois de 2,5 s, esmaecendo no lugar; o aviso de erro continua à vista.

## [1.31.1] · 2026-11-24

### Corrigido

- Modo Andreía · Terapias e Agenda: salvar não faz mais a tela pular. O aviso "Salvo ✓" fica fixo na
  linha do título (Terapias) ou da legenda (Agenda) e não some no meio do salvamento; ligar, desligar
  e reordenar uma terapia mudam na hora e voltam se não der para salvar.

## [1.31.0] · 2026-11-24

### Adicionado

- Hub Ativações (`#/ativacoes`, mock `atmavox-hub-ativacao.html`, D, ADR-032): convite com o retrato
  da Andreía sobre os anéis, as terapias ativas (sem preço) com "Agendar esta", Como funciona e a
  dúvida pelo WhatsApp. Textos da página provisórios, para a Andreía ajustar.

### Alterado

- Ativações no cabeçalho dos hubs e na barra do celular (agora com 5 itens).
- O agendamento abre sempre sobre o hub Ativações (também vindo do perfil); "Agendar esta" já traz a
  terapia escolhida; fechar sem login volta ao hub.
- O "Quero agendar" do Contato leva ao hub Ativações.

## [1.30.1] · 2026-11-24

### Alterado

- Quem entra pelo Google já chega com o nome completo e a foto da conta no cadastro (só na primeira
  vez e só nos campos vazios; a pessoa edita depois). O celular continua sendo digitado: o Google não o
  entrega sem uma permissão sensível.

## [1.30.0] · 2026-11-24

### Adicionado

- Modo Andreía · Acessos · Pessoas (mock `atmavox-acessos-pessoas.html`, C): lista com busca (nome,
  e-mail ou celular) e filtros (Todas, Aceitam novidades, Cadastro incompleto); ficha de cada pessoa com
  os dados, "Conversar no WhatsApp", os acessos e "Liberar acesso para ela"; "Copiar celulares" (de quem
  aceitou novidades) e "Baixar planilha" (CSV).

## [1.29.0] · 2026-11-24

### Adicionado

- "Seu cadastro está quase pronto" (mock `atmavox-cadastro.html`, C) antes de pagar, abrir uma
  jornada, pedir a ativação individual ou ouvir uma meditação grátis fora da página inicial: mostra o
  que falta e leva à aba Conta (`#/perfil/conta`); completo, o perfil oferece "Voltar para…".
- Login com e-mail (mock A): "Ainda não tem conta? Criar conta com este e-mail" no aviso de e-mail ou
  senha incorretos; olho para mostrar a senha no login e no cadastro.

### Alterado

- Meditações grátis sem login: só as em destaque na página inicial.
- Ativação individual: "Seus dados" vem preenchido com o cadastro da aba Conta.
- Celular: as abas de baixo continuam Início, Jornadas, Meditações e Contato também nos hubs.

## [1.28.0] · 2026-11-24

### Adicionado

- Confirmação de e-mail (mock `atmavox-cadastro.html`, A; ADR-031): a conta criada com e-mail e senha
  recebe o link; até confirmar, faixa no topo dos hubs e do perfil com "Reenviar", e a janela "Falta
  confirmar seu e-mail" ao abrir uma jornada, ver o preço ou pedir a ativação. Na aba Conta, o e-mail
  mostra "Confirmado" ou "Falta confirmar".
- Regras do Firestore e Worker de pagamentos exigem e-mail confirmado para gravar progresso, anamnese e
  pedidos e para pagar (publicar as regras e o Worker de novo).

## [1.27.0] · 2026-11-24

### Adicionado

- Perfil · Conta · "Meus dados" (mock `atmavox-cadastro.html`, C): nome completo, apelido, celular
  (WhatsApp) e data de nascimento, com "Editar" por linha e validação; foto do perfil reduzida no
  navegador; caixinha pequena de novidades pelo WhatsApp (marcada por padrão). O topo do perfil mostra o
  apelido e a foto. Dados em `users/{uid}` (ADR-030); regras do Firestore novas (publicar no console).

## [1.26.6] · 2026-11-24

### Corrigido

- Janelas (Modo Andreía, login e preço): o cursor saía do campo a cada tecla (por exemplo, no preço
  da terapia). O foco no primeiro campo rodava a cada atualização da tela; agora só ao abrir
  (`shared/lib/useLatest.ts`, com teste).
- Janelas (preço e começar das jornadas e meditações, login, ativação individual, "Um pouco sobre mim" e
  Modo Andreía): fechar agora também é suave (a janela desce e esmaece, como entra); com "reduzir
  movimento", fecha na hora (`shared/ui/useClosing.ts`).
- Redes sociais: o convite do cartão segue o tipo da publicação (vídeo "Assistir", áudio "Ouvir", foto
  "Ver"); o reels do Instagram mostrava "Ver".

### Alterado

- Ativação individual: a pessoa vê "Um pouco sobre mim" no lugar de "Anamnese" (etapas, resumo e
  perfil, com "Ver minhas respostas"); o termo "anamnese" fica só no Modo Andreía.
- Ativação individual: a concordância em compartilhar as respostas com a Andreía já vem marcada.
- Ativação individual: "Voltar" na primeira pergunta leva de novo à etapa "Entrar", que mostra a conta
  em uso com "Continuar com esta conta" e "Entrar com outra conta".
- Formulários da pessoa (ativação, login e vitórias da jornada): campo obrigatório com * vermelho ao lado
  do rótulo (token `required` nos dois temas) e `aria-required` no campo.
- Ativação individual: rótulos "Telefone (WhatsApp)" e "Como prefere ser chamado(a)?" (testes
  atualizados).

## [1.26.5] · 2026-11-24

### Adicionado

- Redes sociais: enquanto a última publicação do Instagram não puder ser lida (sem token ou com erro),
  o cartão do Instagram mostra um reels fixado escolhido pela Andreía, com capa e título guardados no
  projeto (`scripts/pinned/`).

### Alterado

- Redes sociais: os cartões seguem a ordem YouTube, TikTok, Instagram, Spotify (o YouTube, que traz a
  última publicação, vem primeiro). A ordem ideal, para quando todas trouxerem a última, ficou anotada
  no ADR-028.
- Redes sociais: o cartão do Spotify mostra "Playlist: AtmaVox Songs" quando o link é de uma playlist.

### Corrigido

- Redes sociais: o cartão do TikTok voltou a ter capa e título. O TikTok parou de mandá-los pela
  incorporação pública, então a capa e o título do vídeo fixado ficam no projeto (`scripts/pinned/`),
  presos ao número do vídeo.

## [1.26.4] · 2026-11-23

### Adicionado

- Redes sociais: o Spotify aparece por um link escolhido (`SOCIAL_SPOTIFY_URL`, hoje a playlist "AtmaVox
  Songs"), com capa e nome pela incorporação pública, sem chave; o ícone do Spotify entrou na lista de
  redes e abre a playlist.
- Instagram: o script das redes aceita o token do login unificado da Meta (`EAA…`, o único para apps
  novos), lendo a conta pelo número em `INSTAGRAM_USER_ID`; o token antigo (`IG…`) continua aceito.

### Documentação

- `processos-manuais.md` reescrito depois da reunião com a Andreía: passo a passo do token do Instagram
  (testador, convite pelo navegador, chave secreta não serve), Mercado Pago com credenciais de teste e
  compra de teste, e o robô do WhatsApp em pausa (a coexistence não está no painel da Meta), com os
  caminhos possíveis.

## [1.26.3] · 2026-11-23

### Alterado

- Agenda do Modo Andreía:
  - o horário livre tem o mesmo tracejado da seleção ao arrastar, no marrom do site (semana, dia no
    celular e legenda);
  - depois de "Agenda" vêm as setas e "Hoje" (sempre no mesmo lugar) e o período, menor e mais claro,
    por extenso ("23 a 29 de novembro");
  - a grade da semana cobre o dia todo (0h a 24h) e rola por dentro, sempre abrindo das 9h às 21h, que
    cabem inteiras na tela; barra de rolagem fina, no marrom do site;
  - as bolinhas das terapias usam uma cor sólida por tom (Barras e Ativação não se confundem mais).

## [1.26.2] · 2026-11-23

### Alterado

- Hub de jornadas (computador): o símbolo que pulsa no topo ficou bem maior, subindo até o cabeçalho e
  cortado pela borda direita da página.

## [1.26.1] · 2026-11-23

### Alterado

- Modo Andreía no celular (mock `atmavox-modo-andreia-celular.html`, A): as áreas (Produtos, Ativações,
  Acessos e Ver o site) nas abas de baixo; as seções de Ativações numa linha no topo, no estilo do menu
  do site, que desliza para o lado; a faixa azul só com a tag. O botão redondo saiu.

## [1.26.0] · 2026-11-23

### Adicionado

- **Aprovar o horário** (Modo Andreía · Pedidos): o que a pessoa prefere, se ainda estiver livre, ou outro
  da agenda; o horário fica **reservado por 24 h** (aparece como "Reservado" na agenda) e a mensagem
  "Horário aprovado" sai pronta para o WhatsApp com o link de confirmação. Reserva vencida sem
  confirmação volta para a agenda sozinha ao abrir os Pedidos. "Lembrar no WhatsApp" para os agendados;
  cancelar solta a reserva.
- **Confirmar o horário** (`#/ativacao/confirmar/{pedido}`): "A Andreía aprovou o seu horário" e
  "Confirmar este horário"; o pedido vira Agendada.
- **Mensagens** (Modo Andreía): os quatro textos do WhatsApp (pagou, horário aprovado, outro horário,
  lembrete) com campos que se preenchem sozinhos e a prévia; em `catalog/messages`.
- **Perfil · Ativações** (`#/perfil/ativacoes`): um cartão por pedido, que abre as etapas com data e
  hora e os detalhes; "Ver minha anamnese" e a próxima ação (pagar, avisar, confirmar, conversar).

### Alterado

- Cabeçalho do Modo Andreía: "Modo Andreía" virou uma tag pequena com "área da admin" ao lado; no
  computador, as áreas ficam no meio, na ordem Produtos, Ativações, Acessos; "Voltar ao hub" e "Ver o
  site" com o mesmo realce do "Começar a editar"; as faixas azuis (site, jornada e edição) têm sempre
  a mesma altura.
- Telas do Modo Andreía com a "luz que desce" (brilho âmbar difuso no topo, como no hub) e o submenu da
  ativação no estilo do menu do site, alinhado ao conteúdo (mock `atmavox-modo-andreia-estilo.html`, A).
- Agenda da semana no estilo do site (mock, A): cada dia é um cartão claro com o número em Playfair,
  faixas livres com a fita dourada ao lado (da C), reservado em vinho e a linha da hora atual em âmbar.
- "Carregando…" só aparece se a espera passar de meio segundo (sem piscar ao trocar de aba).

## [1.25.0] · 2026-11-23

### Adicionado

- **Pedidos da ativação individual** (F10, ADR-029): no resumo, "Pagar" cria o pedido (Aguardando
  pagamento) e segue para o Mercado Pago; o Worker cobra pelo preço das terapias do catálogo e marca o
  pedido como Pago no aviso do pagamento (estorno cancela). A volta abre "Pagamento confirmado" com o
  número do pedido, a mensagem pronta e "Avisar a Andreía no WhatsApp" (o pedido vira Solicitada);
  pagamento recusado oferece tentar de novo. Sem o Worker configurado, segue "Pagamento em breve".
- Modo Andreía · Ativações · **Pedidos**: quadro por status no computador e lista por dia no celular
  (vencidos sem pagamento somem); o pedido abre numa janela com os dados parados à esquerda e a anamnese
  rolando à direita ("Ver todas as respostas"), conversar no WhatsApp da pessoa, marcar como realizada
  e cancelar.
- Regras do Firestore para `users/{uid}/sessions` (precisam ser publicadas no console).

### Corrigido

- Mensagens do WhatsApp da ativação não repetem mais "Olá, Andreía!".

## [1.24.0] · 2026-11-23

### Adicionado

- **Ativação individual para a pessoa** (`#/ativacao`, F10, ADR-029): a aba Contato ganha os cartões
  "Um encontro só seu" (com as terapias e "Quero agendar") e "Ficou com alguma dúvida?" (WhatsApp). O
  fluxo abre numa janela sobre o hub: login com as etapas ao lado, anamnese por etapas (respostas de
  antes voltam preenchidas; o nome da conta já vem), terapia (banner e lista com filtro no computador,
  cartões no celular, pergunta extra obrigatória), data de preferência (só os horários livres daquela
  terapia; no celular o mês desliza) e resumo com "Editar" em cada bloco. O pagamento aparece como
  "em breve", com um link para combinar com a Andreía pelo WhatsApp.
- Regra do Firestore para `users/{uid}/anamnesis/{doc}` (precisa ser publicada no console).

### Alterado

- Cabeçalho do Modo Andreía: no site, a faixa azul só leva a "Começar a editar"; nas telas de edição,
  Produtos, Acessos e Ativações na fonte do menu do site e "Voltar ao hub" com a seta à direita.
- O antigo botão "Ativação individual" (só WhatsApp) saiu: o caminho agora é "Quero agendar".

## [1.23.0] · 2026-11-23

### Adicionado

- Modo Andreía · Ativações · **Agenda** (`#/admin/ativacoes`, F10, ADR-029): no computador, a grade da
  semana (arrastar marca um horário livre e abre o balão com as terapias e "repetir toda semana"; o
  "+" abre o formulário completo) e a vista do mês; no celular, o dia com "toque para marcar livre".
  Formulário com dia, horário, terapias, repetição e até quando, mostrando os horários de início que a
  pessoa vai ver. Tirar só um dia de um horário que repete. Grava em `catalog/availability`.

## [1.22.0] · 2026-11-23

### Adicionado

- Modo Andreía · Ativações (`#/admin/ativacoes`, F10, ADR-029): **Terapias** (tabela com arrastar e
  ativar no computador, cartões no celular; formulário em janela ou em blocos; sem preço não ativa) e
  **Anamnese** (seções, edição de cada pergunta, nome e telefone fixos, perguntas salvas guardadas em vez
  de apagadas). Começam pelas quatro terapias combinadas e pelo modelo de anamnese aprovado no mock.
- Celular no Modo Andreía da ativação: abas embaixo e botão redondo para voltar ao site.
- Guia do robô oficial do WhatsApp em `processos-manuais.md` (seção 3), para fazer com a Andreía.

## [1.21.2] · 2026-11-23

### Alterado

- README sem destacar uma jornada específica (o nome dos produtos pode mudar).
- Guias de pagamentos e redes sociais juntos em `.ai/processos-manuais.md` (processos manuais
  pendentes, com uma lista para marcar); `pagamentos.md` e `redes-sociais.md` saíram.

## [1.21.1] · 2026-11-23

### Alterado

- "A Ativadora": a tag "Metáforas Ericksonianas" saiu da lista de práticas (faz parte da PNL).

## [1.21.0] · 2026-11-23

### Adicionado

- **Última publicação de cada rede** na página inicial (ADR-028, mock `Downloads/atmavox-redes.html`):
  mural de cartões no computador e cartões quadrados que deslizam no celular, um por rede, com a capa,
  o começo do texto e "há 10 dias". Gerado no deploy (a cada 6 horas) por `scripts/fetch-social.ts`:
  YouTube já funciona; TikTok com um vídeo escolhido; Instagram e Spotify quando configurados (guia em
  `.ai/redes-sociais.md`).

## [1.20.0] · 2026-11-23

### Alterado

- Sem emoji no site (mock `Downloads/atmavox-icones-emoji.html`): a temperatura energética do dia
  usa ícones próprios em traço fino (opção B: lua tracejada, lua nova, crescente, cheia e chama), na cor
  do tema, dourados quando escolhidos; o botão de tema usa sol de raios e lua crescente (opção 1); o
  play dos blocos de vídeo no editor também virou ícone.
- Teste que falha se algum emoji entrar no código (`shared/brand/noEmoji.test.ts`); sinais da marca
  como ✦ continuam liberados.

## [1.19.0] · 2026-11-23

### Adicionado

- **Territórios criados pela Andreía** (ADR-027): ficam em `catalog/territories` (leitura pública,
  gravação só da admin), com nome e uma das 6 cores de banner. Os 4 da marca continuam garantidos pelo
  código. Hub, filtros, agrupamento e a cor dos banners passam a ler essa lista; um território criado só
  aparece no filtro do hub quando tem jornada.
- **Seletor de território** no produto (mock `Downloads/atmavox-territorio-v2.html`), no lugar do menu
  do navegador. Computador: a cor e o nome; ao abrir, "Buscar ou criar território" (nome novo vira
  "Criar «…»" com as bolinhas de cor). Celular: a lista sobe de baixo e "Novo território" desliza para
  um segundo passo com as cores em mini-banners.

## [1.18.1] · 2026-11-23

### Alterado

- Editor da jornada: clicar no lápis de um campo leva o cursor para o fim do texto. O lápis não tem
  fundo; ao passar o mouse ou editar, fica com mais cor e traço um pouco mais forte.

## [1.18.0] · 2026-11-23

### Adicionado

- Jornada **em partes** (ADR-025): faixas de dias de tamanho livre ("Parte 1 · Descobrindo você mesma",
  dias 1 a 10), uma aba por parte, dias pelo calendário e sem Revisões. Hub, perfil e esqueleto da
  jornada usam a mesma conta dos trechos de dias (`shared/catalog/journeyLayout.ts`).
- Cartões do banner com os **3 primeiros dias com título** (I, II, III); sem títulos, as semanas,
  partes ou temas, como antes.
- Títulos dos dias dados no produto entram nos dias vazios de uma jornada nova, no editor. Ficam no
  rascunho da jornada (só a admin lê); no catálogo, só os 3 do banner.
- Modo Andreía de produtos, bloco **Estrutura** (mock v2 aprovado): "Por dias" (sem divisão, em
  semanas, em partes) ou "Por temas"; duração em número com − e + (por temas, sem duração); semanas que
  aparecem sozinhas a cada 7 dias; partes com "termina no dia"; títulos dos dias (opcional). Numeração
  automática pela posição, em trilha. Trava com aviso quando a jornada já tem conteúdo no editor.
- **Arrastar para ordenar** (`shared/ui/sortable.ts`, ADR-026): puxador à esquerda e setas no
  computador; no celular, segurar o item em qualquer lugar; setas do teclado. Os outros abrem espaço e
  tudo desliza ao soltar. Vale na Estrutura e no quadro de dias do editor (agora funciona com o dedo).
- Apagar produto que não está publicado (Rascunho ou Em breve), com confirmação.

### Alterado

- Cabeçalho único do Modo Andreía (produtos, acessos e editor da jornada): Produtos · Acessos, "Voltar
  ao hub" e "Ver o site" com ícones. Sem "Editar a jornada" solto na faixa dos hubs e no menu da conta
  (não dizia qual jornada); cada jornada se edita pelo produto. "← Produtos" acima do título no editor.
- Por semana, o dia novo depois de uma semana cheia abre a semana seguinte (o dia 22 vira Semana IV).
- "Novo dia" só cria o cartão (não abre mais a edição). Dia e semana entram e saem com transição suave.
- Campos de texto do editor da jornada mais evidentes (mock `Downloads/atmavox-campos-editaveis.html`,
  faixa azul da opção D + lápis da opção B): faixa azul à esquerda e lápis ao lado; vazios, com fundo
  azul claro e o exemplo em itálico.
- Lista de produtos fica parada ao lado enquanto o editor rola (computador).

### Corrigido

- Rodapé sempre no fim da página no computador, mesmo em páginas curtas (perfil, pagamento).
- O dia sozinho na última semana pode ser apagado (a semana sai junto).

## [1.17.1] · 2026-11-23

### Corrigido

- Jornada: "← Jornadas" na mesma linha das etapas, no canto esquerdo da página.
- Modo Andreía de produtos e acessos: "Voltar ao hub" ao lado de "Ver o site".

## [1.17.0] · 2026-11-23

### Adicionado

- Modo Andreía de produtos: uma jornada só pode ser salva como "Publicada" depois que o conteúdo dela
  for publicado no editor (a Chama Interna, com o conteúdo no código, sempre pode). Até lá, Rascunho ou
  Em breve.

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
