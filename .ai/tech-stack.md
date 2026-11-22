# Stack

| Área               | Escolha                                                                | Por quê                                                            |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Linguagem          | **TypeScript** (estrito)                                               | Erros aparecem antes de rodar; a IA erra menos com tipos claros    |
| UI                 | **React 19**                                                           | Ecossistema enorme, mesma base do Lovable (compatível no futuro)   |
| Build e dev        | **Vite**                                                               | Rápido, simples, gera site estático para o GitHub Pages            |
| Estilo             | **Tailwind CSS v4** + tokens em CSS variables                          | Tema claro/escuro por `data-theme`; mesma base do Lovable          |
| Fontes             | **Fontsource** (Jost e Playfair Display, variáveis)                    | Hospedadas junto com o site: sem chamar o Google, funciona offline |
| Ícones             | **lucide-react**                                                       | Leves, consistentes, tree-shaking                                  |
| Rotas              | Hash routing (`#/jornada`)                                             | Funciona no GitHub Pages sem configurar servidor (sem erro 404)    |
| Login e dados      | **Firebase** Auth + Firestore, plano Spark (grátis)                    | Projeto `atmavox-ativacao`; login Google e e-mail/senha            |
| Persistência local | `localStorage`                                                         | Jornada funciona sem login e sem internet                          |
| Testes             | **Vitest** + Testing Library + jsdom                                   | Integrado ao Vite, rápido                                          |
| Lint               | **ESLint 9** (typescript-eslint, react-hooks, react-refresh, jsx-a11y) | Padrão do template Vite; acessibilidade (9, não 10: ADR-008)       |
| Formatação         | **Prettier** + eslint-config-prettier                                  | Formatação automática sem brigar com o lint                        |
| CI/CD              | **GitHub Actions** → GitHub Pages                                      | Grátis; deploy a cada push na `main`                               |
| Hospedagem         | **GitHub Pages**, organização `atmavox`                                | Grátis; URL limpa `atmavox.github.io`                              |
| Node               | 24 LTS (`.nvmrc`)                                                      | LTS ativa (a 22 está só em manutenção); suportada pelo Vite        |

## Regras para dependências

- Antes de adicionar uma, pergunte: dá para resolver com o que já existe, em poucas linhas?
- Nada pago, nada que exija cartão de crédito.
- Registre em `decisions.md` toda dependência que muda a arquitetura (roteador, estado, backend).
- **Firebase deve ser carregado sob demanda** (`import()` dinâmico): quem não loga não baixa o SDK.

## Variáveis de ambiente

```bash
# .env.local (não vai para o git) e variáveis do GitHub Actions
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=atmavox-ativacao.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=atmavox-ativacao
VITE_FIREBASE_APP_ID=
```

Sem essas variáveis o site funciona normalmente: a jornada salva só no navegador e o botão "Entrar" some.
Modelo em `.env.example`; passo a passo do console e do GitHub em `firebase-setup.md`.
