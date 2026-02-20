import type { ItemCategory } from '../types';

export const itemCategories: ItemCategory[] = [
  {
    id: 'batteries',
    name: 'Batteries & Power Banks',
    icon: '🔋',
    group: 'Electronics & Power',
    description: 'Lithium-ion batteries, power banks, rechargeable batteries',
  },
  {
    id: 'e-cigarettes',
    name: 'E-Cigarettes / E-Pipes / E-Cigars',
    icon: '🚬',
    group: 'Electronics & Power',
    description: 'Electronic smoking devices with lithium batteries',
  },
  {
    id: 'electronics',
    name: 'Electronic Devices',
    icon: '💻',
    group: 'Electronics & Power',
    description: 'Laptops, tablets, phones, cameras, etc.',
    skipWizard: true,
  },
  {
    id: 'smart-luggage-removable',
    name: 'Smart Luggage (Removable Battery)',
    icon: '🧳',
    group: 'Electronics & Power',
    description: 'Smart suitcase with a battery that can be removed',
    skipWizard: true,
  },
  {
    id: 'smart-luggage-permanent',
    name: 'Smart Luggage (Permanent Battery)',
    icon: '⛔',
    group: 'Electronics & Power',
    description: 'Smart suitcase with a built-in battery that cannot be removed',
    skipWizard: true,
  },
  {
    id: 'luggage-trackers',
    name: 'Luggage Trackers (e.g. AirTag)',
    icon: '📍',
    group: 'Electronics & Power',
    description: 'Small tracking devices with batteries',
    skipWizard: true,
  },
  {
    id: 'electronic-bag-tags',
    name: 'Electronic Bag Tags (EBTS)',
    icon: '🏷️',
    group: 'Electronics & Power',
    description: 'Electronic luggage tags with small batteries',
    skipWizard: true,
  },
  {
    id: 'liquids',
    name: 'Liquids',
    icon: '🧴',
    group: 'Liquids & Substances',
    description: 'Drinks, creams, gels, sprays, pastes, aerosols',
  },
  {
    id: 'knives-scissors',
    name: 'Knives & Scissors',
    icon: '✂️',
    group: 'Sharp Objects',
    description: 'Pocket knives, scissors, multi-tools with blades',
  },
  {
    id: 'tools',
    name: 'Tools (Screwdrivers, Wrenches, etc.)',
    icon: '🔧',
    group: 'Sharp Objects',
    description: 'Screwdrivers, wrenches, pliers, and similar tools',
  },
  {
    id: 'lighters-matches',
    name: 'Lighters & Matches',
    icon: '🔥',
    group: 'Fire & Combustibles',
    description: 'Disposable lighters, refillable lighters, matches',
  },
  {
    id: 'blunt-objects',
    name: 'Blunt Objects',
    icon: '🏏',
    group: 'Sports & Equipment',
    description: 'Baseball bats, golf clubs, hammers, martial arts equipment',
    skipWizard: true,
  },
  {
    id: 'prohibited',
    name: 'Prohibited Items',
    icon: '🚫',
    group: 'Always Prohibited',
    description: 'Fireworks, sparklers, fuel pastes, paints, acids, toxic/corrosive substances, gas cartridges',
    skipWizard: true,
  },
];

export const categoryGroups = [
  'Electronics & Power',
  'Liquids & Substances',
  'Sharp Objects',
  'Fire & Combustibles',
  'Sports & Equipment',
  'Always Prohibited',
];

export function getCategoryById(id: string): ItemCategory | undefined {
  return itemCategories.find((c) => c.id === id);
}
