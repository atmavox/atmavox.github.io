# Configurar o Firebase (login opcional · F5)

Passo a passo para ligar o login e a nuvem. Tudo no **plano Spark (gratuito)**; nenhum passo pede cartão.
Enquanto isso não for feito, o site funciona normalmente e o botão "Entrar" não aparece.

## 1. Projeto e app web

1. Acesse https://console.firebase.google.com e abra o projeto **atmavox** (ID **`atmavox-b72a4`**, criado
   em 2026-11-21; o ID `atmavox` já existia no mundo). Dona: a Andreía (Proprietária em _Usuários e
   permissões_).
2. Em **Configurações do projeto → Geral**, defina o **Nome público** como `ATMAVOX`. É o nome que aparece
   na tela "Escolha uma conta" do Google.
3. Ainda em **Geral → Seus apps**, clique no ícone **Web `</>`**, dê o apelido `atmavox-web` e **não**
   marque o Firebase Hosting. Copie os quatro valores do `firebaseConfig`: `apiKey`, `authDomain`,
   `projectId` e `appId`.

> Esses valores **não são segredo** (vão no código do site de qualquer forma). A proteção dos dados está nas
> regras do Firestore (passo 3). Mesmo assim, ficam fora do repositório, como manda o CLAUDE.md.

## 2. Authentication

> **E-mail de suporte:** a lista só mostra o e-mail de quem está logado no console (e Grupos do Google que
> essa pessoa administra). Para usar o e-mail da Andreía, ela mesma entra com a conta dela e troca em
> _Authentication → Método de login → Google_. Hoje está provisoriamente com o e-mail do desenvolvedor.

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
Variables → New repository variable**, uma para cada valor do passo 1.3. (O workflow também aceita os
mesmos nomes cadastrados na aba **Secrets**; se existirem nas duas, vale a Variable.)

| Nome                        | Valor                           |
| --------------------------- | ------------------------------- |
| `VITE_FIREBASE_API_KEY`     | o `apiKey`                      |
| `VITE_FIREBASE_AUTH_DOMAIN` | `atmavox-b72a4.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID`  | `atmavox-b72a4`                 |
| `VITE_FIREBASE_APP_ID`      | o `appId`                       |

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

## 7. Cadastrar a Andreía como admin (modo Andreía, Fase 4)

Ser admin = existir o documento `admins/{uid}`. Só se cria pelo console (o site não tem como).

1. A Andreía entra **uma vez** no site (atmavox.github.io → Jornada → **Entrar**) com a conta que ela
   vai usar para editar (Google ou e-mail).
2. No console: **Authentication → Usuários**. Ache a linha com o e-mail dela e copie o valor da coluna
   **UID do usuário** (um código como `aB3dE...`; há um botão de copiar ao passar o mouse).
3. **Firestore Database → Dados → + Iniciar coleção**:
   - **ID da coleção:** `admins` → Próxima;
   - **ID do documento:** cole o UID (não use "ID automático");
   - campo: `nome`, tipo `string`, valor `Andreía Oliveirà` → **Salvar**.
4. Confira que as regras publicadas são as do `firestore.rules` atual (com `isAdmin()`).

Para tirar o acesso, apague o documento. Dá para ter mais de uma admin (um documento por UID).

**Se o Google pedir verificação pelo celular e ela não puder agora:** em **Authentication → Usuários →
Adicionar usuário**, crie a conta dela com o e-mail e uma senha provisória. O UID aparece na hora; ela
entra pela opção de e-mail e senha e troca a senha em "Esqueci a senha". (Fica separada de uma conta
Google com o mesmo e-mail.)

**Como conferir:** entre no site com a conta admin e abra o menu da inicial: aparece "Modo Andreía", e
todas as abas e dias da jornada ficam abertos, sem cadeados. Se não aparecer, saia e entre de novo.

## Limites do plano gratuito

Spark: 50 mil leituras e 20 mil gravações por dia no Firestore. O site lê uma vez ao entrar e grava no
máximo uma vez a cada pausa de 800 ms na escrita, o que fica muito abaixo disso para o público esperado.
