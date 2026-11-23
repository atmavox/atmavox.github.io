# Features

Cada feature tem: objetivo, regras e critérios de aceite. Status: 🔲 a fazer · 🔨 em andamento · ✅ pronta.
Ao mudar um comportamento, atualize aqui no mesmo commit.

---

## F1 · Hub (página principal) ✅ (aguardando conteúdo da Andreía)

**Objetivo:** substituir o atmavox.keepo.bio por uma página que apresenta o universo Atmavox
(posicionamento novo: `purpose.md`) e leva a cada parte dele, pensada primeiro para o celular.

**Layout:** o mesmo conteúdo em duas estruturas (ADR-010). Desde 2026-11-22 a página inicial é a
**vitrine** aprovada (`Downloads/atmavox-pagina-inicial.html`, direção 4; ADR-021, F9):

- **Celular (< 700 px): "app com abas".** Barra fixa embaixo com Início · Jornadas · Meditações · Contato.
  - Início: retrato + slogan + "Um espaço para perceber… Com Andreía Oliveirà."; "Conhecer as jornadas";
    cartão "Comece aqui" (áudio de boas-vindas, 1 min, com música de fundo); fileiras de jornadas e de meditações (deslizar
    com o dedo, pontinhos); faixa dos encontros (TikTok); frase da marca com "Ver as jornadas";
    "Quem já viveu" (só com depoimento real); redes sociais; A Ativadora (retrato, práticas, WhatsApp).
  - Jornadas: o hub de jornadas (F9), compacto por padrão.
  - Meditações: o hub de meditações (F9) e, a partir dele, a página de cada meditação.
  - Contato: sobre a Andreía, botão do WhatsApp, redes, assinatura.
- **Tablet e computador (≥ 700 px): "revista".** Página única com menu no topo (Início, Jornadas,
  Meditações, Encontros, Sobre, Contato): topo com a pergunta, a logo falando no fundo, "Conhecer as
  jornadas" e "Ouvir uma meditação"; fileira de jornadas (setas no cabeçalho só quando sobra cartão);
  meditações em lista de duas colunas; faixa dos encontros; frase com a logo falando atrás; depoimentos;
  redes sociais; A Ativadora; rodapé com assinatura e versão.
- Cartões de jornada da vitrine **sem preço** (F9): "Conhecer" (leva ao hub, `#/jornadas`) ou, se
  "Em breve", "Quero ser avisada" (WhatsApp, até existir a lista de interesse com login).
- Rotas: `#/` (início), `#/jornadas`, `#/meditacoes` (`#/ouvir` continua valendo), `#/encontros`,
  `#/sobre`, `#/contato`. No celular trocam a aba; no computador rolam até a seção.
  **Mídia (ADR-011):**

- Áudio com **player próprio** (`<audio>` + arquivo MP3/M4A em `public/audio/`), com **mini player fino
  no topo, logo abaixo do cabeçalho fixo** (hub e jornada), que continua tocando ao trocar de aba, rolar
  ou ir para a jornada. O cartão "Comece aqui" é só áudio. "Retorne ao Seu Centro" (vídeo, 5 min) voltou para a lista de
  meditações da vitrine, como no mock aprovado em 2026-11-22. Um item de "Ouvir" sem arquivo ainda
  pode abrir o YouTube como alternativa.
- **Tratamento dos áudios** (feito no computador com ffmpeg, antes de entrar em `public/audio/`; o do
  áudio de boas-vindas foi escolhido de ouvido entre 7 versões). Em etapas separadas, porque o `arnndn` do
  ffmpeg 9.1 trava quando encadeado com outros filtros:
  1. `highpass=f=140:poles=2` (duas vezes), `adeclick`, e `afftdn` com perfil de ruído aprendido no
     silêncio do início (`asendcmd ... afftdn sn start/stop`, `nr=24`), saída em WAV 48 kHz;
  2. `arnndn` (RNNoise, modelo `sh` de GregorR/rnnoise-models, `mix=1`);
  3. `agate` nas pausas (limiar −55 dBFS), realce de presença (+3 dB em 3,5 kHz e agudos +3 dB) e
     `loudnorm=I=-16:TP=-1.5:LRA=11`; AAC 96 kbps mono.
     Resultado medido: silêncios em −121 dB e pausas 23 dB mais baixas que o original, sem perder nitidez.
