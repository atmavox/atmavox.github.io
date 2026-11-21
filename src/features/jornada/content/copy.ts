// Textos fixos das telas da jornada (capa, revisões, vitórias, encerramento).
// Textos terapêuticos vêm de .ai/reference/workbook-original.html e não devem ser reescritos.
import { BRAND_SIGNATURE, WHATSAPP_PHONE } from '../../../shared/brand/links'
import { buildWhatsAppLink } from '../../../shared/lib/whatsapp'

export const coverCopy = {
  tagline: 'Atmavox · Protocolo de Ativação',
  title: 'Saindo do Estado Cinza',
  subtitle: '21 Dias de Ativação da Chama Interna',
  manifesto:
    'Você chegou até aqui porque sabe que nasceu para mais.\n' +
    '**Mas ainda vive pedindo permissão para existir.**\n\n' +
    'Isso tem nome: **Estado Cinza.**\n' +
    'E os próximos 21 dias existem para destruí-lo — dentro de você —\n' +
    'e acender o que nunca deveria ter apagado.',
  instructionsTitle: 'Como usar este workbook',
  instructions: [
    'Reserve entre 10 e 20 minutos por dia — de preferência pela manhã, antes que o mundo fale mais alto que você.',
    'Cada dia tem um ritual, uma afirmação e espaço de reflexão. Não pule etapas — a sequência é intencional.',
    'Marque cada dia concluído no rastreador abaixo. Progresso visível ativa o sistema nervoso.',
    'Campos entre **[colchetes]** são editáveis — personalize com sua linguagem, datas e contexto.',
    'Nas revisões semanais (dias 7, 14 e 21), reserve 30 minutos para integrar o que está se movendo.',
  ],
  trackerLabel: 'Rastreador de Progresso — 21 Dias',
} as const

export const reviewsCopy = {
  eyebrow: 'Revisão Periódica',
  title: 'Integração das Semanas',
  subtitle: 'Onde você estava. Onde está. Para onde vai.',
} as const

export const victoriesCopy = {
  eyebrow: 'Registro de Conquistas',
  title: 'Chamas Acesas',
  subtitle: 'Cada vitória que você documenta, ancora a nova identidade',
  formTitle: 'Registrar nova conquista',
  dateLabel: 'Data',
  dayLabel: 'Dia do Protocolo',
  dayPlaceholder: 'Ex: 3',
  actionLabel: 'O que aconteceu / foi tentado',
  actionPlaceholder: 'Descreva a conquista ou avanço...',
  resultLabel: 'Como foi alcançado / resolvido',
  resultPlaceholder: 'O que mudou, o que senti, o que se abriu...',
  submit: '✦ Registrar Conquista',
  /** O original trazia este exemplo pré-preenchido; aqui ele aparece só enquanto a lista está vazia. */
  example: {
    day: 1,
    action: 'Completei o primeiro dia sem pular nenhuma etapa',
    result: 'Senti uma leveza inesperada ao nomear o Estado Cinza pela primeira vez',
  },
} as const

export const closingCopy = {
  eyebrow: 'Dia 21 · Encerramento',
  title: 'A Chama está acesa.',
  subtitle: 'O Estado Cinza não te define mais.',
  text:
    'Você completou 21 dias de presença intencional.\n' +
    'Nomeou o que te prendia. Desbloqueou o que estava represado.\n' +
    'Ancorou quem você está se tornando.\n\n' +
    'Isso não é fim — é fundação.\n' +
    'A Chama Interna que você ativou aqui não apaga mais facilmente.',
  ctaTitle: 'O Protocolo de Ativação Presencial Atmavox',
  ctaText:
    'Você percorreu 21 dias sozinha — e isso é poderoso.\n' +
    'Imagine o que acontece quando você é guiada por dentro, em uma sessão individual de diagnóstico, ativação e ancoragem.\n\n' +
    'O Protocolo Presencial vai mais fundo do que qualquer jornada solo.',
  ctaButton: 'Quero Sair do Estado Cinza →',
  // O original apontava para o Keepo; agora vai direto ao WhatsApp da Andreia.
  ctaHref: buildWhatsAppLink(
    WHATSAPP_PHONE,
    'Olá, Andreia! Concluí a jornada A Chama Interna (21 dias) e quero conhecer o Protocolo de Ativação Presencial.',
  ),
  signature: BRAND_SIGNATURE,
} as const
