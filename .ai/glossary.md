# Glossário

## Termos da marca

| Termo                        | Significado                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Estado Cinza**             | Estado de quem vive pedindo permissão para existir: procrastina, busca aprovação, perde energia sem razão. O ponto de partida. |
| **Chama Interna**            | A energia vital e a direção própria que a jornada "acende". O ponto de chegada.                                                |
| **Ativação**                 | O processo de sair do cinza e agir. Também nomeia o protocolo e a sessão 1:1.                                                  |
| **Ritual**                   | Prática curta do início de cada dia (respiração, gesto, escrita, aroma).                                                       |
| **Afirmação da Chama**       | Frase do dia para ancorar a mudança. A pessoa pode reescrever com as próprias palavras.                                        |
| **Check-in energético**      | Escolha de como a pessoa chega ao dia (Pesada, Ansiosa, Dispersa, Neutra, Esperançosa, Presente).                              |
| **Temperatura energética**   | Escala de fechamento do dia: 😶 Anestesiada, 🌑 Lua nova, 🌓 Crescendo, 🌕 Lua cheia, 🔥 Chama acesa.                          |
| **Revisão semanal**          | Dias 7, 14 e 21: integração do que se moveu na semana.                                                                         |
| **Vitórias / Chamas Acesas** | Registro livre de conquistas, para ancorar a nova identidade.                                                                  |
| **Protocolo Presencial**     | Sessão 1:1 com a Andreia, oferecida no encerramento da jornada.                                                                |

## As três semanas

| Semana | Dias  | Tema                      |
| ------ | ----- | ------------------------- |
| I      | 1–7   | Nomeando o Cinza          |
| II     | 8–14  | Desbloqueio Emocional     |
| III    | 15–21 | Nova Identidade e Direção |

## Termos técnicos do projeto

| Termo                | Significado                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Hub**              | A página principal (`/`), que substitui o Keepo.                                       |
| **Jornada**          | O workbook de 21 dias (`/jornada`).                                                    |
| **Progresso**        | Tudo o que a pessoa fez na jornada: dias concluídos, textos, emoções, humor, vitórias. |
| **Id de campo**      | Chave estável de cada resposta (`d3:raiz`, `r14:q2`, `enc:intencao`).                  |
| **Merge**            | A junção do progresso do aparelho com o da nuvem ao fazer login.                       |
| **Porta**            | Interface da camada de aplicação (`ProgressRepository`, `AuthService`).                |
| **Composition root** | O único lugar que escolhe as implementações das portas (`createServices`).             |
| **Evolução da aba**  | A cor da aba vai do cinza ao âmbar conforme o progresso daquela etapa.                 |
