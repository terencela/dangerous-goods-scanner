import type { RuleResult } from '../types';

type Answers = Record<string, string | number | boolean>;

function computeWh(mah: number, voltage: number): number {
  return (mah * voltage) / 1000;
}

function evaluateBatteries(answers: Answers): RuleResult {
  const mah = Number(answers['battery-mah']) || 0;
  const voltage = Number(answers['battery-voltage']) || 0;
  const installed = answers['battery-installed'] as string;
  const wh = computeWh(mah, voltage);

  if (wh > 160) {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: `${wh.toFixed(1)} Wh exceeds the 160 Wh limit. Prohibited in all baggage.`,
        tip: 'Leave this battery at home. It cannot be transported on any flight.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: `${wh.toFixed(1)} Wh exceeds the 160 Wh limit. Prohibited in all baggage.`,
        tip: 'Leave this battery at home.',
      },
    };
  }

  if (wh > 100) {
    const spareNote =
      installed === 'spare'
        ? ' Spare batteries: max 2, terminals must be taped or individually protected.'
        : '';
    return {
      handBaggage: {
        verdict: 'conditional',
        message: `${wh.toFixed(1)} Wh (100–160 Wh range). Allowed in hand baggage only with airline authorization. Max 2 batteries.${spareNote}`,
        tip: 'Contact your airline before travelling to get authorization.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Lithium batteries are never allowed in checked baggage.',
        tip: 'Always carry batteries in your hand baggage.',
      },
    };
  }

  // ≤100 Wh
  if (installed === 'spare') {
    return {
      handBaggage: {
        verdict: 'conditional',
        message: `${wh.toFixed(1)} Wh (≤100 Wh). Allowed in hand baggage. Max 20 spare batteries. Both terminals must be taped or individually protected.`,
        tip: 'Tape the terminals of all spare batteries before packing.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Spare lithium batteries are never allowed in checked baggage.',
        tip: 'Always carry spare batteries in your hand baggage.',
      },
    };
  }

  return {
    handBaggage: {
      verdict: 'allowed',
      message: `${wh.toFixed(1)} Wh (≤100 Wh). Allowed in hand baggage when installed in a device.`,
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Lithium batteries are never allowed in checked baggage.',
      tip: 'Always carry devices with lithium batteries in your hand baggage.',
    },
  };
}

function evaluateLiquids(answers: Answers): RuleResult {
  const volume = Number(answers['liquid-volume']) || 0;
  const liquidType = answers['liquid-type'] as string;

  if (volume <= 100) {
    return {
      handBaggage: {
        verdict: 'conditional',
        message: `${volume} ml container. Allowed in hand baggage. Must be packed in a resealable transparent plastic bag (max 1 litre).`,
        tip: 'Pack all liquids in one clear, resealable bag (max 1 litre total).',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage without restrictions.',
      },
    };
  }

  // Over 100 ml
  if (liquidType === 'medication' || liquidType === 'baby-food') {
    const typeLabel = liquidType === 'medication' ? 'medication' : 'baby food / special dietary food';
    return {
      handBaggage: {
        verdict: 'conditional',
        message: `${volume} ml of ${typeLabel}. Larger quantities allowed in hand baggage as an exception.`,
        tip: 'You may be asked to provide proof (prescription, medical certificate, or documentation).',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage without restrictions.',
      },
    };
  }

  if (liquidType === 'duty-free') {
    return {
      handBaggage: {
        verdict: 'conditional',
        message: `${volume} ml duty-free liquid. Allowed in hand baggage only if purchased at the airport/on board with receipt, in a sealed ICAO-standard security bag.`,
        tip: 'Keep your receipt and do not open the sealed security bag until you reach your destination.',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage without restrictions.',
      },
    };
  }

  // Regular liquid > 100ml
  return {
    handBaggage: {
      verdict: 'not_allowed',
      message: `${volume} ml exceeds the 100 ml limit for hand baggage. The 100 ml / 1 litre rule remains in effect until at least summer 2026.`,
      tip: 'Transfer to a container of max 100 ml, or pack it in your checked baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage without restrictions.',
    },
  };
}

function evaluateKnivesScissors(answers: Answers): RuleResult {
  const bladeLength = Number(answers['blade-length']) || 0;

  if (bladeLength <= 6) {
    return {
      handBaggage: {
        verdict: 'allowed',
        message: `Blade length ${bladeLength} cm (≤6 cm). Allowed in hand baggage.`,
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage.',
      },
    };
  }

  return {
    handBaggage: {
      verdict: 'not_allowed',
      message: `Blade length ${bladeLength} cm (>6 cm). Not allowed in hand baggage.`,
      tip: 'Pack it in your checked baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage.',
    },
  };
}

function evaluateTools(answers: Answers): RuleResult {
  const toolLength = Number(answers['tool-length']) || 0;

  if (toolLength <= 6) {
    return {
      handBaggage: {
        verdict: 'allowed',
        message: `Tool length ${toolLength} cm (≤6 cm). Allowed in hand baggage.`,
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage.',
      },
    };
  }

  return {
    handBaggage: {
      verdict: 'not_allowed',
      message: `Tool length ${toolLength} cm (>6 cm). Not allowed in hand baggage.`,
      tip: 'Pack it in your checked baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage.',
    },
  };
}

