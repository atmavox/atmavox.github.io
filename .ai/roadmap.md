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
- [x] Retrato em alta definição: ampliado por IA (Real-ESRGAN + mistura com o original), 600/1200/1800 px
- [x] Tema claro como padrão na primeira visita
- [x] Limpar o ruído do áudio de boas-vindas (versão 6 "só voz": silêncios totais, voz nítida; receita
      em `features.md`, F1 → Mídia)
- [x] Controle de volume no mini player (barra fina + silenciar; lembra a escolha; some no iPhone/iPad)
- [x] Áudio da página inicial não vai mais junto para a jornada (ADR-016)
- [ ] Barra de progresso do mini player anda aos saltos (parece travada): deixar o movimento fluido
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

## Fase 4 · Modo Andreía (admin) ✅

Spec em `features.md` (F7), decisões em ADR-013/014/015, guia para ela em `guia-modo-andreia.md`.
Telas fiéis ao protótipo aprovado (`Downloads/atmavox-modo-admin-v2.html`).

Feito (2026-11-21/22), um commit por passo:

1. [x] Domínio: id fixo por bloco, blocos novos, sequência dos dias pela ordem na jornada (o número do
       dia é a identidade das respostas), `parseJourney` para conteúdo vindo da nuvem
2. [x] Conteúdo publicado em `published/{id}`, lido por REST sem o SDK; cópia no aparelho; versão do
       código se a nuvem falhar
3. [x] Papel de admin por `admins/{uid}` (sem custo; custom claims exigiriam plano pago); faixa azul e
       jornada sem cadeados para a admin; regras publicadas no console
4. [x] Editor em `#/jornada/editar`: quadro de cartões (arrastar para ordenar, novo dia, tema da semana),
       dia editável no lugar, "+" entre blocos com ícones próprios, "Salvar dia"/"Descartar", "Publicar"
       com confirmação e só sem rascunhos, histórico com "Voltar para esta"; conferido no site
5. [x] Participantes veem texto, citação, divisor, vídeo e áudio por link (YouTube = miniatura; arquivo
       de áudio = player do site; outros sites = cartão que abre o link)
6. [x] Imagem: reduzida no navegador (WebP até 1200 px) e gravada em `media/{id}`; descrição obrigatória
7. [x] Documentação: F7, arquitetura (coleções e regras), guia da Andreía, `firebase-setup.md` seção 7

Pendências:

- [x] **Andreía como admin** (2026-11-22): `admins/{uid}` dela criado
- [ ] Passar o `guia-modo-andreia.md` para ela e acompanhar a primeira edição
- [ ] "Ver como participante" completo: escolher celular/PC, claro/escuro, "estou no dia N", ver o
      rascunho antes de publicar (hoje o botão abre a jornada publicada, sem cadeados)
- [ ] Editar Revisões e Encerramento no Modo Andreía
- [x] Apagar dia (2026-11-22): com confirmação; número aposentado; semana nunca fica vazia
- [ ] Jornadas novas pelo editor (ex.: Ritual Matinal — 7 dias)
- [ ] Apagar da coleção `media` as imagens que nenhum bloco usa mais (hoje ficam guardadas, sem custo)

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
