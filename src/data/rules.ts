import type { RuleResult } from '../types';

type Answers = Record<string, string | number | boolean>;

function evaluateBatterySpare(answers: Answers): RuleResult {
  const size = (answers['battery-size'] as string) || 'small';

  if (size === 'xlarge') {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: 'Very large batteries (over 160 Wh) are prohibited in all baggage.',
        tip: 'Leave this item at home.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Very large batteries are prohibited in all baggage.',
      },
    };
  }
  if (size === 'large') {
    return {
      handBaggage: {
        verdict: 'conditional',
        message: 'Large power banks (100–160 Wh) are allowed in hand baggage. Max 2 units. Airline approval required. Terminals must be taped.',
        tip: 'Contact your airline before travelling.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Spare batteries are never allowed in checked baggage.',
        tip: 'Must be carried in hand baggage.',
      },
    };
  }
  return {
    handBaggage: {
      verdict: 'conditional',
      message: 'Standard power banks (under 100 Wh) are allowed in hand baggage. Terminals must be taped or individually protected. Max 20 spare batteries.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Spare batteries are never allowed in checked baggage.',
      tip: 'Must be carried in hand baggage.',
    },
  };
}

function evaluateBatteryInstalled(answers: Answers): RuleResult {
  const type = (answers['device-type'] as string) || 'small';

  if (type === 'large') {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: 'Devices with very large batteries (over 160 Wh) are prohibited.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Devices with very large batteries are prohibited.',
      },
    };
  }
  if (type === 'medium') {
    return {
      handBaggage: {
        verdict: 'allowed',
        message: 'Laptops are allowed in hand baggage. Must be placed separately in a tray at security.',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage. Device must be completely switched off.',
      },
    };
  }
  return {
    handBaggage: {
      verdict: 'allowed',
      message: 'Phones, tablets and cameras are allowed in hand baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage. Device must be switched off.',
    },
  };
}

function evaluateLiquids(answers: Answers): RuleResult {
  const size = (answers['container-size'] as string) || 'small';
  const type = (answers['liquid-type'] as string) || 'regular';

  if (type === 'medication' || type === 'baby-food') {
    return {
      handBaggage: {
        verdict: 'allowed',
        message: `${type === 'medication' ? 'Medication' : 'Baby food / special dietary food'} may exceed 100 ml in hand baggage.`,
        tip: 'Carry proof (prescription, medical certificate, etc.).',
      },
      checkedBaggage: { verdict: 'allowed', message: 'Allowed in checked baggage.' },
    };
  }
  if (type === 'duty-free' && size === 'large') {
    return {
      handBaggage: {
        verdict: 'conditional',
        message: 'Duty-free liquids over 100 ml are only allowed with purchase receipt in a sealed ICAO security bag.',
        tip: 'Keep receipt and sealed bag until your final destination.',
      },
      checkedBaggage: { verdict: 'allowed', message: 'Allowed in checked baggage.' },
    };
  }
  if (size === 'large') {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: 'Containers over 100 ml are not allowed in hand baggage. The 100 ml / 1 litre rule remains in effect until at least summer 2026.',
        tip: 'Transfer to a smaller container or pack in checked baggage.',
      },
      checkedBaggage: { verdict: 'allowed', message: 'Allowed in checked baggage without size restriction.' },
    };
  }
  return {
    handBaggage: {
      verdict: 'conditional',
      message: 'Allowed in hand baggage. Must be packed in a transparent, resealable plastic bag (max 1 litre total).',
    },
    checkedBaggage: { verdict: 'allowed', message: 'Allowed in checked baggage.' },
  };
}

function evaluateBlade(answers: Answers, keyId: string, itemLabel: string): RuleResult {
  const size = (answers[keyId] as string) || 'short';
  if (size === 'long') {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: `${itemLabel} with blades 6 cm or longer are prohibited in hand baggage.`,
        tip: 'Pack in checked baggage.',
      },
      checkedBaggage: { verdict: 'allowed', message: 'Allowed in checked baggage.' },
    };
  }
  return {
    handBaggage: { verdict: 'allowed', message: `${itemLabel} with blades under 6 cm are allowed in hand baggage.` },
    checkedBaggage: { verdict: 'allowed', message: 'Allowed in checked baggage.' },
  };
}

