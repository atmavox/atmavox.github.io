# Roadmap

Ordem sugerida. Cada etapa termina com `npm run check` passando e um commit.

## Fase 0 · Base ✅

- [x] Projeto Vite + React + TS criado no repositório `atmavox/atmavox.github.io`
- [x] `CLAUDE.md` e `.ai/` no repositório
- [x] Tailwind v4, ESLint (+ jsx-a11y), Prettier, Vitest, script `check`
- [x] Estrutura de pastas `app/`, `features/hub`, `shared/` (`features/jornada` nasce na Fase 1)
- [x] Workflow de deploy no GitHub Pages (`.github/workflows/deploy.yml`)
- [x] Ativar o Pages: _Settings → Pages → Source → GitHub Actions_ (feito manualmente no GitHub)

## Fase 1 · Tema e jornada (sem login) ✅

- [x] Tokens e tema claro/escuro (F4)
- [x] Domínio da jornada: tipos, progresso, merge, validação, com testes
- [x] Conteúdo dos 21 dias migrado, com os erros do original corrigidos (F2)
- [x] Telas da jornada salvando no `localStorage`
- [x] Abas com evolução (F3)
- [x] Cabeçalho da jornada no computador (abas cortadas) e página "arrastando" para o lado no celular
- [ ] Revisão visual no celular e validação dos textos com a Andreia (pendências em `features.md`, F2)

## Fase 2 · Hub 🔨 (código pronto; falta conteúdo e revisão visual)

- [x] Reposicionamento registrado (slogan, tom, assinatura, grafia "Andreía Oliveirà")
- [x] Slogan, assinatura e grafia do nome aplicados no site e na jornada
- [x] Player de áudio próprio + mini player + vídeos com fachada (ADR-011)
- [x] Hub: abas no celular, revista no computador (F1, ADR-010)
- [x] Paleta nova: escuro "Sépia" + claro "Areia" (o claro anterior ofuscava)
- [x] Áudio de boas-vindas (48 s) no player do site; vídeos saíram da tela inicial
- [x] Logo "Anéis nítidos": transparente, traço grosso, favicon que se adapta ao tema
- [x] Mini player fino no topo, abaixo do cabeçalho; fecha sozinho quando o áudio termina
- [x] Logo não fica mais por trás do cartão "Comece aqui" no computador
- [x] README no estilo do Tabi
- [x] Retrato da Andreía (foto do Keepo) no início do hub e na seção "Sobre"
- [x] Tema claro como padrão na primeira visita
- [x] Limpar o ruído do áudio de boas-vindas (versão 6 "só voz": silêncios totais, voz nítida; receita
      em `features.md`, F1 → Mídia)
- [ ] Revisar o hub no celular e no computador de verdade (visual) e ajustar
- [ ] Receber da Andreía: horários dos encontros, título do áudio de boas-vindas, texto curto, links
      de Threads/Telegram (TikTok @atmavox ✅, áudio de boas-vindas ✅, foto ✅)
- [ ] Trocar o link da bio do Instagram para atmavox.github.io

## Fase 3 · Login opcional 🔨 (no ar; falta conferir o login de ponta a ponta)

- [x] Sincronização aparelho + nuvem (merge, envio com pausa, limpeza ao sair)
- [x] Firebase sob demanda (Auth + Firestore lite), regras em `firestore.rules`, variáveis no deploy
- [x] Tela de login, status de sincronização e "Sair da conta" (F5)
- [x] Configurar o Firebase `atmavox-b72a4` e as variáveis do GitHub (`.ai/firebase-setup.md`)
- [ ] Andreía trocar o e-mail de suporte do login do Google para o dela (logada na conta dela)
- [ ] Conferir o aceite da F5 no site publicado (passo a passo no fim do guia)

## Fase 4 · Modo Andreía (admin) 🔨 · em construção

Plano (2026-11-21), um commit por passo:

1. [x] Domínio: id fixo por bloco (`withSectionIds`), blocos novos (texto, citação, divisor, imagem,
       vídeo, áudio; os só de leitura não pedem "Feito"), sequência dos dias pela ordem na jornada (o
       número do dia é a identidade das respostas) e `parseJourney` para conteúdo vindo da nuvem
2. [x] Conteúdo publicado na nuvem (`published/{journeyId}`, campo `content` com o JSON), lido por
       `fetch` na API REST sem carregar o Firebase; cópia no aparelho; versão do código se a nuvem
       falhar ou o conteúdo vier quebrado
   - [ ] **Desenvolvedor:** colar o `firestore.rules` novo no console (Firestore → Regras → Publicar).
         Até lá a leitura dá "permissão negada" e o site segue com a versão do código (sem erro visível)
3. [x] Papel de admin (`admins/{uid}`, regras com `isAdmin()`), aviso "Modo Andreía" no menu da conta,
       jornada sem cadeados para a admin (o link para a tela de edição entra no passo 4)
   - [x] Regras novas publicadas e `admins/{uid}` do desenvolvedor criado (2026-11-21), para testar
   - [ ] `admins/{uid}` da Andreía: quando ela puder entrar (o Google pediu verificação pelo celular).
         Alternativa: criar a conta dela por e-mail e senha no console (`firebase-setup.md`, seção 7)
