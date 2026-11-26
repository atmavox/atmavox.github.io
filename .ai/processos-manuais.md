# Processos manuais pendentes

Configurações que só uma pessoa consegue fazer (contas, chaves, painéis). Todas são gratuitas. Ao
terminar um item, marque `[x]` aqui e no `roadmap.md`. **Nenhuma chave vai para o repositório, para o
WhatsApp ou para conversas**: elas são coladas direto nos segredos do GitHub ou do Worker. No computador
do desenvolvedor, os valores já recebidos ficam no `.env.local` (fora do git), num bloco "Para COPIAR".

Onde ficam as configurações do GitHub: repositório `atmavox.github.io` → **Settings → Secrets and
variables → Actions** (abas **Variables** e **Secrets**).

## Resumo

Reunião com a Andreía em 2026-11-23: vídeo do TikTok, playlist do Spotify e credenciais **de teste** do
Mercado Pago recebidos. Instagram e WhatsApp travaram no painel da Meta (passos reescritos abaixo).

- [x] Redes sociais: TikTok: variável `SOCIAL_TIKTOK_URL` criada (2026-11-24); capa fixa no projeto
- [x] Redes sociais: Spotify: variável `SOCIAL_SPOTIFY_URL` criada (2026-11-24)
- [ ] Redes sociais: Instagram: app, configuração e script prontos e testados com conta pessoal (2026-11-24);
      falta a `@atmavox` aceitar ser testadora e gerar o `INSTAGRAM_TOKEN` + `INSTAGRAM_USER_ID` (seção 1)
- [x] Pagamentos: app "atmavox-app" no Mercado Pago com credenciais de teste (2026-11-23)
- [ ] Pagamentos: conta de serviço do Firebase + Worker + webhook + botão + compra de teste
- [ ] Pagamentos: trocar para as credenciais de **produção** antes de vender
- [x] Publicar as regras novas do Firestore (anamnese, pedidos e confirmação do horário da ativação individual, 1.24.0 a 1.26.0): seção 4 (feito em 2026-11-23)
- [ ] Publicar as regras novas do Firestore (dados do perfil na aba Conta, 1.27.0; e-mail confirmado,
      1.28.0): seção 4
- [ ] Publicar as regras novas do Firestore (reler as reflexões de um produto Indisponível depois que o
      acesso vence, 1.37.0; quem abriu cada conteúdo, 1.38.0): seção 4. Até publicar, quem tem o acesso vencido vê "… saiu do ar" em vez da
      releitura; nada quebra
- [ ] Publicar as regras novas do Firestore (sino das movimentações das ativações, 1.39.0): seção 4
- [ ] Contas de teste criadas com e-mail e senha: confirmar o e-mail (link no e-mail, ou marcar como
      confirmado em Firebase Console → Authentication → Usuários), senão a jornada pede a confirmação
- [ ] (Opcional) Firebase Console → Authentication → Modelos → "Verificação de endereço de e-mail":
      nome do remetente "AtmaVox" (o texto já sai em português: o site pede o idioma pt-BR)
- [ ] Robô do WhatsApp: **em pausa**, falta decidir o caminho (seção 3, "Por que travou")

---

## 1. Redes sociais na página inicial (ADR-028)

A seção "Nas redes sociais" mostra a última publicação de cada rede. Quem busca é o
`scripts/fetch-social.ts`, no deploy do GitHub Actions (a cada push e a cada 6 horas). Ele grava
`public/social.json` e as capas em `public/social/`; o site só lê esse arquivo e nenhuma chave vai para
o site. Rede que não estiver configurada (ou falhar) simplesmente não aparece.

Depois de mudar qualquer item abaixo: aba **Actions** → workflow **Checar e publicar** → **Run
workflow**, ou espere a próxima execução (até 6 horas).

### YouTube (já funciona)

Lido pelo feed público do canal `@atmavox` (id `UCHASefs-qyG_f-hK-qr7Bcg`), sem chave. Nada a fazer.

### TikTok (vídeo escolhido)

O TikTok não deixa ler o "último vídeo" nem o fixado no perfil sem um app aprovado. Então a Andreía
escolhe um vídeo e o site busca a capa e o título pelo serviço público de incorporação (oEmbed).

1. No TikTok, abra o vídeo → **Compartilhar → Copiar link** (ex.: `https://www.tiktok.com/@atmavox/video/…`).
2. Em **Variables** → **New repository variable**: `SOCIAL_TIKTOK_URL` = esse link.

O cartão aparece com "Em destaque". Para trocar o vídeo, é só editar a variável.

