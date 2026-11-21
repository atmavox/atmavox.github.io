# Convenções

## Princípios

- **Clean code:** nomes que explicam a intenção, funções pequenas com uma responsabilidade, sem código morto,
  sem comentários que repetem o código (comente o **porquê**, não o **o quê**).
- **SOLID**, de forma pragmática:
  - **S:** cada módulo tem um motivo para mudar (regra ≠ persistência ≠ tela).
  - **O:** estender por dados e novos tipos (ex.: novo tipo de seção do dia), sem reescrever o que funciona.
  - **L:** implementações de uma mesma interface são intercambiáveis (localStorage, Firestore, memória nos
    testes).
  - **I:** interfaces pequenas e focadas (`AuthService` separado de `ProgressRepository`).
  - **D:** a aplicação depende de interfaces; só a composição (`app/`) escolhe as implementações.
- **KISS e YAGNI:** a solução mais simples que resolve. Não crie abstração para um caso que ainda não existe.

## TypeScript

- `strict: true` e `noUncheckedIndexedAccess`. **Proibido `any`**; use `unknown` e valide.
- `import type` para tipos (`@typescript-eslint/consistent-type-imports`).
- Prefira `type` para unions e `interface` para formatos de objeto.
- Dados vindos de fora (localStorage, Firestore, URL) passam por uma função `parseX(unknown)`.
- Funções de domínio são **puras e imutáveis**: `(estado, args) => novoEstado`.

## React

- Componentes de função, um componente principal por arquivo, em `PascalCase.tsx`.
- Lógica de negócio **fora** dos componentes (em `domain/` ou `application/`).
- Estado global mínimo: um store da jornada exposto via contexto + `useSyncExternalStore`.
- Acessibilidade: elementos semânticos, `aria-*` corretos, foco visível, contraste AA nos dois temas.

## Estilo (Tailwind v4)

- Use **apenas tokens semânticos** (`bg-surface`, `text-ink`, `text-accent`, `border-line`…), definidos em
  `src/shared/theme/`. **Nunca use cores soltas** (`#fff`, `text-amber-500`), porque quebram o tema claro
  ou o escuro.
- Mobile-first: comece pelo layout de celular e adicione `sm:`/`md:` depois.
- Respeite `prefers-reduced-motion`.

## Nomes

| O quê              | Padrão                    | Exemplo                      |
| ------------------ | ------------------------- | ---------------------------- |
| Componentes        | `PascalCase.tsx`          | `DayCard.tsx`                |
| Hooks              | `useCamelCase.ts`         | `useHashRoute.ts`            |
| Módulos de lógica  | `camelCase.ts`            | `progress.ts`                |
| Testes             | ao lado, `.test.ts(x)`    | `progress.test.ts`           |
| Ids de campo       | `d{dia}:{chave}`          | `d3:raiz`, `r7:q1`           |
| Código             | inglês                    | `toggleDay`, `JourneyStore`  |
| Textos de interface | português do Brasil      | "Concluir dia"               |

## Testes (Vitest)

- Toda regra em `domain/` tem teste. Bug corrigido ganha teste que o reproduz.
- Testes descrevem comportamento em português: `it('não perde dias ao mesclar aparelho e nuvem')`.
- Sem rede nem Firebase nos testes: use implementações em memória das interfaces.

## Lint e formatação

- **ESLint** (typescript-eslint, react-hooks, react-refresh, jsx-a11y) + **Prettier**.
- `no-restricted-imports` impede `domain/` e `content/` de importar React, Firebase ou `ui/`.
- Não desative regras com `eslint-disable` sem um comentário explicando o motivo.

## Commits (o desenvolvedor executa; o Claude só sugere)

[Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português:

```
feat(jornada): salvar respostas no Firestore quando logada
fix(hub): corrigir link do TikTok
docs(ai): atualizar features.md com abas de evolução
refactor(jornada): extrair cálculo de progresso por semana
chore: atualizar dependências
```

Tipos: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `ci`. Escopos: `hub`, `jornada`,
`shared`, `ai`, `deploy`.
