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
- [x] Barra de progresso do mini player fluida (lê a posição a cada quadro enquanto toca)
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
- [x] Lixeira em cada cartão do quadro de todos os dias, para apagar sem abrir o dia
- [ ] Jornadas novas pelo editor (ex.: Ritual Matinal — 7 dias)
- [ ] Apagar da coleção `media` as imagens que nenhum bloco usa mais (hoje ficam guardadas, sem custo)

## Regra nova da jornada: avançar só depois de completar ✅

- [x] Etapas do dia com "Feito ✦" (perguntas pedem resposta), dias em sequência (abrem na hora),
      abas em cadeia (Abertura → Semanas → Revisões → Vitórias → Encerramento) — ADR-013
- [x] Progresso antigo respeitado; `bypass` pronto para a admin (Fase 4)
- [ ] Ver no celular de verdade com a Andreía se o ritmo "uma etapa por vez" ficou bom

## Fase 5 · Versão, marca, PWA e jornadas como produto 🔨 (pedido de 2026-11-22)

Ordem aprovada; cada etapa pode virar uma versão minor quando o desenvolvedor pedir. Telas novas e logo passam por mocks com várias opções,
aprovados antes do código.

1. [x] Controle de versão: `site.json` + versão no rodapé (ADR-017) — 1.0.0
2. [x] Logo nova: "Forma de onda" (v3 · 06), escolhida após 8 rodadas de mocks em
       `Downloads/atmavox-icones.html`; aplicada no favicon, hub, capa da jornada e README
3. [x] PWA: manifest (`standalone`, ícones, cores Areia) para abrir sem a barra do navegador (F8,
       ADR-018)
   - [ ] Conferir no celular depois do deploy: sem barra de endereço, barra do topo Areia/Sépia, cor da
         barra de botões do Android; remover o atalho antigo e instalar de novo
4. [x] "Começar jornada" com mais destaque: juntou-se ao hub de jornadas e à página inicial nova
   - [x] Etapa A: mocks da página inicial (vitrine), aprovada a direção 4
         (`Downloads/atmavox-pagina-inicial.html`)
   - [x] Etapa B: mocks dos hubs (jornadas expandida A5 + compacta A4, filtros recolhíveis, tag "Pago",
         login → preço, meditações B com e-book), aprovados (`Downloads/atmavox-hubs.html`)
   - [x] Etapa C: modelo e decisões: catálogo (ADR-019), login e acesso (ADR-020), vitrine (ADR-021),
         `purpose.md`, F9 em `features.md`, modelo em `architecture.md`