O TikTok parou de mandar a capa e o título pela incorporação pública (2026-11-23) e bloqueia quem lê a
página do vídeo. Por isso a **capa e o título do vídeo fixado ficam no projeto**: ao trocar o vídeo,
a Andreía manda ao desenvolvedor um print da capa e o título, e ele põe a imagem em `scripts/pinned/` e
uma linha em `TIKTOK_PINNED` (`scripts/fetch-social.ts`). Sem isso, o cartão aparece sem capa e com o
título "Vídeo no TikTok", mas abre o vídeo certo.

### Spotify (playlist escolhida)

Igual ao TikTok: a Andreía escolhe um link (playlist, álbum, programa ou episódio) e o site busca a capa
e o nome pela incorporação pública do Spotify, sem chave. O ícone do Spotify na lista de redes já abre a
playlist "AtmaVox Songs".

1. No Spotify, abra a playlist → **⋯ → Compartilhar → Copiar link da playlist**.
2. Em **Variables** → **New repository variable**: `SOCIAL_SPOTIFY_URL` = esse link (sem o `?si=…` do
   fim, se houver).

Quando existir um podcast, dá para trocar pela última publicação: apague `SOCIAL_SPOTIFY_URL` e crie
`SOCIAL_SPOTIFY_RSS` com o link do feed RSS (Spotify for Creators → **Configurações → Distribuição**).

### Instagram (configuração única)

Enquanto o token não estiver pronto (ou se a API falhar), o site mostra um **reels fixado** escolhido
pela Andreía (`INSTAGRAM_PINNED` em `scripts/fetch-social.ts`, capa em `scripts/pinned/`). Para trocar,
ela manda ao desenvolvedor o link, um print da capa e o título. Com o token funcionando, a última
publicação toma o lugar sozinha.

O Instagram só entrega publicações pela API oficial da Meta. Desde 2026-11, apps novos só têm o **login
unificado**: o token é de um "usuário do sistema" do app, começa com `EAA` e **não vence**. Ele só
enxerga as contas do Instagram que são **ativos do portfólio "Atma Vox"**; por isso precisa ser gerado
com a `@atmavox`, não com uma conta pessoal (testado em 2026-11-24: o token de uma conta pessoal não
enxerga conta nenhuma). A **chave secreta do app** não serve para nada disso.

Situação em 2026-11-24 (app **atmavox-app**):

- [x] Caso de uso **Gerenciar mensagens e conteúdo no Instagram** adicionado.
- [x] Configuração da Etapa 1 criada e **Selecionado**: "API do Instagram (login unificado)", token de
      usuário do sistema, expiração Nunca, permissões `instagram_basic` e `instagram_manage_messages`
      (esta última pode sair em **Editar permissões**; o site não usa), URL de redirecionamento
      `https://atmavox.github.io/`.
- [x] Caminho testado com a conta pessoal do desenvolvedor como testadora: o token sai (`EAA…`), é
      válido, mas não enxerga conta nenhuma (não é ativo do portfólio). Esse token não vai para o GitHub.
- [x] Script das redes pronto para esse token (`INSTAGRAM_USER_ID` no deploy, 1.26.4).
- [ ] **Próximo:** entrar com a `@atmavox` e repetir o que foi feito com a conta pessoal (passos 1 a 6
      abaixo): testadora, aceitar o convite, gerar o token, anotar o número e testar local.
      Falta, logado com a `@atmavox` (no computador):

1. **Conta profissional e pública:** no app do Instagram da `@atmavox`, **Configurações e atividade →
   Tipo de conta e ferramentas**. Se ainda for pessoal, mudar para Criador de conteúdo ou Empresa.
2. **Testadora:** <https://developers.facebook.com/apps> → **atmavox-app** → **Funções do app →
   Funções** → **Testadores do Instagram** → adicionar `atmavox`.
3. **Aceitar o convite** em <https://www.instagram.com/accounts/manage_access/> (logada como
   `@atmavox`) → aba **Convites de testador** → **Aceitar**.
4. **Gerar o token:** **Casos de uso** → **Personalizar** no cartão do Instagram → **API setup with
   Unified login** → Etapa **2. Gerar tokens de acesso** → **Adicionar conta** (entrar com a
   `@atmavox`) → **Gerar token**. Copiar na hora (só aparece uma vez). Se o painel pedir, deixe a conta
   `@atmavox` como ativo do portfólio "Atma Vox".
   - Erro "Selecione uma configuração na Etapa 1": a configuração da Etapa 1 precisa estar marcada como
     **Selecionado**.
