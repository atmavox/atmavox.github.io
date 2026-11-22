# Features

Cada feature tem: objetivo, regras e critérios de aceite. Status: 🔲 a fazer · 🔨 em andamento · ✅ pronta.
Ao mudar um comportamento, atualize aqui no mesmo commit.

---

## F1 · Hub (página principal) ✅ (aguardando conteúdo da Andreía)

**Objetivo:** substituir o atmavox.keepo.bio por uma página que apresenta o universo Atmavox
(posicionamento novo: `purpose.md`) e leva a cada parte dele, pensada primeiro para o celular.

**Layout (decidido em 2026-11 com protótipos clicáveis):** o mesmo conteúdo em duas estruturas (ADR-010):

- **Celular (< 700 px): "app com abas".** Barra fixa embaixo com Início · Ouvir · Jornadas · Contato.
  - Início: retrato da Andreía + slogan + "Um espaço para perceber… Com Andreía Oliveirà."; cartão "Comece aqui" (áudio curto de boas-vindas,
    `public/audio/atmavox-boas-vindas.m4a`, 48 s); próximos encontros; vídeo em destaque (quando houver).
  - Ouvir: áudios e encontros gravados, com filtro (Tudo · Áudios · Encontros gravados).
  - Jornadas: A Chama Interna (→ `#/jornada`), Ritual Matinal (lista de espera), Sessão individual.
  - Contato: sobre a Andreía, botão do WhatsApp, redes, assinatura.
- **Tablet e computador (≥ 700 px): "revista".** Página única com menu no topo: hero com pergunta
  provocadora + anéis; Encontros (2 colunas); Conversas em vídeo (3 colunas, só se houver vídeos);
  Jornadas (3 colunas); faixa com o princípio editorial; rodapé com redes e assinatura.
- Rotas: `#/` (início), `#/ouvir`, `#/jornadas`, `#/contato`. No celular trocam a aba; no computador rolam
  até a seção. Assim o mesmo link funciona nos dois.

**Mídia (ADR-011):**

- Áudio com **player próprio** (`<audio>` + arquivo MP3/M4A em `public/audio/`), com **mini player fino
  no topo, logo abaixo do cabeçalho fixo** (hub e jornada), que continua tocando ao trocar de aba, rolar
  ou ir para a jornada. O cartão "Comece aqui" é só áudio: **vídeos não entram
  na tela inicial** (pedido do cliente; eles ficam para a jornada). Um item de "Ouvir" sem arquivo ainda
  pode abrir o YouTube como alternativa.
- Vídeos do YouTube como **fachada**: só a miniatura carrega; o player (`youtube-nocookie.com`) entra
  quando a pessoa toca.

**Regras:**

- Links e WhatsApp em `shared/brand/links.ts`; textos e listas do hub em `features/hub/content.ts`.
- **Nada de marcador `[...]` publicado.** O que ainda não existe fica escondido ou ganha alternativa:
  - horário dos encontros ausente → "Horários no Instagram";
  - foto da Andreía ausente → anéis da marca no lugar;
  - redes sem link confirmado (Threads, Telegram) → não aparecem;
  - sem vídeos → a seção de vídeos não aparece.
- Corrigir os problemas do Keepo: TikTok quebrado e botões "Lista de Espera" sem destino.

**Aceite:** abre bem em celular de 360 px e no computador; todos os links funcionam; o áudio continua
tocando ao trocar de aba; Lighthouse ≥ 90 em performance e acessibilidade; funciona nos dois temas.

**Retrato:** a foto da Andreía do Keepo (`public/images/andreia-600.webp` e `-1200.webp`, ~13 e 33 kB) abre
o Início no celular e fica acima do cartão "Comece aqui" no computador; recortada no rosto, vira a foto
redonda de "Sobre".

**Pendências com a Andreía:** horários dos encontros; título do áudio de boas-vindas (provisório:
"Boas-vindas"); texto curto de apresentação;
links do Threads e do Telegram; textos novos do hub (hero, descrições), que foram escritos a partir do PDF
de posicionamento.

