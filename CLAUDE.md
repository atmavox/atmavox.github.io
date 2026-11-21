# CLAUDE.md — Atmavox

Site oficial da **ATMAVOX**, marca da terapeuta **Andreia Oliveira** (autoconhecimento, presença e jornadas
individuais). Um único projeto com duas partes:

- **Hub** (`/`): página principal da marca, que leva a todos os produtos. Substitui o atmavox.keepo.bio.
- **Jornada** (`/jornada`): workbook interativo "Saindo do Estado Cinza — 21 Dias de Ativação da Chama Interna".

Publicado de graça em **https://atmavox.github.io** (GitHub Pages, organização `atmavox`, repositório
`atmavox.github.io`). É o link da bio do Instagram.

## URL: decisão provisória (em aberto)

Seguimos com `atmavox.github.io` **por enquanto**, mas a escolha não está fechada. A preocupação: perfis de
Instagram que não são de programador quase nunca usam na bio uma URL que aponta para o GitHub, e isso pode
soar pouco profissional para a marca.

Por que ainda é GitHub Pages (avaliado em 2026-11):

- **Tirar o "github.io" exige domínio próprio pago** (ex.: `atmavox.com.br`, cerca de R$ 40/ano no
  Registro.br). As alternativas gratuitas que estão à altura de uma marca não existem: Cloudflare Pages,
  Netlify e Vercel só trocam um sufixo por outro (`.pages.dev`, `.netlify.app`, `.vercel.app`), e
  subdomínios grátis como `eu.org` são lentos de aprovar e parecem amadores.
- **Lovable** publicaria em `atmavox.lovable.app` (também com sufixo). Domínio próprio lá exige plano pago,
  e no plano grátis **o site pode ser despublicado por inatividade**, um risco inaceitável para o link da bio.

Se a Andreia decidir pagar o domínio, o caminho é manter o GitHub Pages e apontar o domínio para ele
(`public/CNAME`, DNS, HTTPS, domínio autorizado no Firebase Auth), registrando a mudança em
`.ai/decisions.md`. Não migre a hospedagem nem compre nada sem pedido explícito.

## Idioma

**Tudo em português do Brasil:** textos do site, `lang="pt-BR"` no HTML, metadados, mensagens de erro,
documentação (`.ai/`, README), mensagens de commit e as respostas do Claude. A única exceção são os nomes
no código (variáveis, funções, tipos, arquivos), que ficam em inglês.

## Contexto obrigatório

@.ai/purpose.md
@.ai/conventions.md

Os demais arquivos da `.ai/` devem ser lidos **sob demanda**, conforme a tarefa (índice em `.ai/README.md`).

## Regras inegociáveis

1. **Git:** nunca rode comandos que alterem o repositório (`add`, `commit`, `push`, `pull`, `checkout`,
   `switch`, `reset`, `restore`, `rebase`, `merge`, `stash`, `tag`, `clean`) **sem que eu peça
   explicitamente na mensagem atual.** Leitura (`status`, `diff`, `log`, `show`) é permitida. Ao terminar
   uma tarefa, **sugira** a mensagem de commit, sem executar.
2. **Custo zero:** nada de serviços, planos ou dependências pagas. Firebase só no plano gratuito (Spark).
3. **O conteúdo é da Andreia:** não reescreva textos terapêuticos (rituais, afirmações, perguntas,
   manifesto). Corrija só erros evidentes de digitação e pergunte antes de mudar o sentido. A fonte original
   está em `.ai/reference/workbook-original.html`.
4. **Ids de campo publicados são imutáveis:** as respostas das pessoas são salvas por eles. Renomear exige
   migração (ver `.ai/features.md`).
5. **Sem segredos no repositório:** `.env.local` fica fora do git. A config web do Firebase vai em variáveis
   do GitHub Actions, não no código.
6. **Antes de dizer "pronto":** `npm run check` e `npm run build` precisam passar. Se não der para rodar,
   diga isso claramente.
7. **Fronteiras de pasta:** não altere `src/features/hub/` numa tarefa da jornada, nem o contrário, sem
   avisar. Código comum vai para `src/shared/`.

## Comandos

```bash
npm install         # Node 22 LTS
npm run dev         # http://localhost:5173
npm run check       # typecheck + lint + testes (obrigatório antes de finalizar)
npm run build       # build de produção em dist/
npm run preview     # serve o build
npm run format      # prettier
```

## Como trabalhar comigo

1. **Entenda antes de codar.** Leia os arquivos da `.ai/` relevantes e o código envolvido. Se a tarefa for
   ambígua ou grande, proponha um plano curto e espere meu ok.
2. **Passos pequenos.** Uma mudança coesa por vez, do tamanho de um commit.
3. **Teste junto.** Toda regra nova em `domain/` ganha teste. Todo bug corrigido ganha um teste que o
   reproduz.
4. **Feche o ciclo:** rode `npm run check`, atualize `.ai/changelog.md` (seção "Não lançado") e
   `.ai/features.md` se o comportamento mudou, e então sugira o commit.
5. **Toda decisão de arquitetura nova** (biblioteca, padrão, mudança de estrutura) ganha um registro em
   `.ai/decisions.md`.
6. Responda em **português do Brasil** (ver a seção "Idioma").

## Mapa rápido

```
src/
  app/                 composição: rotas, providers, layout
  features/
    hub/               página principal (produtos, áudio grátis, redes)
    jornada/           workbook de 21 dias
      domain/          regras puras (progresso, merge, validação), sem React/Firebase
      content/         textos da jornada como dados tipados
      application/     portas (interfaces) e store
      infrastructure/  localStorage e Firebase
      ui/              páginas e componentes React
  shared/              tema, componentes de UI comuns, utilitários
.ai/                   contexto para IA: propósito, stack, arquitetura, features, decisões, changelog
```
