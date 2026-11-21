// Conteúdo da Andreía Oliveirà, migrado de .ai/reference/workbook-original.html.
// Não reescreva os textos: corrija só erros evidentes de digitação (regra 3 do CLAUDE.md).
// Marcação aceita: *itálico*, **negrito**, [texto](https://link ou #/rota).
import { brandLinks } from '../../../shared/brand/links'
import type { DaySection, Journey, JourneyDay } from '../domain/journey'

const affirmation = (
  day: number,
  text: string,
  { label = 'Afirmação da Chama', hint }: { label?: string; hint?: string } = {},
): DaySection => ({
  type: 'affirmation',
  fieldId: `d${day}:afirmacao`,
  label,
  text,
  ...(hint ? { hint } : {}),
})

const closing = (
  day: number,
  label: 'Fechamento do dia' | 'Fechamento',
  extra: { question?: string; moodHint?: string; placeholder?: string } = {},
): DaySection => ({
  type: 'closing',
  fieldId: `d${day}:fechamento`,
  label,
  placeholder: extra.placeholder ?? 'O que se moveu hoje?',
  ...(extra.question ? { question: extra.question } : {}),
  ...(extra.moodHint ? { moodHint: extra.moodHint } : {}),
})

/** Dias 8 a 21 seguem o formato padrão: ritual → reflexão → afirmação → fechamento. */
const standardDay = (
  number: number,
  title: string,
  subtitle: string,
  ritual: string,
  affirmationText: string,
): JourneyDay => ({
  number,
  title,
  subtitle,
  isReview: number % 7 === 0,
  sections: [
    { type: 'ritual', label: 'Ritual', text: ritual },
    {
      type: 'prompt',
      fieldId: `d${number}:reflexao`,
      label: 'Reflexão do dia',
      placeholder: 'Escreva com presença — sem censura...',
      editable: true,
    },
    affirmation(number, affirmationText),
    closing(number, 'Fechamento'),
  ],
})

