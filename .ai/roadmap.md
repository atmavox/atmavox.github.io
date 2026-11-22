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
- [ ] Revisão visual no celular e validação dos textos com a Andreia (pendências em `features.md`, F2)

## Fase 2 · Hub 🔨 (código pronto; falta conteúdo e revisão visual)

- [x] Reposicionamento registrado (slogan, tom, assinatura, grafia "Andreía Oliveirà")
- [x] Slogan, assinatura e grafia do nome aplicados no site e na jornada
- [x] Player de áudio próprio + mini player + vídeos com fachada (ADR-011)
- [x] Hub: abas no celular, revista no computador (F1, ADR-010)
- [ ] Revisar o hub no celular e no computador de verdade (visual) e ajustar
- [ ] Receber da Andreía: horários dos encontros, MP3, foto, texto curto, links de Threads/Telegram (TikTok: @atmavox ✅)
- [ ] Trocar o link da bio do Instagram para atmavox.github.io

## Fase 3 · Login opcional 🔨 (código pronto; falta o console)

- [x] Sincronização aparelho + nuvem (merge, envio com pausa, limpeza ao sair)
- [x] Firebase sob demanda (Auth + Firestore lite), regras em `firestore.rules`, variáveis no deploy
- [x] Tela de login, status de sincronização e "Sair da conta" (F5)
- [ ] Configurar o Firebase `atmavox-ativacao` e as variáveis do GitHub (`.ai/firebase-setup.md`)
- [ ] Conferir o aceite da F5 no site publicado (passo a passo no fim do guia)

## Depois

- [ ] Validar textos e experiência com a Andreia e com 2 ou 3 pessoas reais
- [ ] Exportar "meu diário dos 21 dias" em PDF
- [ ] PWA: instalar na tela inicial e usar offline
- [ ] Lembrete diário
- [ ] Política de privacidade (o site guarda reflexões pessoais)
- [ ] Jornada "Ritual Matinal — 7 dias" reaproveitando a mesma base
- [ ] (Opcional, se um dia quiser pagar) domínio `atmavox.com.br`, cerca de R$ 40/ano no Registro.br