5. **Anotar o número da conta**, que aparece em azul embaixo do nome na tabela da Etapa 2 (ex.:
   `1784…`). Não é segredo.
6. **GitHub:** em **Secrets**, `INSTAGRAM_TOKEN` = o token; em **Variables**, `INSTAGRAM_USER_ID` = o
   número. Depois, **Actions → Checar e publicar → Run workflow**. No log do passo das redes deve
   aparecer `- instagram: <começo da legenda do último post>`.

Teste local antes do GitHub (desenvolvedor): pôr os dois valores no `.env.local` e rodar
`node --env-file=.env.local scripts/fetch-social.ts`.

Se um dia o token for do tipo antigo (`IG…`, login do Instagram), o script também aceita: nesse caso
não precisa do `INSTAGRAM_USER_ID`, mas o token vence em 60 dias (renovar em
`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TOKEN`).

---

## 2. Pagamentos (Mercado Pago + Worker · ADR-023)

Liga a venda de jornadas e meditações. A taxa é só por venda, no Mercado Pago.

```
site (logada) ──POST /checkout──▶ Worker ──cria cobrança──▶ Mercado Pago
                                                              │ a pessoa paga
Mercado Pago ──POST /webhook──▶ Worker ──grava acesso──▶ Firestore users/{uid}/access/{produto}
Mercado Pago ──volta──▶ Worker /retorno ──▶ site #/pagamento/aprovado/{produto}
```

### 2.1 Conta de serviço do Firebase (para o Worker gravar os acessos)

1. Firebase Console → **Configurações do projeto** (engrenagem) → **Contas de serviço**.
2. **Gerar nova chave privada** → baixa um `.json`. Guarde no computador, **fora do repositório**.
3. Depois do passo 2.3, apague esse arquivo (ele fica só no segredo do Worker).

### 2.2 Mercado Pago (conta da Andreía)

Feito em 2026-11-23: aplicação **atmavox-app** criada, com chave Pix cadastrada na conta. Até agora só
temos as **credenciais de teste** (no `.env.local` do desenvolvedor).

1. Em [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) → **atmavox-app**.
2. Para testar (seção 2.6): **Credenciais de teste** → **Access Token** (`APP_USR-…`). É o único valor
   que o Worker usa. A **Public Key** não é usada (o pagamento acontece na página do Mercado Pago), e a
   chave Pix fica só na conta do Mercado Pago, não no site.
3. Para vender de verdade: **Credenciais de produção** → **Access Token**. O painel pode pedir para
   ativar as credenciais de produção (dados do negócio e site `https://atmavox.github.io`).
4. Webhooks: deixar para o passo 2.4 (precisa do endereço do Worker).

### 2.3 Worker na Cloudflare

1. Criar conta grátis em [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) (plano Free).
2. No computador, na pasta `worker/` do projeto:

   ```bash
   npx wrangler@4 login                     # abre o navegador para autorizar
   npx wrangler@4 deploy                    # publica; mostra o endereço, ex.: https://atmavox-pagamentos.<conta>.workers.dev
   npx wrangler@4 secret put MP_ACCESS_TOKEN          # cole o Access Token
   npx wrangler@4 secret put FIREBASE_SERVICE_ACCOUNT # cole o conteúdo inteiro do .json
   ```

3. Anote o endereço do Worker.

### 2.4 Webhook do Mercado Pago

1. Em Suas integrações → a aplicação → **Webhooks** → **Configurar notificações** (modo produção).
2. URL: `https://<endereço do Worker>/webhook`; evento **Pagamentos**; salvar.
3. Copiar a **assinatura secreta** e colar no Worker:

   ```bash
   npx wrangler@4 secret put MP_WEBHOOK_SECRET
   ```

4. **Teste obrigatório:** no painel, **Simular notificação** de pagamento. Nos logs do Worker
   (`npx wrangler@4 tail`), o aviso não pode aparecer como "assinatura inválida". Se aparecer, avise o
   desenvolvedor antes de abrir as vendas (o formato da assinatura pode ter mudado).

### 2.5 Ligar o botão "Pagar" no site

1. Em **Variables** → **New repository variable**: `VITE_PAYMENTS_URL` = endereço do Worker (sem barra
   no fim).
2. Fazer um novo deploy (qualquer push na `main`, ou "Re-run" do último workflow).

### 2.6 Testar antes de vender

