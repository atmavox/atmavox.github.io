# Pagamentos (Mercado Pago + Worker · ADR-023)

Passo a passo para ligar a venda de jornadas e meditações. Tudo gratuito; a taxa é só por venda, no
Mercado Pago. **Nenhuma chave vai para o repositório, para o WhatsApp ou para conversas**: elas são
coladas direto nos segredos do Worker.

## Visão geral

```
site (logada) ──POST /checkout──▶ Worker ──cria cobrança──▶ Mercado Pago
                                                              │ a pessoa paga
Mercado Pago ──POST /webhook──▶ Worker ──grava acesso──▶ Firestore users/{uid}/access/{produto}
Mercado Pago ──volta──▶ Worker /retorno ──▶ site #/pagamento/aprovado/{produto}
```

## 1. Conta de serviço do Firebase (para o Worker gravar os acessos)

1. Firebase Console → ⚙️ **Configurações do projeto** → **Contas de serviço**.
2. **Gerar nova chave privada** → baixa um `.json`. Guarde no computador, **fora do repositório**.
3. Depois do passo 3, apague esse arquivo (ele fica só no segredo do Worker).

## 2. Mercado Pago (conta da Andreía)

1. Entrar em [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) → **Criar
   aplicação** → tipo "Pagamentos online", produto **Checkout Pro**.
2. Conta pronta para receber: identidade verificada e uma **chave Pix** cadastrada no Mercado Pago.
3. Em **Credenciais de produção**, copiar o **Access Token** (`APP_USR-…`), só para colar no passo 3.
4. Webhooks: deixar para o passo 4 (precisa do endereço do Worker).

## 3. Worker na Cloudflare

1. Criar conta grátis em [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) (plano Free).
2. No computador, na pasta `worker/` do projeto:

   ```bash
   npx wrangler@4 login                     # abre o navegador para autorizar
   npx wrangler@4 deploy                    # publica; mostra o endereço, ex.: https://atmavox-pagamentos.<conta>.workers.dev
   npx wrangler@4 secret put MP_ACCESS_TOKEN          # cole o Access Token
   npx wrangler@4 secret put FIREBASE_SERVICE_ACCOUNT # cole o conteúdo inteiro do .json
   ```

3. Anote o endereço do Worker.

## 4. Webhook do Mercado Pago

1. Em Suas integrações → a aplicação → **Webhooks** → **Configurar notificações** (modo produção).
2. URL: `https://<endereço do Worker>/webhook`; evento **Pagamentos**; salvar.
3. Copiar a **assinatura secreta** e colar no Worker:

   ```bash
   npx wrangler@4 secret put MP_WEBHOOK_SECRET
   ```

4. **Teste obrigatório:** no painel, **Simular notificação** de pagamento. Nos logs do Worker
   (`npx wrangler@4 tail`), o aviso não pode aparecer como "assinatura inválida". Se aparecer, avise o
   desenvolvedor antes de abrir as vendas (o formato da assinatura pode ter mudado).

## 5. Ligar o botão "Pagar" no site

1. GitHub → repositório → **Settings → Secrets and variables → Actions → Variables** → **New
   repository variable**: `VITE_PAYMENTS_URL` = endereço do Worker (sem barra no fim).
2. Fazer um novo deploy (qualquer push na `main`, ou "Re-run" do último workflow).

## 6. Testar antes de vender

1. Com as **credenciais de teste** e um **usuário de teste comprador** (painel → Contas de teste),
   repetir os passos 3 e 4 num Worker de teste, ou trocar o `MP_ACCESS_TOKEN` temporariamente.
2. Comprar um produto pago: deve voltar para "Pronto, … é sua" e aparecer "Sua" no hub.
3. Voltar o `MP_ACCESS_TOKEN` de produção.

## Se algo der errado

- A pessoa pagou e o acesso não apareceu: ver `npx wrangler@4 tail` e o pagamento no Mercado Pago.
  A Andreía pode liberar à mão (`firebase-setup.md`, seção 8), sem prejuízo para ninguém.
- Estorno pelo Mercado Pago tira o acesso que veio daquele pagamento automaticamente.
- Direito de arrependimento (7 dias, compra online): o estorno é feito pelo painel do Mercado Pago.
