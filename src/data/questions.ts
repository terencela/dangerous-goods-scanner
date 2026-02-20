import type { Question } from '../types';

export const questions: Question[] = [
  // Batteries
  {
    id: 'battery-mah',
    categoryId: 'batteries',
    text: 'What is the battery capacity in mAh?',
    type: 'number',
    unit: 'mAh',
    placeholder: 'e.g. 5000',
    order: 1,
  },
  {
    id: 'battery-voltage',
    categoryId: 'batteries',
    text: 'What is the voltage?',
    type: 'number',
    unit: 'V',
    placeholder: 'e.g. 3.7',
    order: 2,
  },
  {
    id: 'battery-installed',
    categoryId: 'batteries',
    text: 'Is the battery installed in a device or is it a spare?',
    type: 'select',
    options: [
      { label: 'Installed in a device', value: 'installed' },
      { label: 'Spare / loose battery', value: 'spare' },
    ],
    order: 3,
  },

  // Liquids
  {
    id: 'liquid-volume',
    categoryId: 'liquids',
    text: 'What is the container volume in ml?',
    type: 'number',
    unit: 'ml',
    placeholder: 'e.g. 100',
    order: 1,
  },
  {
    id: 'liquid-type',
    categoryId: 'liquids',
    text: 'What type of liquid is it?',
    type: 'select',
    options: [
      { label: 'Regular liquid (cosmetics, drinks, etc.)', value: 'regular' },
      { label: 'Medication', value: 'medication' },
      { label: 'Baby food / special dietary food', value: 'baby-food' },
      { label: 'Duty-free purchase (with receipt & sealed bag)', value: 'duty-free' },
    ],
    order: 2,
  },

  // Knives & Scissors
  {
    id: 'blade-length',
    categoryId: 'knives-scissors',
    text: 'What is the blade length in cm?',
    type: 'number',
    unit: 'cm',
    placeholder: 'e.g. 5',
    order: 1,
  },

  // Tools
  {
    id: 'tool-length',
    categoryId: 'tools',
    text: 'What is the tool/blade length in cm?',
    type: 'number',
    unit: 'cm',
    placeholder: 'e.g. 8',
    order: 1,
  },

  // Lighters & Matches
  {
    id: 'lighter-carry',
    categoryId: 'lighters-matches',
    text: 'Where do you plan to carry it?',
    type: 'select',
    options: [
      { label: 'On my person (pocket / clothing)', value: 'person' },
      { label: 'In my hand baggage', value: 'hand' },
      { label: 'In my checked baggage', value: 'checked' },
    ],
    order: 1,
  },
  {
    id: 'lighter-quantity',
    categoryId: 'lighters-matches',
    text: 'How many lighters or matchboxes?',
    type: 'number',
    unit: 'pieces',
    placeholder: 'e.g. 1',
    order: 2,
  },
];

export function getQuestionsForCategory(categoryId: string): Question[] {
  return questions
    .filter((q) => q.categoryId === categoryId)
    .sort((a, b) => a.order - b.order);
}