const week1: JourneyDay[] = [
  {
    number: 1,
    title: 'O Estado que você não consegue nomear',
    subtitle: 'Reconhecimento · Diagnóstico inicial',
    isReview: false,
    sections: [
      { type: 'checkin' },
      {
        type: 'ritual',
        label: 'Ritual de abertura',
        text: 'Inspire pelo nariz contando 4 tempos. Segure por 4. Expire pela boca em 6. Repita 3 vezes. Ao final, coloque a mão esquerda no peito e diga em voz alta: *"Estou aqui. Estou me ouvindo."*',
      },
      {
        type: 'prompt',
        fieldId: 'd1:reflexao',
        label: 'Reflexão do dia',
        question: 'Como o Estado Cinza aparece na minha vida hoje?',
        placeholder: 'Escreva sem censura. Este espaço é só seu...',
        editable: true,
      },
      affirmation(1, 'Eu reconheço o cinza — e já é um ato de presença.', {
        hint: '[Reescreva com suas palavras se precisar — o que importa é que ressoe no corpo]',
      }),
      closing(1, 'Fechamento do dia', {
        question: 'Como me sinto agora?',
        moodHint: '[registre sua temperatura energética]',
        placeholder: 'Uma palavra ou frase sobre o que se moveu hoje...',
      }),
    ],
  },
  {
    number: 2,
    title: 'Os sintomas que você ignora',
    subtitle: 'Consciência corporal · Escuta interna',
    isReview: false,
    sections: [
      { type: 'checkin' },
      {
        type: 'ritual',
        label: 'Ritual de abertura',
        text: 'Feche os olhos. Varra mentalmente seu corpo da cabeça aos pés. Onde sente tensão? Onde sente vazio? Não julgue — apenas observe. Este é seu diagnóstico energético diário.',
      },
      {
        type: 'prompt',
        fieldId: 'd2:sinais',
        label: 'Os 5 sinais do Estado Cinza em mim',
        question: 'Liste os que aparecem na sua vida — sem filtro.',
        placeholder:
          'Ex: Procrastino decisões que já sei que preciso tomar. Busco aprovação antes de agir. Minha energia desaparece sem razão...',
        editable: true,
      },
      affirmation(2, 'Ver o padrão é o primeiro ato de quem está saindo do cinza.'),
      closing(2, 'Fechamento do dia'),
    ],
  },
  {
    number: 3,
    title: 'A raiz da validação',
    subtitle: 'Origem do padrão · Desbloqueio de crença',
    isReview: false,
    sections: [
      {
        type: 'ritual',
        label: 'Ritual de abertura',
        text: 'Pegue um copo de água. Antes de beber, segure nas mãos e intencione: *"Que essa água dissolva o que não me pertence mais."* Beba devagar, sentindo.',
      },
      {
        type: 'prompt',
        fieldId: 'd3:raiz',
        label: 'Investigação da raiz',
        question: 'Quando aprendi que precisava de aprovação para existir?',
        placeholder:
          'Não há resposta certa. Escreva o que vier — memórias, sensações, situações...',
        editable: true,
      },
      {
        type: 'prompt',
        fieldId: 'd3:crenca',
        label: 'Crença para dissolver hoje',
        placeholder: '[escreva a crença: "Eu preciso de permissão para..."]',
        size: 'short',
      },
      affirmation(3, 'Minha expansão não precisa de aprovação — só de ativação.'),
      closing(3, 'Fechamento do dia'),
    ],
  },
  {
    number: 4,
    title: 'Procrastinação energética',
    subtitle: 'Ação do corpo · Desbloqueio de movimento',
    isReview: false,
    sections: [
      {
        type: 'ritual',
        label: 'Ritual',
        text: 'Levante-se. Chacoalhe os braços e as mãos por 30 segundos — deixe o corpo soltar o que está travado. O movimento físico precede o movimento energético.',
      },
      {
        type: 'prompt',
        fieldId: 'd4:procrastinando',
        label: 'O que estou procrastinando?',
        placeholder: 'Liste até 3 coisas que sabe que precisa fazer mas está adiando...',
      },
      {
        type: 'prompt',
        fieldId: 'd4:motivo',
        label: 'Por que estou adiando? (sem julgamento)',
        placeholder: 'O que é o medo por trás da procrastinação?',
      },
      affirmation(4, 'Agir é o ato espiritual mais poderoso que posso praticar hoje.'),
      closing(4, 'Fechamento'),
    ],
  },
  {
    number: 5,
    title: 'A voz que te encolhe',
    subtitle: 'Crítica interna · Re-programação',
    isReview: false,
    sections: [
      {
        type: 'ritual',
        label: 'Ritual',
        text: `Ouça por 5 minutos o áudio gratuito [*Retorne ao Seu Centro*](${brandLinks.freeAudio}) antes de começar. Se não tiver acesso, respire em coerência cardíaca: inspire 5s, expire 5s, por 3 minutos.`,
      },
      {
        type: 'prompt',
        fieldId: 'd5:voz',
        label: 'O que a voz interna diz que não posso?',
        placeholder: 'Escreva as frases que sua crítica interna usa com mais frequência...',
      },
      {
        type: 'prompt',
        fieldId: 'd5:reescrita',
        label: 'Reescrita — o que a Chama Interna responde a isso?',
        placeholder: 'Para cada frase acima, escreva a versão ativada...',
      },
      affirmation(5, 'Não sou a voz do cinza. Sou a chama que a dissolve.'),
      closing(5, 'Fechamento'),
    ],
  },
  {
    number: 6,
    title: 'Minha energia vital hoje',
    subtitle: 'Mapeamento energético · Radiestesia interna',
    isReview: false,
    sections: [
      {
        type: 'ritual',
        label: 'Ritual',
        text: 'Esfregue as mãos uma na outra por 20 segundos até sentir calor. Separe as palmas devagar e sinta o campo energético entre elas. Essa é sua Chama Interna — ela nunca apagou.',
      },
      {
        type: 'prompt',
        fieldId: 'd6:mapa',
        label: 'Mapeamento: onde está minha energia hoje?',
        placeholder: 'Sinto energia para: | Sinto bloqueio em: | Meu corpo pede: ...',
      },
      {
        type: 'prompt',
        fieldId: 'd6:microacao',
        label: 'Uma micro-ação que posso fazer HOJE para honrar minha energia',
        placeholder: 'Pequena, executável, sem pressão...',
        size: 'short',
      },
      affirmation(6, 'Minha energia vital é a bússola mais confiável que tenho.'),
      closing(6, 'Fechamento'),
    ],
  },
  {
    number: 7,
    title: 'Revisão da Semana I',
    subtitle: 'Integração · Consolidação · Presença',
    isReview: true,
    sections: [
      {
        type: 'ritual',
        label: 'Ritual de integração semanal',
        text: 'Reserve 30 minutos. Acenda uma vela ou difusor se possível. Releia suas anotações dos 6 dias anteriores antes de responder. Leia com presença — não com julgamento.',
      },
      {
        type: 'prompt',
        fieldId: 'd7:aprendi',
        label: 'O que aprendi sobre meu Estado Cinza esta semana?',
        placeholder: 'Padrões que reconheci, crenças que vi, comportamentos que nomeei...',
      },
      {
        type: 'prompt',
        fieldId: 'd7:desafio',
        label: 'Qual foi meu maior desafio? O que ele me ensinou?',
        placeholder: 'Sem filtro. O desafio é o mestre.',
      },
      {
        type: 'prompt',
        fieldId: 'd7:aprofundar',
        label: 'O que quero aprofundar na Semana II?',
        placeholder: 'Minha intenção para os próximos 7 dias...',
      },
      affirmation(7, 'Nomeei o cinza. Na semana que vem, começo a desfazê-lo.', {
        label: 'Afirmação de integração',
      }),
    ],
  },
]

