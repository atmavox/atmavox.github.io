# Redes sociais na página inicial

A seção "Nas redes sociais" mostra a última publicação de cada rede (ADR-028). Quem busca é o
`scripts/fetch-social.ts`, no deploy do GitHub Actions (a cada push e a cada 6 horas). Ele grava
`public/social.json` e as capas em `public/social/`; o site só lê esse arquivo. Nada disso custa nada
e nenhuma chave vai para o site.

Rede que não estiver configurada (ou falhar) simplesmente não aparece. Sem nenhuma, ficam só os ícones.

Tudo abaixo fica em **GitHub → repositório `atmavox.github.io` → Settings → Secrets and variables →
Actions**. Depois de mudar, rode o workflow "Checar e publicar" à mão (aba Actions → Run workflow) ou
espere a próxima execução (até 6 horas).

## YouTube (já funciona)

Lido pelo feed público do canal `@atmavox` (id `UCHASefs-qyG_f-hK-qr7Bcg`), sem chave. Nada a fazer.

## TikTok (vídeo escolhido)

O TikTok não deixa ler o "último vídeo" nem o fixado no perfil sem um app aprovado. Então a Andreía
escolhe um vídeo e o site busca a capa e o título pelo serviço público de incorporação (oEmbed).

1. No TikTok, abra o vídeo → Compartilhar → Copiar link (ex.: `https://www.tiktok.com/@atmavox/video/…`).
2. Em **Variables**, crie (ou edite) `SOCIAL_TIKTOK_URL` com esse link.

O cartão aparece com "Em destaque". Para trocar o vídeo, é só trocar o link.

## Spotify (quando o podcast existir)

1. No Spotify for Creators, em Configurações → Distribuição, copie o **link do feed RSS**.
2. Em **Variables**, crie `SOCIAL_SPOTIFY_RSS` com esse link.

## Instagram (configuração única, depois renovar a chave)

O Instagram só entrega publicações pela API oficial da Meta. Passos (feitos uma vez, com a conta da
Andreía):

1. **Conta profissional:** no app do Instagram, Configurações → Tipo de conta e ferramentas → Mudar
   para conta profissional (Criador de conteúdo ou Empresa). Não custa nada.
2. **App na Meta:** em <https://developers.facebook.com/apps>, Criar app → tipo **Empresa**. Dentro do
   app, adicione o produto **Instagram** → "Configuração da API com login do Instagram".
3. **Gerar a chave:** em "Gerar tokens de acesso", adicione a conta `@atmavox`, entre com ela e copie
   o token (é de longa duração: vale 60 dias).
4. **Guardar no GitHub:** em **Secrets** (não Variables), crie `INSTAGRAM_TOKEN` com o token.

**Renovar a cada 60 dias:** antes de vencer, abra no navegador (trocando `TOKEN` pela chave atual)
`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TOKEN`,
copie o `access_token` novo da resposta e troque o secret. Se vencer, o cartão do Instagram some e o
resto continua normal. (Dá para automatizar a renovação depois, com um workflow que atualiza o secret.)
