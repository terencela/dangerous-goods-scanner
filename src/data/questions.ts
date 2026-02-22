import type { Question } from '../types';

export const questions: Question[] = [
  // Spare Battery / Power Bank
  {
    id: 'battery-size',
    categoryId: 'battery-spare',
    text: 'What kind of power bank / spare battery do you have?',
    type: 'select',
    options: [
      { label: 'Standard (phone charger, small power bank — under 100 Wh)', value: 'small' },
      { label: 'Large (laptop power bank, high capacity — 100–160 Wh)', value: 'large' },
      { label: 'Very large / Industrial (over 160 Wh)', value: 'xlarge' },
    ],
    order: 1,
  },

  // Battery Installed in Device
  {
    id: 'device-type',
    categoryId: 'battery-installed',
    text: 'What kind of device is it?',
    type: 'select',
    options: [
      { label: 'Phone, tablet, camera or similar', value: 'small' },
      { label: 'Laptop or larger device', value: 'medium' },
      { label: 'Very large device (e-bike battery, etc.)', value: 'large' },
    ],
    order: 1,
  },

  // Liquids
  {
    id: 'container-size',
    categoryId: 'liquids',
    text: 'Is the container travel-sized (100 ml or smaller)?',
    type: 'select',
    options: [
      { label: 'Yes, 100 ml or smaller', value: 'small' },
      { label: 'No, larger than 100 ml', value: 'large' },
    ],
    order: 1,
  },
  {
    id: 'liquid-type',
    categoryId: 'liquids',
    text: 'What type of liquid is it?',
    type: 'select',
    options: [
      { label: 'Regular liquid (perfume, shampoo, etc.)', value: 'regular' },
      { label: 'Medication', value: 'medication' },
      { label: 'Baby food / special dietary food', value: 'baby-food' },
      { label: 'Duty-free purchase (with receipt & sealed bag)', value: 'duty-free' },
    ],
    order: 2,
  },

  // Knife
  {
    id: 'knife-blade',
    categoryId: 'knife',
    text: 'Is the blade shorter than 6 cm?',
    type: 'select',
    options: [
      { label: 'Yes, shorter than 6 cm', value: 'short' },
      { label: 'No, 6 cm or longer', value: 'long' },
    ],
    order: 1,
  },

  // Scissors
  {
    id: 'scissors-blade',
    categoryId: 'scissors',
    text: 'Is the blade shorter than 6 cm?',
    type: 'select',
    options: [
      { label: 'Yes, shorter than 6 cm (e.g. nail scissors)', value: 'short' },
      { label: 'No, 6 cm or longer', value: 'long' },
    ],
    order: 1,
  },

  // Tools
  {
    id: 'tool-size',
    categoryId: 'tools',
    text: 'Is the tool shorter than 6 cm?',
    type: 'select',
    options: [
      { label: 'Yes, shorter than 6 cm', value: 'short' },
      { label: 'No, 6 cm or longer', value: 'long' },
    ],
    order: 1,
  },
];

export function getQuestionsForCategory(categoryId: string): Question[] {
  return questions
    .filter((q) => q.categoryId === categoryId)
    .sort((a, b) => a.order - b.order);
}