- **Áudio de boas-vindas com fundo (2026-11-22):** a Andreía mandou uma gravação nova, limpa
  ("Boas Vindas - Site", 57,6 s, −35 LUFS), e uma música ("fundo"). Mixagem com ffmpeg: voz com
  `highpass=80` + `loudnorm` para −16 LUFS, entrando aos 5 s (a música só ganha corpo por volta de 4 s);
  música a −14 dB, com fade-in de 1 s, abaixando sob a voz (`sidechaincompress`, limiar 0,02, razão 4) e
  saindo em fade de 4 s depois da última frase; `alimiter` no fim (o `loudnorm` dinâmico na mistura
  subia a introdução). Resultado: 1 min 07 s, −15,9 LUFS, pico −1,9 dBTP, música 15 a 18 dB abaixo da
  voz; AAC 128 kbps estéreo.- Vídeos do YouTube como **fachada**: só a miniatura carrega; o player (`youtube-nocookie.com`) entra
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
- **Avanço em sequência (ADR-013):** a pessoa só avança quando completa a etapa anterior.
  - **Etapas do dia:** abrem uma de cada vez; cada uma tem "Feito ✦". Perguntas de escrever pedem uma
    resposta; o fechamento pede a temperatura energética ou um texto. As seguintes aparecem com cadeado.
  - **Dias pelo calendário (ADR-024):** o dia 1 abre em "Começar a jornada"; depois, um dia novo a
    cada 00h de Brasília, concluído ou não o anterior. Dias que passaram ficam abertos. Dia fechado
    mostra "Abre amanhã, à meia-noite" ou "Abre em dd/mm". A tela vira o dia sozinha.
  - **Concluir dia:** "Concluir dia ✦" só libera com todas as etapas feitas. Concluir é definitivo.
    O ✦ do cabeçalho do card e o rastreador da Abertura só **mostram** o estado.
  - **Abas, nesta ordem:** Abertura ("Começar a jornada ✦") → Semana I → II → III (cada uma abre junto
    com o primeiro dia dela) → Revisões (depois dos 21 dias concluídos; as 11 perguntas com "Feito", uma
    de cada vez) → Vitórias ("Feito ✦") → Encerramento. Aba fechada aparece com cadeado; abrir o link
    dela mostra um aviso e "Continuar em…".
  - **Abas pela estrutura (ADR-024):** por semana, como acima (com quantas semanas houver; Revisões só
    se a jornada tiver); **por tema**, uma aba por tema com o nome dele, sem dias: o tema inteiro numa
    página, com "Concluir tema ✦", que abre o tema seguinte; **por dias**, uma aba "Dias" com os cartões.
    Vitórias abrem depois da última parte. Por tema, a vitória não pede o dia do protocolo.
  - **Progresso antigo respeitado:** dia ou aba que já tinha respostas ou marcações continua aberto.
  - **Admin:** as regras aceitam `bypass` (Fase 4, modo Andreía).
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

**Regras:** **claro ("Areia") por padrão** na primeira visita, independentemente do sistema (pedido do
cliente em 2026-11-21; antes era escuro e seguia o sistema); escuro ("Sépia") como alternativa; a escolha
fica salva (`localStorage: atmavox:theme`) e vence o padrão; sem "piscar" ao carregar.
Botão sol/lua no cabeçalho, compartilhado entre hub e jornada.

**Aceite:** contraste AA nos dois temas; nenhuma cor solta no código.

**Implementação:** script inline no `index.html` (antes da pintura) + `shared/theme/theme.ts` (regra
pura, testada) + `useTheme` (o `data-theme` do `<html>` é a fonte da verdade, sem Provider) +
`ThemeToggle`. Exceção às cores soltas: o favicon e o `theme-color` do `index.html`, que não leem CSS.

---

## F5 · Login e sincronização 🔨 (código pronto; falta configurar o console: `firebase-setup.md`)

**Objetivo:** o progresso fica salvo na conta, em qualquer aparelho. Desde 2026-11-22 a **jornada pede
login** (ADR-020): sem conta, abre a janela "Entre para guardar sua jornada" sobre o hub desfocado, com
a jornada escolhida; fechar volta a `#/jornadas`. O que a pessoa já tinha feito no aparelho antes do
login é mesclado à conta. Com sessão lembrada, a jornada mostra "Carregando…" até a nuvem responder
(`authChecked`), para a janela não piscar. O login é do site todo (`shared/auth`, ADR-022): quem
entra no hub já está logado na jornada, e vice-versa.

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

---

## F8 · App na tela inicial (PWA) 🔨 (no código; falta conferir no celular depois do deploy)

**Objetivo:** quem toca em "Instalar app" / "Adicionar à tela inicial" ganha um ícone da ATMAVOX que abre
como aplicativo, **sem a barra do navegador**, nas cores do site.

**Regras:**