5. [ ] Etapa D, um commit por passo:
   1. [x] `shared/catalog`: tipos, `parseCatalog`, regra da tag de preço, com testes; catálogo inicial
          com a jornada de 21 dias (grátis até a Andreía definir preço e prazo) e o Ritual Matinal (em
          breve)
   2. [x] Página inicial vitrine (F9), encontros apontando para o TikTok; abas do celular Início ·
          Jornadas · Meditações · Contato; "Quem já viveu" só aparece com depoimento real
   3. [x] Hub de jornadas (`#/jornadas`): expandida/compacta (lembrada no aparelho), filtros recolhíveis
          (busca sem acento, território, disponível/em breve, duração), tag "Pago"; "Conhecer" da vitrine
          leva ao hub; "Começar jornada" ainda abre a de 21 dias direto (login no passo 4)
   4. [x] Login obrigatório na jornada (ADR-020): janela "Entre para guardar sua jornada" sobre o hub
          desfocado, com a jornada escolhida; fechar volta ao hub; sessão lembrada espera a nuvem
          ("Carregando…") antes de pedir login; rotas `#/jornada/{id}/{aba}` (links antigos sem id abrem
          a de 21 dias; id desconhecido mostra "ainda não está disponível")
   5. [x] Hub de meditações (`#/meditacoes`, variante B): grade de capas com tipo ("+ E-book" quando
          houver), play e tag; filtros Todas/Áudio/Vídeo/Com e-book (só os que mostram algo); página
          da meditação (`#/meditacao/{id}`) com o áudio no player do site ou o vídeo; meditações
          grátis no catálogo (Boas-vindas, Retorne ao Seu Centro). Na página inicial, o vídeo abre na
          largura toda da seção. **Pagas** (login → preço → acesso, "Baixar e-book") ficam para o passo 6,
          junto com o acesso: o login precisa sair da jornada para `shared/` (o hub também vai usar)
   6. [x] Login compartilhado (ADR-022): sessão em `shared/auth`, a jornada sincroniza por cima; no hub,
          depois do login, "Grátis" e preço com cadeado; filtro "Grátis"; produto pago sem login abre o
          login com o produto e depois a janela de preço (mock F·2), com o botão de pagar desativado até
          o Mercado Pago
   7. [x] Acesso: regras do Firestore (catálogo, `published` só com acesso, `access` gravado só pelo
          servidor ou pela admin), conteúdo pago lido com o token, "Sua"/"Minhas", "Baixar e-book";
          conteúdo pago fora do código do site
   8. [x] Mercado Pago (Checkout Pro) + Worker gratuito na Cloudflare (ADR-023): cobrança com o preço do
          catálogo, webhook com assinatura conferida, acesso gravado pelo servidor; página de retorno;
          guia das contas em `pagamentos.md`
      - [ ] **Pendência do desenvolvedor (com a Andreía):** configurar as contas e publicar o Worker
            (`pagamentos.md`, passos 1 a 5) e fazer a compra de teste (passo 6) antes de abrir as vendas.
            Até lá o botão mostra "Pagamento em breve" e nada quebra
      - [x] **Pendência do desenvolvedor (feito em 2026-11-23):** publicar as regras novas do Firestore no console
            (`firebase-setup.md`, seções 8 e 9); sem elas, o acesso pago e a tela Acessos não funcionam (o resto segue normal)
            8b. [x] Login nos hubs com abas Início · Jornadas · Meditações (mock aprovado, opção 3) e página de
            perfil (`#/perfil`): abas, trilha de progresso, tipo de acesso
   9. [~] Modo Andreía de produtos (mock aprovado): [x] lista + editor + prévia (computador) e passo a
      passo com "Revisar" (celular), catálogo no Firestore; [x] tela de Acessos (liberar à mão por
      e-mail, revogar); [x] imagem do banner; [x] dias de uma jornada nova (hoje o editor de dias só
      conhece a de 21 dias: uma jornada nova deve ficar "Em breve" até isso existir). A estrutura define
      quando cada parte abre (2026-11-23):
      1. [x] dias liberados pelo calendário, um por 00h de Brasília (ADR-024), na Chama Interna também
      2. [x] caderno montado pela estrutura (abas por semana, por tema ou "Dias"; "por tema" libera o
             próximo tema ao concluir o anterior; Revisões só em "por semana")
      3. [x] editor de dias para jornada nova, com os N dias vazios prontos
      4. [x] "Publicada" só com dias publicados (Modo Andreía de produtos)
      5. Estrutura dinâmica (pedido de 2026-11-23, mock `Downloads/atmavox-estrutura-produto-v2.html`,
         ADR-025):
         1. [x] Jornada em partes + cartões do banner com os 3 primeiros dias com título + títulos dos
                dias no rascunho da jornada (1.18.0)
         2. [x] Formulário e tela "Estrutura": por dias (sem divisão, em semanas, em partes) ou por
                temas, duração em número, trilha com ordem automática, títulos dos dias, trava quando a
                jornada já tem conteúdo
         3. [x] Arrastar para ordenar compartilhado (puxador no computador, segurar no celular,
                teclado), também no quadro de dias do editor
         4. [x] Ajustes pedidos no caminho: cabeçalho único do Modo Andreía, apagar produto não
                publicado, dia 22 abre a Semana IV, "Novo dia" sem abrir a edição, transições suaves
         - [x] Campos editáveis mais evidentes: faixa azul (opção D) + lápis (opção B) do mock
               `Downloads/atmavox-campos-editaveis.html`
         - [ ] Conferir no celular de verdade o "segurar e arrastar" (Android e iPhone)
         - [ ] Depois da trava, títulos mudados no editor da jornada não atualizam os cartões do
               banner sozinhos (ADR-025); avaliar atualizar o `previewDays` ao publicar a jornada
      - [ ] **Ícones no lugar dos emojis** (regra nova em `conventions.md`, mock
            `Downloads/atmavox-icones-emoji.html`): temperatura do dia opção B (luas + chama) e botão
            de tema opção 1 (sol de raios + lua crescente)
      - [ ] **Pendência (2026-11-23): envio de áudio das meditações.** Hoje o editor pede o link de um
            arquivo já hospedado. Opções: Cloudflare R2 pelo Worker do pagamento (recomendado: grátis até
            10 GB, sem custo de download, áudio pago só entregue a quem tem acesso; exige cartão na
            Cloudflare), Worker gravando no GitHub (sem cartão, mas o arquivo fica público no repositório) ou
            manter o link. Firebase Storage exige plano pago; Firestore tem limite de 1 MB. Decidir com a
            Andreía junto com o Mercado Pago.
      - [ ] Ideia: temas adicionados ao produto depois do primeiro rascunho não entram sozinhos na
            jornada (o esqueleto só vale até o primeiro "Salvar"); criar um "+ Novo tema" no editor.
      - Antes: criar e editar produtos (estrutura, grátis/paga, preço, prazo, banner, frase,
        temas, território, destaque) e liberar acesso à mão
