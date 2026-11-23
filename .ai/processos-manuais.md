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