1. Fazer os passos 2.3 a 2.5 com o **Access Token de teste** em `MP_ACCESS_TOKEN`.
2. Numa **janela anônima** do navegador, entrar no site e comprar um produto pago. Na página do Mercado
   Pago, entrar com o **usuário de teste** (painel → **Contas de teste**: usuário `TESTUSER…`, senha e
   código de verificação aparecem lá) e pagar com o **cartão de teste** do painel, titular `APRO`
   (pagamento aprovado).
3. Deve voltar para "Pronto, … é sua" e aparecer "Acesso até …" no hub. Na ativação individual, o pedido vira
   "Paga".
4. Antes de abrir as vendas: rodar de novo `npx wrangler@4 secret put MP_ACCESS_TOKEN` com o token de
   **produção** e trocar o webhook (2.4) para o modo produção.

### Se algo der errado

- A pessoa pagou e o acesso não apareceu: ver `npx wrangler@4 tail` e o pagamento no Mercado Pago.
  A Andreía pode liberar à mão (`firebase-setup.md`, seção 8), sem prejuízo para ninguém.
- Estorno pelo Mercado Pago tira o acesso que veio daquele pagamento automaticamente.
- Direito de arrependimento (7 dias, compra online): o estorno é feito pelo painel do Mercado Pago.

---

## 3. Robô do WhatsApp (API oficial da Meta · depois dos pagamentos)

O robô responde a pessoa que avisa o pagamento, envia o "horário aprovado" com botão de confirmar e
usa os textos da tela **Mensagens** do Modo Andreía. Quem conversa continua sendo a Andreía, no app
do WhatsApp Business de sempre. A Andreía **já tem conta no Meta Business**, o que adianta o passo 3.1.

Só a API oficial é segura. **Não use** Z-API, Evolution, Baileys ou similares (simulam o WhatsApp Web,
violam os termos e o número pode ser banido).

### Por que travou (2026-11-23) e o que decidir

Na reunião, a opção de usar o **número do app WhatsApp Business** no robô ("coexistence", passo 3.2.3)
não existia no menu. Motivo provável: a Meta só oferece a coexistence pelo cadastro de **parceiros**
(provedores de WhatsApp, os "BSP"), e não pelo painel de desenvolvedor de um app próprio. Nada foi
estragado: o número segue normal no celular da Andreía.

Até decidir, o site continua como está: os avisos vão por links do WhatsApp (`wa.me`) que a pessoa ou a
Andreía tocam, e as mensagens ficam na tela **Mensagens**. Caminhos possíveis:

1. **Ficar sem robô por enquanto** (custo zero, nada a fazer). Recomendado até as vendas começarem.
2. **Número só para o robô:** um chip novo, cadastrado direto na API (passo 3.2 sem a coexistence).
   A Andreía segue usando o número de sempre no app; o robô fala por outro número. Tem o custo do chip.
3. **Provedor parceiro da Meta com coexistence:** mantém o mesmo número no app e no robô, mas quase todos
   cobram mensalidade, o que foge do custo zero. Só com decisão explícita.

Os passos abaixo valem para o caminho 2 (ou para o 3, adaptando o 3.2 ao provedor).