---

## F2 · Jornada de 21 dias ✅ (falta validar com a Andreia)

**Objetivo:** migrar o workbook de `.ai/reference/workbook-original.html` para React, sem perder conteúdo e
**salvando tudo** o que a pessoa escreve.

**Telas (abas):** Abertura · Semana I · Semana II · Semana III · Revisões · Vitórias · Encerramento.

**Estrutura de um dia:** lista de seções tipadas:

- `checkin` (emoções), `ritual`, `prompt` (pergunta + campo), `affirmation` (reescrevível), `closing`
  (temperatura energética + campo curto).
- Dias 1–7 têm seções próprias; dias 8–21 seguem o formato padrão
  ritual → reflexão → afirmação → fechamento.
- Dias 7, 14 e 21 são revisões (`isReview`).

**Conteúdo:** fica em `features/jornada/content/chama-interna-21.ts`. Marcação aceita nos textos:
`*itálico*`, `**negrito**`, `[texto](https://link)`.

**Ids de campo:** `d{dia}:{chave}` (dias), `r7|r14|r21:{q1..}` (revisões), `enc:{q1..|intencao}`
(encerramento). **Nunca mudar depois de publicado.** Para renomear, adicione uma migração em
`parseProgress` que copie o valor antigo para o novo id.

**Problemas do HTML original a corrigir na migração:**

- Só o rastreador era salvo: reflexões, emoções, humor e vitórias **sumiam ao recarregar**.
- Letras cirílicas: "Neutра" (dia 1) e "aprenди" (dia 3).
- Semana II definida duas vezes (versões diferentes). Use a mais completa, do `<script>` dentro da Semana II.
- `gerarDias` colocava `style="…"` dentro do atributo `class`.
- Vitórias montadas com `innerHTML` a partir do texto digitado (injeção de HTML).
- O link do áudio no dia 5 não era clicável (passa a apontar para o YouTube).

**Aceite:** os 21 dias aparecem com o texto original; tudo o que se escreve continua lá após recarregar;
testes de conteúdo garantem 21 dias, revisões em 7/14/21, ids únicos e nenhum caractere cirílico.

**Como ficou (decisões de implementação):**

- Salvo no `localStorage` em `atmavox:jornada:chama-interna-21`, a cada mudança.
- Toda afirmação ganhou um campo opcional "Sua versão da afirmação" (`d{dia}:afirmacao`), já que a
  spec diz "reescrevível". O dia 1 mantém a dica original como texto de apoio.
- Cada dia pode ser concluído pelo ✦ do cabeçalho ou pelo botão "Concluir dia" no fim do conteúdo; o
  rastreador da Abertura também marca e desmarca.
- O exemplo de vitória do original aparece só enquanto a lista está vazia, marcado como "Exemplo".
- Remover uma vitória pede confirmação na própria linha ("Remover? Sim / Não").
- O "✦" do título das revisões virou um enfeite visual (não faz parte do texto).
- O botão do Protocolo Presencial abre o WhatsApp com mensagem pronta (o original apontava para o Keepo).

**Pendências para a Andreia validar:**

- Instrução 4 da Abertura ("Campos entre [colchetes] são editáveis") e os textos entre colchetes
  (`[registre sua temperatura energética]`, `[escreva aqui sua intenção…]`) foram mantidos como no
  original, mas na versão interativa todo campo já é editável. Ela pode querer ajustar.
- A etiqueta "editável" foi mantida onde o original tinha.
- A "[Assinatura editável]" do encerramento era uma nota de modelo e não foi publicada.
- Texto da mensagem pronta do WhatsApp no encerramento.

---

## F3 · Abas com evolução ✅

**Objetivo:** cada aba mostra o quanto aquela etapa avançou, reforçando o conceito "sair do cinza".

**Regras:**

