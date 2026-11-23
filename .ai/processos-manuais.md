# Processos manuais pendentes

Configurações que só uma pessoa consegue fazer (contas, chaves, painéis). Todas são gratuitas. Ao
terminar um item, marque `[x]` aqui e no `roadmap.md`. **Nenhuma chave vai para o repositório, para o
WhatsApp ou para conversas**: elas são coladas direto nos segredos do GitHub ou do Worker.

Onde ficam as configurações do GitHub: repositório `atmavox.github.io` → **Settings → Secrets and
variables → Actions** (abas **Variables** e **Secrets**).

## Resumo

- [ ] Redes sociais: TikTok (`SOCIAL_TIKTOK_URL`)
- [ ] Redes sociais: Instagram (`INSTAGRAM_TOKEN`, renovar a cada 60 dias)
- [ ] Redes sociais: Spotify (`SOCIAL_SPOTIFY_RSS`, quando o podcast existir)
- [ ] Pagamentos: conta de serviço do Firebase + Mercado Pago + Worker + webhook + botão + compra de teste
- [ ] Robô do WhatsApp (depois dos pagamentos): app na Meta + número em "coexistence" + token + webhook

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

### Spotify (quando o podcast existir)

1. No Spotify for Creators, em **Configurações → Distribuição**, copie o **link do feed RSS**.
2. Em **Variables**, crie `SOCIAL_SPOTIFY_RSS` com esse link.

### Instagram (configuração única, depois renovar a chave)

O Instagram só entrega publicações pela API oficial da Meta. Feito uma vez, com a conta da Andreía:

1. **Conta profissional:** no app do Instagram, **Configurações → Tipo de conta e ferramentas → Mudar
   para conta profissional** (Criador de conteúdo ou Empresa). Não custa nada.
2. **App na Meta:** em <https://developers.facebook.com/apps>, **Criar app** → tipo **Empresa**. Dentro
   do app, adicione o produto **Instagram** → "Configuração da API com login do Instagram".
3. **Gerar o token:** em "Gerar tokens de acesso", adicione a conta `@atmavox`, entre com ela e copie o
   token (é de longa duração: vale 60 dias).
4. **Guardar no GitHub:** em **Secrets** (não Variables), crie `INSTAGRAM_TOKEN` com o token.

**Renovar a cada 60 dias:** antes de vencer, abra no navegador (trocando `TOKEN` pela chave atual)
`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TOKEN`,
copie o `access_token` novo da resposta e troque o secret. Se vencer, o cartão do Instagram some e o
resto continua normal. (Dá para automatizar a renovação depois, com um workflow que atualiza o secret.)

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

1. Entrar em [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) → **Criar
   aplicação** → tipo "Pagamentos online", produto **Checkout Pro**.
2. Conta pronta para receber: identidade verificada e uma **chave Pix** cadastrada no Mercado Pago.
3. Em **Credenciais de produção**, copiar o **Access Token** (`APP_USR-…`), só para colar no passo 2.3.
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

1. Com as **credenciais de teste** e um **usuário de teste comprador** (painel → Contas de teste),
   repetir os passos 2.3 e 2.4 num Worker de teste, ou trocar o `MP_ACCESS_TOKEN` temporariamente.
2. Comprar um produto pago: deve voltar para "Pronto, … é sua" e aparecer "Sua" no hub.
3. Voltar o `MP_ACCESS_TOKEN` de produção.

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

Antes de começar, confira na página oficial de preços da Meta
(<https://developers.facebook.com/docs/whatsapp/pricing>): em outubro de 2026 a cobrança mudou. O
esperado é custo zero no volume da Andreía para respostas dentro da conversa aberta pela pessoa; o
lembrete na véspera (modelo fora da janela de 24 h) pode ser pago e, nesse caso, fica desligado.

### 3.1 Conta e verificação (com a Andreía)

1. Em <https://business.facebook.com>, entrar com a conta da Andreía e conferir em **Configurações do
   negócio → Central de segurança** se o negócio está **verificado**. Se não estiver, iniciar a
   verificação (pede documentos do negócio ou da Andreía; pode levar alguns dias).
2. Conferir se o número do WhatsApp Business dela está no app **WhatsApp Business** atualizado
   (versão 2.24.17 ou mais nova). É ele que vai funcionar no app e no robô ao mesmo tempo
   ("coexistence").

### 3.2 App na Meta

1. Em <https://developers.facebook.com/apps>, **Criar app** → tipo **Empresa** → ligar ao portfólio
   do negócio da Andreía.
2. Adicionar o produto **WhatsApp** → **Configuração da API**.
3. Em **Números de telefone**, **Adicionar número** → escolher **usar o número do app WhatsApp
   Business** (coexistence) e seguir o passo a passo, que pede um código no celular da Andreía.
   Se essa opção não aparecer, anote a mensagem e avise o desenvolvedor antes de seguir: sem
   coexistence, o número sai do app e ela perde a conversa pelo celular.
4. Anotar o **ID do número de telefone** e o **ID da conta do WhatsApp Business** (aparecem na mesma
   tela). Não são segredos.

### 3.3 Token permanente (segredo)

1. Em **Configurações do negócio → Usuários → Usuários do sistema**, criar um usuário do sistema
   "atmavox-robo" (função Administrador) e dar a ele acesso ao app e à conta do WhatsApp.
2. **Gerar token** com as permissões `whatsapp_business_messaging` e
   `whatsapp_business_management`, sem validade.
3. Colar direto no Worker (pasta `worker/`), sem passar por conversa nem arquivo:

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
