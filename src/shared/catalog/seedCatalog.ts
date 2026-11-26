// Catálogo que vem no código: usado enquanto `catalog/public` não existe no Firestore ou se a nuvem
// falhar. Só metadados (ADR-019); preço e prazo de cada produto ainda vêm da Andreía, então a jornada
// de 21 dias segue grátis, como hoje.
import type { Product } from './product'

export const seedCatalog: readonly Product[] = [
  {
    kind: 'journey',
    id: 'chama-interna-21',
    title: 'A Chama Interna',
    phrase: '21 dias de rituais, escrita e presença, no seu ritmo.',
    territory: 'estado-cinza',
    status: 'published',
    pricing: { type: 'free' },
    featured: true,
    order: 1,
    structure: 'weeks',
    durationLabel: '21 dias',
    dayCount: 21,
    themes: [
      { label: 'I', title: 'Nomeando o Cinza' },
      { label: 'II', title: 'Desbloqueio Emocional' },
      { label: 'III', title: 'Nova Identidade e Direção' },
    ],
  },
  {
    kind: 'journey',
    id: 'ritual-matinal',
    title: 'Ritual Matinal',
    phrase: 'Uma semana de manhãs com presença.',
    territory: 'presenca',
    status: 'soon',
    pricing: { type: 'free' },
    featured: true,
    order: 2,
    structure: 'days',
    durationLabel: '7 dias',
    dayCount: 7,
    themes: [],
  },
  {
    kind: 'meditation',
    id: 'retorne-ao-seu-centro',
    title: 'Retorne ao Seu Centro',
    phrase: '',
    territory: 'presenca',
    status: 'published',
    pricing: { type: 'free' },
    featured: true,
    order: 1,
    media: 'video',
    durationSec: 300,
    group: 'Para começar',
  },
]