const staticRules: Record<string, RuleResult> = {
  lighter: {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Lighters are prohibited in hand baggage.',
      tip: 'You may carry ONE lighter on your person (e.g. in your pocket).',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Lighters are prohibited in checked baggage. You may carry ONE lighter on your person.',
    },
  },
  matches: {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Matches are prohibited in hand baggage.',
      tip: 'You may carry one box of matches on your person.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Matches are prohibited in checked baggage.',
    },
  },
  'e-cigarettes': {
    handBaggage: {
      verdict: 'allowed',
      message: 'E-cigarettes and vapes are only allowed in hand baggage.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Never allowed in checked baggage due to fire risk.',
      tip: 'Always carry in hand baggage.',
    },
  },
  electronics: {
    handBaggage: {
      verdict: 'allowed',
      message: 'Electronic devices are allowed. Place separately in a tray at security.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage. Device must be completely switched off.',
    },
  },
  'smart-luggage-removable': {
    handBaggage: {
      verdict: 'allowed',
      message: 'Smart luggage allowed as hand baggage.',
    },
    checkedBaggage: {
      verdict: 'conditional',
      message: 'Battery must be removed and carried in hand baggage. Tape the terminals.',
      tip: 'Remove the battery before check-in.',
    },
  },
  'smart-luggage-permanent': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Smart luggage with a built-in battery is not allowed.',
      tip: 'Use luggage with a removable battery.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Smart luggage with a built-in battery is not allowed.',
    },
  },
  'luggage-trackers': {
    handBaggage: { verdict: 'allowed', message: 'Luggage trackers are allowed in hand baggage.' },
    checkedBaggage: { verdict: 'allowed', message: 'Luggage trackers are allowed in checked baggage.' },
  },
  'electronic-bag-tags': {
    handBaggage: { verdict: 'allowed', message: 'Electronic bag tags are allowed in hand baggage.' },
    checkedBaggage: { verdict: 'allowed', message: 'Electronic bag tags are allowed in checked baggage.' },
  },
  'blunt-objects': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Bats, hammers and similar blunt objects are prohibited in hand baggage.',
      tip: 'Pack in checked baggage.',
    },
    checkedBaggage: { verdict: 'allowed', message: 'Allowed in checked baggage.' },
  },
  'sports-equipment': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Sports equipment is not allowed in hand baggage.',
      tip: 'Pack in checked baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage. Check airline size/weight limits.',
    },
  },
  fireworks: {
    handBaggage: { verdict: 'not_allowed', message: 'Fireworks are prohibited in all baggage.', tip: 'Cannot be transported by air.' },
    checkedBaggage: { verdict: 'not_allowed', message: 'Fireworks are prohibited in all baggage.' },
  },
  'fuel-paste': {
    handBaggage: { verdict: 'not_allowed', message: 'Fuel paste and flammable liquids are prohibited.' },
    checkedBaggage: { verdict: 'not_allowed', message: 'Prohibited in all baggage.' },
  },
  'toxic-corrosive': {
    handBaggage: { verdict: 'not_allowed', message: 'Toxic and corrosive substances are prohibited.' },
    checkedBaggage: { verdict: 'not_allowed', message: 'Prohibited in all baggage.' },
  },
  'gas-cartridges': {
    handBaggage: { verdict: 'not_allowed', message: 'Gas cartridges and compressed gas are prohibited.' },
    checkedBaggage: { verdict: 'not_allowed', message: 'Prohibited in all baggage.' },
  },
  paints: {
    handBaggage: { verdict: 'not_allowed', message: 'Paints and solvents are prohibited.' },
    checkedBaggage: { verdict: 'not_allowed', message: 'Prohibited in all baggage.' },
  },
};

export function evaluateRules(categoryId: string, answers: Answers): RuleResult {
  if (staticRules[categoryId]) return staticRules[categoryId];

  switch (categoryId) {
    case 'battery-spare':
      return evaluateBatterySpare(answers);
    case 'battery-installed':
      return evaluateBatteryInstalled(answers);
    case 'liquids':
      return evaluateLiquids(answers);
    case 'knife':
      return evaluateBlade(answers, 'knife-blade', 'Knives');
    case 'scissors':
      return evaluateBlade(answers, 'scissors-blade', 'Scissors');
    case 'tools':
      return evaluateBlade(answers, 'tool-size', 'Tools');
    default:
      return {
        handBaggage: { verdict: 'conditional', message: 'Please check with your airline or airport security.' },
        checkedBaggage: { verdict: 'conditional', message: 'Please check with your airline or airport security.' },
      };
  }
}