4. [x] Tela de admin em `#/jornada/editar` (ADR-015): visão geral por semana com o estado de cada dia
       (Rascunho / Salvo · falta publicar / No ar), tema da semana, novo dia, subir/descer dias; editor
       do dia no lugar (título, subtítulo, blocos com subir/descer/duplicar/remover, "+ bloco" com
       ícones), "Salvar dia" e "Descartar", "Publicar jornada" só sem rascunhos, histórico com "Voltar
       para esta versão"; edições não salvas ficam no aparelho
   - [ ] Conferir no site publicado com a conta admin (salvar, publicar, ver como participante)
   - [ ] Depois: editar revisões e encerramento; remover dia; "ver como participante" (item abaixo)
5. [ ] Tela da participante mostra os blocos novos
6. [ ] Envio de imagem (WebP no Firestore)
7. [ ] Documentação, regras e guia para cadastrar a Andreía como admin

Detalhes e decisões:

Um login especial que libera para a Andreía **ver a jornada como participante** e **editar as jornadas com
bastante liberdade**. Protótipos: `Downloads/atmavox-modo-admin.html` (5 formas) e
`Downloads/atmavox-modo-admin-v2.html` (a escolhida).

- [x] Forma de editar escolhida (2026-11-21): **quadro dos dias por semana (D)** como visão geral +
      **editar no lugar (A)** dentro de cada dia
- [x] Regras decididas:
  - cada dia tem **"Salvar dia"** (sai de rascunho) e "Descartar alterações"; editar de novo volta a rascunho
  - **"Publicar jornada" fica só na visão de todos os dias** e só libera quando **nenhum dia está em
    rascunho** ("Faltam N dias…")
  - menu "+ bloco" com **ícones próprios** (nada de emoji)
  - **vídeo é só um link** (YouTube com miniatura; outros sites viram cartão "Assistir ↗"): nada de upload
- [ ] Ver como participante (E) a partir da visão geral
- [ ] Papel de admin sem custo: documento `admins/{uid}` no Firestore, criado à mão no console, e regras
      que só deixam admin gravar o conteúdo (custom claims exigiriam Cloud Functions, plano pago)
- [ ] Conteúdo sai do código para o Firestore (`journeys/{id}` com dias e seções), com o conteúdo atual como
      versão inicial; o site continua funcionando se a nuvem falhar (cópia no build)
- [ ] Rascunho × publicado, histórico de versões e "voltar para esta versão"
- [ ] Ids de campo nunca mudam: blocos novos ganham id novo; apagar um bloco esconde, mas preserva as
      respostas já escritas (regra 4 do CLAUDE.md)
- [ ] Blocos livres: ritual, pergunta, afirmação, fechamento, check-in, texto, citação, divisor, áudio,
      vídeo (YouTube), imagem; reordenar, duplicar, criar dias, semanas e jornadas novas (ex.: Ritual Matinal)
- [ ] "Ver como participante": celular/PC, claro/escuro, "estou no dia N", rascunho ou publicada, sem gravar
      progresso de ninguém
- [x] Onde guardar mídia, sem custo (ADR-014):
  - **imagens no próprio Firestore**: a tela de admin reduz no navegador para WebP (~100–200 kB, limite
    de 1 MB por documento) e grava numa coleção de mídia; sem serviço novo nem cartão
  - **vídeo**: só link (YouTube com miniatura; outros sites viram cartão "Assistir ↗")
  - **áudio**: link (Drive, SoundCloud, YouTube) ou arquivo incluído pelo desenvolvedor (com o tratamento
    de ruído documentado em `features.md`)
- [ ] Implementar o envio de imagem (redução para WebP, coleção `media`, regras só para admin)

## Regra nova da jornada: avançar só depois de completar ✅

- [x] Etapas do dia com "Feito ✦" (perguntas pedem resposta), dias em sequência (abrem na hora),
      abas em cadeia (Abertura → Semanas → Revisões → Vitórias → Encerramento) — ADR-013
- [x] Progresso antigo respeitado; `bypass` pronto para a admin (Fase 4)
- [ ] Ver no celular de verdade com a Andreía se o ritmo "uma etapa por vez" ficou bom

## Depois

- [ ] Validar textos e experiência com a Andreia e com 2 ou 3 pessoas reais
- [ ] Exportar "meu diário dos 21 dias" em PDF
- [ ] PWA: instalar na tela inicial e usar offline
- [ ] Lembrete diário
- [ ] Política de privacidade (o site guarda reflexões pessoais)
- [ ] Jornada "Ritual Matinal — 7 dias" reaproveitando a mesma base
- [ ] (Opcional, se um dia quiser pagar) domínio `atmavox.com.br`, cerca de R$ 40/ano no Registro.br