6. [x] Pagamento por produto: decidido Mercado Pago (Checkout Pro) + Worker gratuito (2026-11-22),
       implementação no passo 5.8

Surgiu no caminho:

- [ ] Avaliar com a cliente a paleta do briefing de marca 10/2026 (Sombra/Estado Cinza/Luz/Pérola, v8 em
      `Downloads/atmavox-icones.html`); por enquanto ela manteve Areia/Sépia
- [ ] Alinhar os nomes dos produtos ao briefing antes do hub de jornadas: lá "Saindo do Estado Cinza"
      (jornada em áudio) e "A Chama Interna" (21 dias, futura) são produtos diferentes; o briefing também
      pede não anunciar como disponível o que não está pronto
- [ ] Receber da Andreía: preço e prazo de acesso de cada produto, depoimentos reais, frases de efeito,
      e quais meditações terão e-book
- [x] E-book (2026-11-22): um link para baixar o documento (ex.: Google Drive), guardado só no
      `published` da meditação; quem tem acesso vê o botão "Baixar e-book" (ADR-020)
- [x] Histórico do git (2026-11-22): fica como está; o desenvolvedor considerou que ninguém vai procurar
      o conteúdo lá (ADR-020)

- [ ] **Última publicação das redes na página inicial** (pedido de 2026-11-22): card em "Nas redes
      sociais". Sem custo e sem segredo no navegador: um job agendado do GitHub Actions busca a última
      publicação e gera um JSON estático no deploy. YouTube por RSS (público, sem chave); Instagram pela
      Graph API (exige conta profissional, app na Meta e token guardado nos segredos do Actions, renovado
      a cada 60 dias); TikTok não tem "última publicação" sem app aprovado. Precisa de mock antes. - [ ] **Pendência (2026-11-23):** trocar o Facebook pelo **Spotify** como foco dos posts recentes
      (último episódio). A conta ainda não existe. Se for podcast publicado pelo Spotify for
      Creators, o feed RSS é público e entra no mesmo job do Actions, sem chave; a API do Spotify
      exigiria app e segredo nos segredos do Actions.

## Depois

- [ ] Validar textos e experiência com a Andreia e com 2 ou 3 pessoas reais
- [ ] Exportar "meu diário dos 21 dias" em PDF
- [ ] PWA offline (service worker; instalar já funciona desde a Fase 5, ADR-018)
- [ ] Lembrete diário
- [ ] Política de privacidade (o site guarda reflexões pessoais)
- [ ] Jornada "Ritual Matinal — 7 dias" reaproveitando a mesma base
- [ ] (Opcional, se um dia quiser pagar) domínio `atmavox.com.br`, cerca de R$ 40/ano no Registro.br
