# Features

Cada feature tem: objetivo, regras e critérios de aceite. Status: 🔲 a fazer · 🔨 em andamento · ✅ pronta.
Ao mudar um comportamento, atualize aqui no mesmo commit.

---

## F1 · Hub (página principal) 🔲

**Objetivo:** substituir o atmavox.keepo.bio por uma página única, refinada, que leva a cada produto.

**Seções, em ordem:**

1. Hero: "ATMAVOX · PROTOCOLO DE ATIVAÇÃO", título "Saindo do Estado Cinza", subtítulo, botão
   "Ativar agora (leva 5 minutos)" que rola até o áudio.
2. O Estado Cinza: texto curto e 3 sinais em cartões.
3. Comece aqui (grátis): áudio "Retorne ao Seu Centro", com o YouTube incorporado.
4. Jornadas: Ritual Matinal (lista de espera via WhatsApp), A Chama Interna 21 dias (→ `#/jornada`),
   Sessão 1:1 (WhatsApp).
5. Sobre a Andreia (foto e texto, com placeholder até ela enviar).
6. Rodapé: redes sociais e assinatura.

**Regras:**

- Todos os links e o número de WhatsApp ficam num só arquivo, `shared/brand/links.ts`, porque a jornada
  também usa (áudio do dia 5, Protocolo Presencial). Textos do hub ficam em `features/hub/content.ts`.
- Corrigir os problemas do Keepo: TikTok quebrado e botões "Lista de Espera" sem destino.

**Aceite:** abre bem em celular de 360 px; todos os links funcionam; Lighthouse ≥ 90 em performance e
acessibilidade; funciona nos dois temas.

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

## F5 · Login opcional e sincronização 🔲

**Objetivo:** quem quiser entra e passa a ter o progresso salvo em qualquer aparelho. Quem não quiser usa
normalmente.

**Regras:**

- Firebase `atmavox-ativacao`: login com Google e com e-mail/senha; recuperar senha; mensagens de erro em
  português.
- Sem as variáveis do Firebase, o botão "Entrar" não aparece e nada quebra.
- SDK carregado sob demanda.
- Ao logar: merge aparelho + nuvem (ver `architecture.md`). Ao sair: envia o pendente e limpa o aparelho.
- Indicador discreto: "Salvando…", "Salvo na nuvem", "Sem conexão — salvo no aparelho".
- Regras do Firestore: cada pessoa só acessa os próprios dados.

**Aceite:** escrever sem login → entrar → o texto continua lá e aparece no console do Firestore; abrir em
outro navegador com a mesma conta → mesmo progresso.

---

## F6 · Deploy 🔨

**Regras:** GitHub Actions publica no Pages a cada push na `main`, depois de `npm run check`. Pull requests
rodam só a checagem.

**Aceite:** https://atmavox.github.io abre o hub, e `#/jornada` abre a jornada.