Antes de começar, confira na página oficial de preços da Meta
(<https://developers.facebook.com/docs/whatsapp/pricing>): em outubro de 2026 a cobrança mudou. O
esperado é custo zero no volume da Andreía para respostas dentro da conversa aberta pela pessoa; o
lembrete na véspera (modelo fora da janela de 24 h) pode ser pago e, nesse caso, fica desligado.

### 3.1 Conta e verificação (com a Andreía)

1. Em <https://business.facebook.com>, entrar com a conta da Andreía e conferir em **Configurações do
   negócio → Central de segurança** se o negócio está **verificado**. Se não estiver, iniciar a
   verificação (pede documentos do negócio ou da Andreía; pode levar alguns dias).
2. Ter em mãos o número que o robô vai usar (caminho 2): ele **não pode** estar em nenhum WhatsApp
   (nem no app comum nem no Business), e precisa receber SMS ou ligação para o código.

### 3.2 App na Meta

1. Em <https://developers.facebook.com/apps> → **Criar app** → caso de uso **Conectar-se com clientes
   pelo WhatsApp** (_Connect with customers through WhatsApp_) → escolher o **portfólio empresarial** da
   Andreía. (Pode ser o mesmo **atmavox-app**, adicionando esse caso de uso em **Casos de uso**.)
2. No menu da esquerda: **WhatsApp → Configuração da API** (_API Setup_). A Meta mostra um **número de
   teste** e um **token temporário** (vale menos de 24 h; não use no Worker).
3. Na mesma tela, **Adicionar número de telefone** → preencher nome de exibição ("AtmaVox") e
   categoria → digitar o número do robô → receber e digitar o código.
4. Anotar o **ID do número de telefone** e o **ID da conta do WhatsApp Business** (aparecem na mesma
   tela). Não são segredos.

### 3.3 Token permanente (segredo)

1. Em <https://business.facebook.com/settings> → **Usuários → Usuários do sistema** → **Adicionar**:
   nome "atmavox-robo", função **Administrador**.
2. Com ele selecionado, **Atribuir ativos**: o app (controle total) e a **conta do WhatsApp** (controle
   total).
3. **Gerar novo token** → escolher o app → validade **Nunca** (se só houver 60 dias, escolha e anote a
   data para renovar) → marcar `whatsapp_business_messaging`, `whatsapp_business_management` e
   `business_management` → gerar. Copie na hora: ele só aparece uma vez.
4. Colar direto no Worker (pasta `worker/`), sem passar por conversa nem arquivo:

   ```bash
   npx wrangler@4 secret put WA_TOKEN          # o token do usuário do sistema
   npx wrangler@4 secret put WA_APP_SECRET     # app → Configurações → Básico → Chave secreta do app
   npx wrangler@4 secret put WA_VERIFY_TOKEN   # uma senha longa inventada na hora (usada no 3.4)
   ```

### 3.4 Webhook

1. No app → WhatsApp → **Configuração** → **Webhook** → **Editar**:
   - URL: `https://<endereço do Worker>/whatsapp`
   - Token de verificação: o mesmo `WA_VERIFY_TOKEN` do passo 3.3.
2. Em **Campos do webhook**, assinar **messages**.
3. Avisar o desenvolvedor com o ID do número (3.2) para ligar o robô no site.

### 3.5 Mensagens fora da janela (só se o custo permitir)

O lembrete na véspera precisa de um **modelo aprovado** pela Meta (categoria Utilidade). Em
**WhatsApp Manager → Modelos de mensagem**, criar o modelo com o texto da tela Mensagens, trocando
os campos por `{{1}}`, `{{2}}`… A aprovação costuma sair em minutos.

### 3.6 Testar

1. Fazer uma compra de teste (seção 2.6) e tocar em "Avisar a Andreía": o robô deve responder em
   segundos, e a conversa aparece também no app da Andreía.
2. Aprovar o horário no Modo Andreía: a pessoa recebe a mensagem com o botão **Confirmar**.
3. Nos logs (`npx wrangler@4 tail`), nenhum aviso pode aparecer como "assinatura inválida".

---

## 4. Regras do Firestore (sempre que `firestore.rules` mudar)

As regras ficam no repositório (`firestore.rules`) mas só valem depois de publicadas no console:

1. Firebase Console → **Firestore Database** → **Regras**.
2. Apagar o conteúdo e colar o `firestore.rules` inteiro da `main`.
3. **Publicar**.

A publicar:

- (1.28.0) Jornada (progresso), "Um pouco sobre mim" e pedidos da ativação só gravam com o e-mail
  confirmado (`email_verified` do token; quem entra pelo Google já vem confirmado). Contas de teste
  com e-mail e senha precisam confirmar o e-mail antes.
- (1.27.0) `users/{uid}` aceita os dados da aba Conta (nome completo, apelido, celular, nascimento,
  novidades e foto). Sem publicar, "Salvar" na aba Conta avisa que não deu para salvar.

Mudanças publicadas em 2026-11-23:

- (1.26.0) Em `users/{uid}/sessions/{pedido}`, a pessoa também pode confirmar o horário que a Andreía
  aprovou (o mesmo horário, dentro das 24 h da reserva). Sem publicar, o botão "Confirmar este
  horário" do link não funciona.

- (1.25.0) `users/{uid}/sessions/{pedido}`: os pedidos da ativação individual. A pessoa cria e só passa
  de "Paga" para "Solicitada"; a Andreía lê e muda todos; o Worker marca como paga. Sem publicar, o
  botão "Pagar" não consegue criar o pedido e a tela Pedidos fica vazia.
- (1.24.0) `users/{uid}/anamnesis/{doc}`, onde cada pessoa guarda as respostas da
  anamnese da ativação individual (só ela grava; ela e a Andreía leem). Sem publicar, o fluxo funciona,
  mas as respostas não ficam na conta: a pessoa vê o aviso "Não deu para guardar suas respostas na conta
  agora" e precisa responder de novo da próxima vez.