| Aba          | Medida                                       | Legenda |
| ------------ | -------------------------------------------- | ------- |
| Abertura     | dias concluídos / 21                         | `14%`   |
| Semana I–III | dias concluídos na semana / 7                | `3/7`   |
| Revisões     | perguntas respondidas / 11                   | `4/11`  |
| Vitórias     | vitórias registradas (meta 7 para "acender") | `2`     |
| Encerramento | campos respondidos / 4                       | `1/4`   |

- Cor do texto da aba: `color-mix(in oklab, var(--accent) {progresso}%, var(--gray-state))`.
- Barrinha de progresso embaixo de cada aba; ✦ quando completa.
- Barra fina com o progresso geral no rodapé do cabeçalho.
- A aba ativa sempre usa a cor de texto principal.

**Aceite:** marcar um dia atualiza a aba na hora; as cores são legíveis nos dois temas.

**Implementação:** medidas puras em `domain/measures.ts`; `application/tabProgress.ts` liga cada aba à
sua medida; `ui/JourneyHeader.tsx` desenha. Uma pergunta conta como respondida quando tem texto. Como
`--gray-state` e `--accent` passam de 4,5:1 nos dois temas, as cores intermediárias também ficam
legíveis.

---

## F4 · Temas claro e escuro ✅

**Regras:** escuro por padrão (mais suave que o original); claro como alternativa; respeita a preferência do
sistema na primeira visita; a escolha fica salva (`localStorage: atmavox:theme`); sem "piscar" ao carregar.
Botão sol/lua no cabeçalho, compartilhado entre hub e jornada.

**Aceite:** contraste AA nos dois temas; nenhuma cor solta no código.

**Implementação:** script inline no `index.html` (antes da pintura) + `shared/theme/theme.ts` (regra
pura, testada) + `useTheme` (o `data-theme` do `<html>` é a fonte da verdade, sem Provider) +
`ThemeToggle`. Exceção às cores soltas: o favicon e o `theme-color` do `index.html`, que não leem CSS.

---

## F5 · Login opcional e sincronização 🔨 (código pronto; falta configurar o console: `firebase-setup.md`)

**Objetivo:** quem quiser entra e passa a ter o progresso salvo em qualquer aparelho. Quem não quiser usa
normalmente.

**Regras:**

- Firebase `atmavox-b72a4`: login com Google e com e-mail/senha; recuperar senha; mensagens de erro em
  português.
- Sem as variáveis do Firebase, o botão "Entrar" não aparece e nada quebra.
- SDK carregado sob demanda.
- Ao logar: merge aparelho + nuvem (ver `architecture.md`). Ao sair: envia o pendente e limpa o aparelho.
- Indicador discreto: "Salvando…", "Salvo na nuvem", "Sem conexão — salvo no aparelho".
- Regras do Firestore: cada pessoa só acessa os próprios dados.

**Como funciona (`application/account.ts`):**

- O Firebase só carrega quando a pessoa toca em "Entrar", ou ao abrir o site se ela já estava logada (um
  marcador `atmavox:sessao` no `localStorage`, sem dado pessoal, lembra isso).
- Ao entrar: carrega a nuvem → `mergeProgress(aparelho, nuvem)` → grava nos dois → "Salvo na nuvem".
- Cada mudança marca "Salvando…" e sobe para a nuvem após 800 ms sem novas mudanças.
- Falhou o envio: "Sem conexão — salvo no aparelho"; tenta de novo quando a conexão volta.
- Ao sair: envia o pendente, sai, apaga o progresso deste aparelho e o marcador de sessão.

**Aceite:** escrever sem login → entrar → o texto continua lá e aparece no console do Firestore; abrir em
outro navegador com a mesma conta → mesmo progresso.

---

## F6 · Deploy 🔨

**Regras:** GitHub Actions publica no Pages a cada push na `main`, depois de `npm run check`. Pull requests
rodam só a checagem.

**Aceite:** https://atmavox.github.io abre o hub, e `#/jornada` abre a jornada.