// A Semana II aparecia duas vezes no original; esta é a versão mais completa (ver .ai/features.md).
const week2: JourneyDay[] = [
  standardDay(
    8,
    'O desbloqueio emocional começa',
    'Presença corporal · Acesso ao campo',
    'Coloque uma das mãos no plexo solar. Respire para dentro da mão. Pergunte ao corpo: o que você precisa soltar hoje? Aguarde a resposta sem pressa.',
    'Minhas emoções são informação — não prisão.',
  ),
  standardDay(
    9,
    'O que está represado em mim',
    'Desbloqueio emocional profundo',
    'Escreva sem parar por 5 minutos — escrita automática, sem pensar. Não leia enquanto escreve.',
    'Sentir é o primeiro movimento de quem está saindo do cinza.',
  ),
  standardDay(
    10,
    'Âncoras do passado',
    'Dissolução de padrões antigos',
    'Identifique uma situação passada que ainda carrega carga. Visualize-a envolta em luz âmbar. Agradeça a lição e a libere.',
    'O passado informa — mas não define minha chama.',
  ),
  standardDay(
    11,
    'Relações que me drenam',
    'Clareza energética · Fronteiras',
    'Liste 3 relações ou situações que consomem sua energia. Não julgue — apenas observe onde você perde força.',
    'Minhas fronteiras são atos de amor — por mim e pelos outros.',
  ),
  standardDay(
    12,
    'O corpo como portal',
    'Fitoenergética · Aromaterapia interna',
    'Coloque uma gota de óleo essencial que te traga presença (lavanda, mirra, cedro) no pulso. Inspire profundamente. Deixe o aroma te ancorar.',
    'Meu corpo sabe o caminho que minha mente ainda debate.',
  ),
  standardDay(
    13,
    'A crença central do cinza',
    'PNL · Ressignificação profunda',
    'Pergunte: qual é a crença mais profunda que sustenta meu Estado Cinza? Não a superficial — a raiz. Escreva sem editar.',
    'Ressignifico para avançar — não para apagar.',
  ),
  standardDay(
    14,
    'Revisão da Semana II',
    'Integração · Consolidação · Movimento',
    'Reserve 30 minutos. Releia a semana. Identifique o maior movimento interno que aconteceu. Honre-o por escrito.',
    'Desbloqueei. Agora preparo o terreno para ativar.',
  ),
]

