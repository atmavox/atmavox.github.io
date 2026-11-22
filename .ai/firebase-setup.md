# Configurar o Firebase (login opcional · F5)

Passo a passo para ligar o login e a nuvem. Tudo no **plano Spark (gratuito)**; nenhum passo pede cartão.
Enquanto isso não for feito, o site funciona normalmente e o botão "Entrar" não aparece.

## 1. Projeto e app web

1. Acesse https://console.firebase.google.com e abra o projeto **`atmavox-ativacao`** (se não existir, crie
   com esse nome; o Google Analytics pode ficar desativado).
2. Em **Configurações do projeto → Geral**, defina o **Nome público** como `ATMAVOX`. É o nome que aparece
   na tela "Escolha uma conta" do Google.
3. Ainda em **Geral → Seus apps**, clique no ícone **Web `</>`**, dê o apelido `atmavox-site` e **não**
   marque o Firebase Hosting. Copie os quatro valores do `firebaseConfig`: `apiKey`, `authDomain`,
   `projectId` e `appId`.

> Esses valores **não são segredo** (vão no código do site de qualquer forma). A proteção dos dados está nas
> regras do Firestore (passo 3). Mesmo assim, ficam fora do repositório, como manda o CLAUDE.md.

## 2. Authentication

1. **Authentication → Vamos começar → Método de login**:
   - **Google**: ativar e escolher o e-mail de suporte.
   - **E-mail/senha**: ativar só a primeira chave (deixe "Link de e-mail" desligado).
2. **Authentication → Configurações → Domínios autorizados → Adicionar domínio**: `atmavox.github.io`
   (`localhost` já vem na lista, para testar no computador).
3. **Authentication → Modelos**: troque o idioma para **Português (Brasil)**. É o idioma do e-mail de
   "recuperar senha".

## 3. Firestore

1. **Firestore Database → Criar banco de dados**: edição **Standard**, local **`southamerica-east1`
   (São Paulo)**, **modo de produção**.
2. Aba **Regras**: apague o conteúdo, cole o arquivo [`firestore.rules`](../firestore.rules) da raiz do
   repositório e clique em **Publicar**. Assim, cada pessoa só lê e grava os próprios dados.

## 4. Variáveis do deploy (GitHub)

No repositório `atmavox/atmavox.github.io`: **Settings → Secrets and variables → Actions → aba
Variables → New repository variable**, uma para cada valor do passo 1.3:

| Nome                        | Valor                              |
| --------------------------- | ---------------------------------- |
| `VITE_FIREBASE_API_KEY`     | o `apiKey`                         |
| `VITE_FIREBASE_AUTH_DOMAIN` | `atmavox-ativacao.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID`  | `atmavox-ativacao`                 |
| `VITE_FIREBASE_APP_ID`      | o `appId`                          |

Depois, em **Actions → Checar e publicar → Run workflow**, publique de novo (ou espere o próximo push).

## 5. Testar no computador (opcional)

Copie `.env.example` para `.env.local`, preencha os quatro valores e rode `npm run dev`. O `.env.local` não
vai para o git.

## 6. Proteção extra da chave (opcional, recomendado)

No **Google Cloud Console → APIs e serviços → Credenciais**, abra a chave "Browser key" do projeto e, em
**Restrições de aplicativo → Sites**, permita só `https://atmavox.github.io/*` e `http://localhost:5173/*`.

## Como conferir (critério de aceite da F5)

1. Sem login, escreva algo na jornada.
2. Toque em **Entrar** e entre com o Google: o texto continua lá e o ponto ao lado da inicial fica âmbar
   ("Salvo na nuvem").
3. No console, **Firestore → Dados**: aparece `users/{seu uid}/journeys/chama-interna-21`.
4. Abra o site em outro navegador ou no celular, entre com a mesma conta: o mesmo progresso aparece.
5. **Sair da conta**: o progresso some deste aparelho e volta ao entrar de novo.

## Limites do plano gratuito

Spark: 50 mil leituras e 20 mil gravações por dia no Firestore. O site lê uma vez ao entrar e grava no
máximo uma vez a cada pausa de 800 ms na escrita, o que fica muito abaixo disso para o público esperado.
