<div align="center">

<img src="public/favicon.svg" alt="Símbolo da ATMAVOX: cinco barras de áudio, a do centro em âmbar" width="96" height="96">

# ATMAVOX

**Consciência, presença e expansão.**

O site de Andreía Oliveirà: um áudio de boas-vindas, os encontros ao vivo,<br>
as jornadas e as meditações guiadas, pensado para o celular.

[**Abrir o site →**](https://atmavox.github.io)

![React](https://img.shields.io/badge/React_19-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-0b1120?logo=tailwindcss&logoColor=38bdf8)
![Firebase](https://img.shields.io/badge/Firebase-login_opcional-dd2c00?logo=firebase&logoColor=ffca28)
![Custo](https://img.shields.io/badge/custo_mensal-R%24_0-2e7d32)

</div>

> _Não estamos aqui para ensinar você a viver. Estamos aqui para explorar tudo aquilo que você ainda não
> descobriu sobre estar vivo._

---

## ✨ O que tem no site

<table>
<tr>
<td width="50%" valign="top">

### 🏠 Hub: a página da bio

A porta de entrada de quem chega pelo Instagram. **No celular**, um app com abas embaixo (Início · Ouvir ·
Jornadas · Contato); **no computador**, uma página em estilo revista com menu no topo. O mesmo link
(`#/jornadas`, por exemplo) abre a aba no celular e rola até a seção no computador.

### 🎧 Áudio que não para

Um player próprio, fino, logo abaixo do cabeçalho: continua tocando ao trocar de aba ou ir para a
jornada, funciona com a tela bloqueada (controles do sistema) e não depende do YouTube.

### 🌗 Claro e escuro

Escuro "Sépia" e claro "Areia", escolhidos entre várias opções. Segue o sistema na primeira visita, lembra
a escolha e passa no contraste de leitura (AA) nos dois temas.

</td>
<td width="50%" valign="top">

### ☁️ Login opcional

Quem quiser entra com Google ou e-mail e passa a ter o progresso em qualquer aparelho. Quem não quiser
usa normalmente: tudo fica no próprio navegador. Ao sair da conta, as reflexões são apagadas do aparelho
(são íntimas).

### ♿ Feito para todo mundo

Leitores de tela, navegação por teclado, foco visível, movimento reduzido e textos em português do Brasil,
pensados para quem não é da área de tecnologia.

</td>
</tr>
</table>

## 🧭 Como funciona

| Parte                    | Onde fica                                  | Por quê                                        |
| ------------------------ | ------------------------------------------ | ---------------------------------------------- |
| Site                     | GitHub Pages                               | Grátis, rápido e sem servidor para manter      |
| Progresso da jornada     | `localStorage` do navegador                | Funciona sem conta e sem internet              |
| Conta e nuvem (opcional) | Firebase Auth + Firestore (plano gratuito) | Mesmo progresso em qualquer aparelho           |
| Áudios                   | Arquivos no próprio site (`public/audio/`) | Player bonito e leve, sem conta externa        |
| Vídeos                   | YouTube, carregado só ao tocar             | Página leve e sem rastreio para quem só visita |

Quem não entra na conta **não baixa o Firebase**: ele só é carregado ao tocar em "Entrar". Cada pessoa só
lê e grava os próprios dados (regras em [`firestore.rules`](firestore.rules)).

## 🛠️ Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (estrito)
- [Tailwind CSS 4](https://tailwindcss.com/) com tokens da marca · [Fontsource](https://fontsource.org/) (Jost e Playfair Display)
- [lucide-react](https://lucide.dev/) — ícones
- [Firebase](https://firebase.google.com/) Auth + Firestore _lite_ — login opcional, carregado sob demanda
- [Vitest](https://vitest.dev/) + Testing Library · ESLint (com jsx-a11y) · Prettier
- GitHub Pages + GitHub Actions — hospedagem e deploy

A arquitetura (camadas da jornada, decisões e convenções) está documentada em [`.ai/`](.ai/README.md).

## 🚀 Como rodar

### Requisitos

- [Node.js 24 LTS](https://nodejs.org/) (veja `.nvmrc`) e Git

### No computador

```bash
git clone https://github.com/atmavox/atmavox.github.io.git
cd atmavox.github.io
npm install
npm run dev
```

O site abre em `http://localhost:5173`.

Para testar o login, crie um `.env.local` a partir do [`.env.example`](.env.example) com a configuração do
app web do Firebase. Ele fica fora do git. Sem ele, o site funciona normalmente e o botão "Entrar" não
aparece.

### Antes de cada commit

```bash
npm run check   # typecheck + lint + formatação + testes
npm run build   # build de produção em dist/
```

## 📦 Deploy

Cada push na `main` roda o `check`, gera o build e publica no GitHub Pages pelo GitHub Actions. A
configuração web do Firebase entra no build pelas variáveis `VITE_FIREBASE_*` do repositório (_Settings →
Secrets and variables → Actions_). Ela é pública por natureza: a proteção dos dados está nas regras do
Firestore. O passo a passo do console está em [`.ai/firebase-setup.md`](.ai/firebase-setup.md).

## 💸 Custo zero

- **Hospedagem:** GitHub Pages (grátis para repositórios públicos).
- **Login e nuvem:** Firebase no plano Spark (grátis, sem cartão). O site lê a nuvem uma vez ao entrar e
  grava no máximo uma vez a cada pausa na escrita, muito abaixo dos limites diários.
- **Fontes, áudios e ícones:** servidos pelo próprio site.
- **Domínio:** `atmavox.github.io`. Um domínio próprio seria o único custo, se um dia fizer sentido.

## 🗺️ Roadmap

- [x] **Base** — Vite, TypeScript estrito, lint, testes e deploy automático
- [x] **Jornadas interativas** — tudo salvo na hora, abas com evolução
- [x] **Temas** — claro "Areia" e escuro "Sépia" com contraste AA
- [x] **Hub** — abas no celular, revista no computador, áudio de boas-vindas e encontros
- [x] **Login opcional** — Google ou e-mail, sincronização entre aparelhos
- [ ] **Conteúdo da Andreía** — horários dos encontros, foto, textos e redes que faltam
- [ ] **Depois** — diário em PDF, app instalável (PWA), lembrete diário, jornada "Ritual Matinal"

O roadmap detalhado está em [`.ai/roadmap.md`](.ai/roadmap.md).

## 📜 Conteúdo e créditos

Os textos terapêuticos (rituais, afirmações, perguntas e manifesto) e os áudios são de autoria de
**Andreía Oliveirà** e não podem ser reutilizados sem autorização.

<div align="center">
<br>
<sub>Feito com presença, com a ajuda do <a href="https://claude.ai">Claude</a>. ✦</sub>
</div>