const week3: JourneyDay[] = [
  standardDay(
    15,
    'Quem sou quando não estou no cinza?',
    'Nova identidade · Visão ativada',
    'Feche os olhos. Visualize sua versão ativada. Como ela se move? Como ela fala? O que ela decide sem pedir permissão?',
    'Sou a versão que age — não a que espera estar pronta.',
  ),
  standardDay(
    16,
    'Âncoras da nova identidade',
    'PNL · Ancoragem energética',
    'Escolha um gesto físico como âncora (mão no peito, punho fechado). Faça o gesto enquanto se lembra de um momento de força total.',
    'Minha nova identidade não é futura — está sendo agora.',
  ),
  standardDay(
    17,
    'Minha direção real',
    'Clareza de propósito · Direção prática',
    'Escreva sua direção em uma frase. Uma. Sem pós-condições. Sem "quando eu estiver pronta".',
    'Direção não precisa ser perfeita — precisa ser real.',
  ),
  standardDay(
    18,
    'Ação sem permissão',
    'Movimento autônomo · Execução',
    'Faça hoje uma micro-ação que sua versão cinza adiaria. Pode ser pequena — mas precisa ser real.',
    'A ação é o portal. Não o pensamento — a ação.',
  ),
  standardDay(
    19,
    'Presença como prática',
    'Consolidação · Radiestesia da presença',
    'Identifique três momentos do seu dia onde pode praticar presença total: antes de comer, antes de dormir, ao acordar.',
    'Presença não é destino — é prática diária.',
  ),
  standardDay(
    20,
    'Minha Chama Interna acesa',
    'Integração final · Identidade consolidada',
    'Escreva uma carta para a versão sua do Dia 1. O que você sabe agora que ela precisava ouvir?',
    'Sou a ativadora de mim mesma — sempre fui.',
  ),
  standardDay(
    21,
    'Encerramento e próxima fase',
    'Transição · Compromisso · Celebração',
    'Acesse a [aba Encerramento](#/jornada/encerramento). Responda as 3 perguntas finais com presença total. Você merece esse momento.',
    'A jornada de 21 dias foi o começo — não o destino.',
  ),
]