function evaluateLightersMatches(answers: Answers): RuleResult {
  const carry = answers['lighter-carry'] as string;
  const quantity = Number(answers['lighter-quantity']) || 1;

  if (carry === 'person' && quantity <= 1) {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: 'Lighters and matches are not allowed in hand baggage.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Lighters and matches are not allowed in checked baggage.',
      },
    };
  }

  if (carry === 'person' && quantity > 1) {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: 'Lighters and matches are not allowed in hand baggage.',
        tip: 'Only 1 lighter or 1 box of matches is allowed, carried on your person.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Lighters and matches are not allowed in checked baggage.',
        tip: 'Only 1 lighter or 1 box of matches is allowed, carried on your person.',
      },
    };
  }

  return {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Lighters and matches are not allowed in hand or checked baggage.',
      tip: 'You may carry exactly 1 lighter or 1 box of matches on your person only (in your pocket).',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Lighters and matches are not allowed in hand or checked baggage.',
      tip: 'Carry on your person only — max 1 lighter or 1 box of matches.',
    },
  };
}

const staticRules: Record<string, RuleResult> = {
  'e-cigarettes': {
    handBaggage: {
      verdict: 'allowed',
      message: 'E-cigarettes, e-pipes, and e-cigars are allowed in hand baggage only.',
      tip: 'Never pack e-cigarettes in checked baggage. The lithium battery rules also apply.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'E-cigarettes are prohibited in checked baggage.',
      tip: 'Always carry e-cigarettes in your hand baggage.',
    },
  },
  electronics: {
    handBaggage: {
      verdict: 'allowed',
      message: 'Electronic devices (laptops, tablets, phones, cameras) are allowed in hand baggage.',
      tip: 'At security, place electronics larger than a smartphone separately in the tray.',
    },
    checkedBaggage: {
      verdict: 'conditional',
      message: 'Allowed in checked baggage, but the lithium battery must be under 100 Wh.',
      tip: 'It is recommended to carry electronics in hand baggage to prevent damage and theft.',
    },
  },
  'smart-luggage-removable': {
    handBaggage: {
      verdict: 'conditional',
      message: 'Allowed, but the lithium battery must be removed before check-in and carried as a spare battery in hand baggage.',
      tip: 'Remove the battery and tape the terminals. It is then treated as a spare battery (≤100 Wh: max 20).',
    },
    checkedBaggage: {
      verdict: 'conditional',
      message: 'The luggage itself can be checked, but only after removing the battery.',
      tip: 'Remove the battery before check-in and carry it in your hand baggage.',
    },
  },
  'smart-luggage-permanent': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Smart luggage with a permanently installed lithium battery is not permitted.',
      tip: 'This item cannot be transported. Leave it at home.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Smart luggage with a permanently installed lithium battery is not permitted.',
      tip: 'This item cannot be transported. Leave it at home.',
    },
  },
  'luggage-trackers': {
    handBaggage: {
      verdict: 'allowed',
      message: 'Luggage trackers (e.g. AirTag) are allowed in hand baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Luggage trackers are allowed in checked baggage. Their small batteries are well under the 100 Wh limit.',
    },
  },
  'electronic-bag-tags': {
    handBaggage: {
      verdict: 'allowed',
      message: 'Electronic bag tags (EBTS) are allowed in hand baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Electronic bag tags are allowed in checked baggage.',
    },
  },
  'blunt-objects': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Blunt objects (baseball bats, golf clubs, hammers, martial arts equipment) are not allowed in hand baggage.',
      tip: 'Pack these items in your checked baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Blunt objects are allowed in checked baggage.',
    },
  },
  prohibited: {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'This item is prohibited in all baggage: fuel pastes, sparklers, fireworks, paints, acids, toxic/corrosive substances, gas cartridges.',
      tip: 'Leave this item at home. It cannot be transported on any flight.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'This item is prohibited in all baggage.',
      tip: 'Leave this item at home. It cannot be transported on any flight.',
    },
  },
};

export function evaluateRules(categoryId: string, answers: Answers): RuleResult {
  if (staticRules[categoryId]) {
    return staticRules[categoryId];
  }

  switch (categoryId) {
    case 'batteries':
      return evaluateBatteries(answers);
    case 'liquids':
      return evaluateLiquids(answers);
    case 'knives-scissors':
      return evaluateKnivesScissors(answers);
    case 'tools':
      return evaluateTools(answers);
    case 'lighters-matches':
      return evaluateLightersMatches(answers);
    default:
      return {
        handBaggage: {
          verdict: 'conditional',
          message: 'Please check with your airline or airport security for specific rules.',
        },
        checkedBaggage: {
          verdict: 'conditional',
          message: 'Please check with your airline or airport security for specific rules.',
        },
      };
  }
}