- `public/manifest.webmanifest`: `display: standalone`, `start_url` e `scope` em `/`, nome "ATMAVOX".
- Fundo da tela de abertura e barra do sistema na cor Areia (`#ebe2d4`, a mesma do `theme-color`). No tema
  escuro, o `useTheme` troca o `theme-color` para Sépia em tempo real, e o app instalado acompanha.
- Ícones em `public/icons/`: 192 e 512 px (logo grande), `maskable` de 512 px (logo dentro da zona segura,
  para o Android recortar em círculo, gota etc.) e `apple-touch-icon` de 180 px para o iPhone.
- Os PNGs saem de `scripts/generate-pwa-icons.ps1` (Windows), com as mesmas medidas e cores da logo. Só
  precisa rodar de novo se a logo ou as cores mudarem.
- Sem service worker por enquanto (ADR-018): o app instalado precisa de internet, como o site.

**Aceite:** no Android (Chrome), "Instalar app" cria o ícone; ao abrir, não aparece a barra de endereço e a
barra do topo fica Areia (ou Sépia no tema escuro). No iPhone (Safari → Compartilhar → "Adicionar à Tela de
Início"), o ícone aparece e abre sem a barra do Safari. Quem tinha instalado o atalho antigo precisa
removê-lo e instalar de novo.

**Ponto em aberto:** a cor da barra de botões do Android (voltar, apps abertos, início) é decidida pelo
sistema e pelo Chrome; o manifest não tem um campo só para ela. Conferir no aparelho depois do deploy.

---

## F7 · Modo Andreía (editar a jornada) ✅

**Objetivo:** a Andreía edita a jornada sozinha, com bastante liberdade, sem desenvolvedor e sem custo.
Telas fiéis ao protótipo aprovado (`Downloads/atmavox-modo-admin-v2.html`). Guia para ela:
`guia-modo-andreia.md`.

**Quem acessa:** contas com o documento `admins/{uid}` no Firestore (criado à mão; ver
`firebase-setup.md`, seção 7). A admin vê a jornada sem cadeados, uma faixa azul "Modo Andreía ·
Editar a jornada →" e o mesmo atalho no menu da conta. Qualquer outra pessoa que abrir
`#/jornada/editar` vê "Só para a admin", e as regras da nuvem recusam gravações.

**Regras:**

- **Três versões** (ADR-015): edições não salvas (no aparelho dela), rascunho salvo (`drafts/{id}`) e
  publicada (`published/{id}`, o que as participantes veem). Estado de cada dia: Rascunho (laranja),
  Salvo · falta publicar, Salvo (verde).
- **"Salvar dia"** grava o dia no rascunho; só libera sem problemas (título, textos, links `https://`,
  imagem escolhida e descrita). **"Descartar alterações"** volta ao salvo.
- **"Publicar jornada"** fica só no quadro de todos os dias, pede confirmação e só libera sem nenhum dia
  em rascunho, sem campos faltando e com algo diferente do que está no ar. Cada publicação vira uma
  versão no **Histórico** (gaveta lateral), com "Voltar para esta" (vira rascunho salvo; publica-se de
  novo para ir ao ar).
- **Estrutura** (novo dia, apagar dia, ordem dos dias, tema da semana) vai direto para o rascunho salvo.
- **Apagar dia** (no editor do dia, com confirmação): o dia sai da jornada ao publicar; cada semana
  fica com pelo menos um dia; o número do dia apagado é **aposentado** (`retiredDays`) e nunca volta a
  ser usado por um dia novo; o que as participantes escreveram nele continua guardado.
- **Ids nunca mudam:** o número do dia é a identidade das respostas (`d{n}:…`); reordenar só muda a
  posição. Blocos novos e cópias ganham ids novos. Apagar um bloco não apaga respostas já escritas.
- **Blocos:** check-in, ritual, pergunta, afirmação, fechamento (etapas, pedem "Feito"), áudio e vídeo
  por link (pedem "Feito"), imagem, citação, texto e divisor (só leitura).
- **Vídeo e áudio por link:** YouTube = miniatura que vira player; arquivo `.mp3`/`.m4a` = player do
  site; outros sites = cartão "Assistir ↗"/"Ouvir ↗" que abre o link em outra aba.
- **Imagem** (ADR-014): reduzida no navegador (WebP até 1200 px, ~200 kB), gravada em `media/{id}`;
  descrição obrigatória, legenda opcional.
- Tudo que vem da nuvem passa por `parseJourney`: bloco desconhecido, id repetido ou link que não seja
  `http(s)` faz o site usar a versão do código.

**Ainda não faz (roadmap):** editar Revisões e Encerramento, "ver como participante" com
escolha de dia/aparelho, limpar imagens que nenhum bloco usa.

**Aceite (conferido em 2026-11-21 com a conta do desenvolvedor):** editar o dia 1, salvar, publicar e ver
a mudança numa janela anônima; voltar uma versão pelo Histórico.

## F9 · Vitrine, hubs e produtos pagos 🔨 (vitrine e hub de jornadas no ar; login, meditações e pagamento a seguir)

Mocks: `Downloads/atmavox-pagina-inicial.html` (direção 4) e `Downloads/atmavox-hubs.html`. Decisões:
ADR-019 (catálogo), ADR-020 (login e acesso), ADR-021 (página inicial).

**Tag de preço** (uma regra só, em `shared/catalog`, com teste), para jornadas e meditações:

| Situação                              | Tag                     | Botão                             |
| ------------------------------------- | ----------------------- | --------------------------------- |
| `status: 'soon'`                      | "Em breve"              | "Quero ser avisada" (pede login)  |
| Vitrine (página inicial), qualquer um | nenhuma                 | "Conhecer"                        |
| Hub, sem login, paga                  | "Pago"                  | "Começar jornada" → login         |
| Hub, sem login, grátis                | nenhuma                 | "Começar jornada" → login         |
| Hub, logada, paga sem acesso          | preço com cadeado       | "Ver e começar" → janela de preço |
| Hub, logada, grátis                   | "Grátis"                | "Começar"                         |
| Logada com acesso válido              | "Sua" (filtro "Minhas") | "Continuar"                       |
| Acesso vencido                        | preço com cadeado       | "Renovar" → janela de preço       |

**Página inicial (vitrine):** topo da revista com "Conhecer as jornadas" e "Ouvir uma meditação";
jornadas em destaque (sem preço); meditações ("Pausas guiadas para voltar ao centro"); encontros (sem
horário, "um quadro recorrente, ao vivo no TikTok"); frase de efeito com a logo falando atrás;
"Quem já viveu" (carrossel); "Nas redes sociais"; A Ativadora. Linhas de cartões sem barra de rolagem:
setas no cabeçalho da seção no computador (só quando sobra cartão), deslizar com pontinhos no celular.

**Hub de jornadas (`#/jornadas`):**

- **Expandida** (padrão, a A5): cartões largos agrupados por território, com banner, duração,
  estrutura, tag, nome, frase, quadradinhos dos temas e botão.
- **Compacta** (a A4): uma linha por jornada (miniatura, nome, frase, duração, temas, tag, botão).
- Chave Expandida/Compacta; a escolha fica no aparelho.
- **Filtros** abertos por padrão numa coluna à esquerda (busca, territórios com contagem, "Mostrar":
  Todas, Disponíveis, Em breve e, logada, Grátis e Minhas; duração), recolhíveis por "Ocultar filtros"
  (a busca sobe para a barra). No celular: busca e filtros que deslizam, recolhíveis pelo botão
  "Filtros"; compacta é o padrão.

**Começar uma jornada:** sem login, o hub fica desfocado e abre a janela de login (no celular, folha que
sobe) com a jornada escolhida, Google, e-mail e senha. Depois do login: grátis começa direto; paga sem
acesso abre a janela de preço (banner, preço, o que inclui, prazo de acesso, formas de pagamento, "Pagar
e começar", "Voltar para as jornadas").

**Hub de meditações (`#/meditacoes`, variante B):** grade de capas com tipo ("Áudio", "Vídeo", "+ E-book")
e play; filtros Todas, Áudio, Vídeo, Com e-book (logada: Grátis e Minhas). Grátis tocam sem login; pagas
seguem o mesmo fluxo das jornadas, com "Pagar e ouvir". Com acesso, a meditação mostra o play e "Baixar
e-book".

**Cabeçalho dos hubs e perfil (mocks aprovados em 2026-11-23):** nos hubs, abas Início · Jornadas ·
Meditações e a conta ("Entrar" ou a bolinha com "Meu perfil" e "Sair da conta"); a página inicial fica
sem login. O perfil (`#/perfil`) tem abas Visão geral, Jornadas, Meditações e Conta, com a trilha de
cada jornada e a etiqueta do tipo de acesso ("Grátis", "Para sempre", "Até dd/mm/aaaa").

**Modo Andreía (Etapa D):** criar e editar produtos do catálogo (tipo, estrutura, grátis/paga, preço,
prazo de acesso, banner, frase, temas, território, destaque, ordem, status) e liberar acesso à mão.