export const chamaInterna21: Journey = {
  id: 'chama-interna-21',
  weeks: [
    { number: 1, roman: 'I', theme: 'Nomeando o Cinza', days: week1 },
    { number: 2, roman: 'II', theme: 'Desbloqueio Emocional', days: week2 },
    { number: 3, roman: 'III', theme: 'Nova Identidade e Direção', days: week3 },
  ],
  reviews: [
    {
      id: 'r7',
      tabLabel: 'Semana I — Dia 7',
      questions: [
        {
          fieldId: 'r7:q1',
          label: 'Pergunta 01',
          text: 'O que aprendi sobre meu Estado Cinza esta semana? Quais padrões consegui nomear?',
          placeholder: 'Escreva com profundidade. Esta é sua ficha de diagnóstico.',
          editable: true,
        },
        {
          fieldId: 'r7:q2',
          label: 'Pergunta 02',
          text: 'Qual foi meu maior desafio? O que ele revelou sobre onde ainda estou presa?',
          placeholder: 'O desafio é o espelho mais honesto que existe.',
        },
        {
          fieldId: 'r7:q3',
          label: 'Pergunta 03',
          text: 'Que micro-movimento de ativação aconteceu? Por menor que tenha sido — onde a Chama piscou?',
          placeholder: 'Reconheça e celebre cada centímetro de avanço.',
        },
        {
          fieldId: 'r7:q4',
          label: 'Intenção para a Semana II',
          text: 'Com o que aprendi, qual é minha intenção para os próximos 7 dias?',
          placeholder: 'Uma frase clara. Uma direção. Sem pressão — com presença.',
          editable: true,
        },
      ],
    },
    {
      id: 'r14',
      tabLabel: 'Semana II — Dia 14',
      questions: [
        {
          fieldId: 'r14:q1',
          label: 'Pergunta 01',
          text: 'O que desbloqueei emocionalmente nesta semana? O que estava represado e começou a se mover?',
          placeholder: 'Seja honesta sobre o que se moveu — mesmo que tenha sido desconfortável.',
          editable: true,
        },
        {
          fieldId: 'r14:q2',
          label: 'Pergunta 02',
          text: 'Quais relações ou padrões de consumo de energia ficaram mais claros? O que precisa mudar?',
          placeholder: 'Clareza antes de ação. Escreva sem censurar.',
        },
        {
          fieldId: 'r14:q3',
          label: 'Pergunta 03',
          text: 'O que mudou em mim desde o Dia 1? Mesmo que seja sutil — o que já é diferente?',
          placeholder: 'Compare com onde você estava na Semana I.',
        },
        {
          fieldId: 'r14:q4',
          label: 'Intenção para a Semana III',
          text: 'Entrando na semana da Nova Identidade: quem você está se tornando?',
          placeholder: 'Descreva em presente — como se já fosse.',
          editable: true,
        },
      ],
    },
    {
      id: 'r21',
      tabLabel: 'Semana III — Dia 21',
      questions: [
        {
          fieldId: 'r21:q1',
          label: 'Pergunta Final 01',
          text: 'Quem era a pessoa que começou este workbook no Dia 1? O que ela acreditava sobre si mesma?',
          placeholder: 'Escreva em terceira pessoa se precisar de distância.',
          editable: true,
        },
        {
          fieldId: 'r21:q2',
          label: 'Pergunta Final 02',
          text: 'Quem é você agora, no Dia 21? O que se ativou? O que não volta mais?',
          placeholder: 'Esta é sua nova identidade. Escreva sem modéstia.',
        },
        {
          fieldId: 'r21:q3',
          label: 'Pergunta Final 03',
          text: 'Qual é o próximo passo real da sua ativação? O que você agora sabe que precisa fazer?',
          placeholder: 'Uma ação. Um compromisso. Uma direção clara.',
        },
      ],
    },
  ],
  closingQuestions: [
    {
      fieldId: 'enc:q1',
      label: 'Reflexão de encerramento 01',
      text: 'Como eu era no Dia 1 e como sou agora? Qual a diferença mais concreta?',
      placeholder: 'Escreva com presença e gratidão.',
      editable: true,
    },
    {
      fieldId: 'enc:q2',
      label: 'Reflexão de encerramento 02',
      text: 'O que o Estado Cinza me custou até chegar aqui? O que não vou mais pagar esse preço?',
      placeholder: 'Este é o seu compromisso com a nova identidade.',
    },
    {
      fieldId: 'enc:q3',
      label: 'Reflexão de encerramento 03',
      text: 'Qual é meu próximo passo real? Não o ideal — o real. O que farei nos próximos 7 dias para manter a Chama ativa?',
      placeholder: 'Uma ação. Um compromisso. Uma direção.',
      editable: true,
    },
    {
      fieldId: 'enc:intencao',
      label: 'Intenção para os próximos 21 dias',
      text: '',
      placeholder: '[escreva aqui sua intenção para o próximo ciclo]',
    },
  ],
}
