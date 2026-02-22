import type { ItemCategory } from '../types';

export const itemCategories: ItemCategory[] = [
  // --- Batteries & Power Banks ---
  {
    id: 'battery-spare',
    name: 'Spare Battery / Power Bank',
    icon: '🔋',
    group: 'Batteries & Power Banks',
    description: 'Power banks, portable chargers, spare lithium batteries',
  },
  {
    id: 'battery-installed',
    name: 'Battery Installed in Device',
    icon: '📱',
    group: 'Batteries & Power Banks',
    description: 'Battery built into a phone, laptop, tablet, camera, etc.',
  },

  // --- Liquids ---
  {
    id: 'liquids',
    name: 'Liquids, Gels & Aerosols',
    icon: '🧴',
    group: 'Liquids',
    description: 'Drinks, creams, gels, sprays, pastes, perfume, shampoo',
  },

  // --- Sharp Objects ---
  {
    id: 'knife',
    name: 'Knife',
    icon: '🔪',
    group: 'Sharp Objects',
    description: 'Pocket knives, Swiss army knives, kitchen knives, utility knives',
  },
  {
    id: 'scissors',
    name: 'Scissors',
    icon: '✂️',
    group: 'Sharp Objects',
    description: 'Scissors, shears, nail scissors, craft scissors',
  },
  {
    id: 'tools',
    name: 'Tools (Screwdrivers, etc.)',
    icon: '🔧',
    group: 'Sharp Objects',
    description: 'Screwdrivers, wrenches, pliers, drills, multi-tools',
  },

  // --- Fire & Flammable ---
  {
    id: 'lighter',
    name: 'Lighter',
    icon: '🔥',
    group: 'Fire & Flammable',
    description: 'Disposable lighters, refillable lighters, Zippos, torch lighters',
    skipWizard: true,
  },
  {
    id: 'matches',
    name: 'Matches',
    icon: '🔥',
    group: 'Fire & Flammable',
    description: 'Matchboxes, matchsticks',
    skipWizard: true,
  },

  // --- Electronics ---
  {
    id: 'e-cigarettes',
    name: 'E-Cigarette / Vape',
    icon: '🚬',
    group: 'Electronics',
    description: 'E-cigarettes, vapes, vape pens, IQOS, e-pipes',
    skipWizard: true,
  },
  {
    id: 'electronics',
    name: 'Laptop / Tablet / Phone / Camera',
    icon: '💻',
    group: 'Electronics',
    description: 'Laptops, tablets, phones, cameras, electronic devices',
    skipWizard: true,
  },
  {
    id: 'smart-luggage-removable',
    name: 'Smart Luggage (Removable Battery)',
    icon: '🧳',
    group: 'Electronics',
    description: 'Smart suitcase with a battery that can be removed',
    skipWizard: true,
  },
  {
    id: 'smart-luggage-permanent',
    name: 'Smart Luggage (Built-in Battery)',
    icon: '⛔',
    group: 'Electronics',
    description: 'Smart suitcase with a permanently installed battery',
    skipWizard: true,
  },
  {
    id: 'luggage-trackers',
    name: 'Luggage Tracker (AirTag, etc.)',
    icon: '📍',
    group: 'Electronics',
    description: 'AirTag, Tile, GPS trackers',
    skipWizard: true,
  },
  {
    id: 'electronic-bag-tags',
    name: 'Electronic Bag Tags (EBTS)',
    icon: '🏷️',
    group: 'Electronics',
    description: 'Electronic luggage tags',
    skipWizard: true,
  },

  // --- Sports & Blunt Objects ---
  {
    id: 'blunt-objects',
    name: 'Blunt Objects (Bats, Hammers)',
    icon: '🏏',
    group: 'Sports & Blunt Objects',
    description: 'Baseball bats, golf clubs, hammers, cricket bats, hockey sticks',
    skipWizard: true,
  },
  {
    id: 'sports-equipment',
    name: 'Sports Equipment (Rackets, Poles)',
    icon: '🎾',
    group: 'Sports & Blunt Objects',
    description: 'Tennis rackets, badminton rackets, ski poles, hiking poles',
    skipWizard: true,
  },

  // --- Prohibited ---
  {
    id: 'fireworks',
    name: 'Fireworks / Sparklers',
    icon: '🎆',
    group: 'Always Prohibited',
    description: 'Fireworks, sparklers, firecrackers, pyrotechnics',
    skipWizard: true,
  },
  {
    id: 'fuel-paste',
    name: 'Fuel Paste / Flammable Liquids',
    icon: '🚫',
    group: 'Always Prohibited',
    description: 'Fuel, gasoline, lighter fluid, flammable liquids',
    skipWizard: true,
  },
  {
    id: 'toxic-corrosive',
    name: 'Acids / Toxic / Corrosive',
    icon: '☠️',
    group: 'Always Prohibited',
    description: 'Acids, bleach, toxic chemicals, poisons, corrosive substances',
    skipWizard: true,
  },
  {
    id: 'gas-cartridges',
    name: 'Gas Cartridges / Compressed Gas',
    icon: '🔴',
    group: 'Always Prohibited',
    description: 'Gas cartridges, propane, butane, pepper spray, compressed gas',
    skipWizard: true,
  },
  {
    id: 'paints',
    name: 'Paints / Solvents',
    icon: '🎨',
    group: 'Always Prohibited',
    description: 'Paints, paint thinner, solvents, turpentine, acetone',
    skipWizard: true,
  },
];

export const categoryGroups = [
  'Batteries & Power Banks',
  'Liquids',
  'Sharp Objects',
  'Fire & Flammable',
  'Electronics',
  'Sports & Blunt Objects',
  'Always Prohibited',
];

export function getCategoryById(id: string): ItemCategory | undefined {
  return itemCategories.find((c) => c.id === id);
}
