/**
 * rules.ts — Deterministic Zurich Airport Rules Engine
 *
 * Source: Swiss Aviation Authority / BAZL, IATA DGR, EU Regulation 2015/1998
 * Reference: flughafen-zuerich.ch/en/passengers/baggage
 *
 * IMPORTANT: This file is the single source of truth for all verdicts.
 * The AI never produces verdicts. It only extracts facts that feed into
 * these functions. All logic is deterministic and auditable.
 *
 * Last audited: February 2026
 */

import type { RuleResult } from '../types';

type Answers = Record<string, string | number | boolean>;

// ─────────────────────────────────────────────
// Battery: Spare / Power Bank
// Regulation: IATA DGR Section 3.3 / BAZL
// ─────────────────────────────────────────────
function evaluateBatterySpare(answers: Answers): RuleResult {
  const size = (answers['battery-size'] as string) || 'small';

  if (size === 'xlarge') {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: 'Spare batteries over 160 Wh are prohibited in all baggage. This is a hard limit with no exceptions.',
        tip: 'Leave this item at home. No airline can grant an exemption for spare batteries above 160 Wh.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Spare batteries over 160 Wh are prohibited in all baggage.',
      },
    };
  }

  if (size === 'large') {
    return {
      handBaggage: {
        verdict: 'conditional',
        message: 'Spare batteries 100–160 Wh are allowed in hand baggage only. Maximum 2 units per person. Prior airline approval is mandatory. Exposed terminals must be taped or individually protected.',
        tip: 'Contact your airline before travelling. Without prior approval, the battery may be confiscated at security.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Spare batteries and power banks are never allowed in checked baggage, regardless of capacity.',
        tip: 'Always carry spare batteries in your hand baggage.',
      },
    };
  }

  // small: < 100 Wh
  return {
    handBaggage: {
      verdict: 'conditional',
      message: 'Power banks and spare batteries under 100 Wh are allowed in hand baggage. Maximum 20 spare batteries total. Exposed terminals must be taped or battery individually protected to prevent short-circuits.',
      tip: 'Use original packaging or a small bag/pouch for protection. Do not pack loose in a bag.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Spare batteries and power banks are never allowed in checked baggage.',
      tip: 'Always carry spare batteries in your hand baggage.',
    },
  };
}

// ─────────────────────────────────────────────
// Battery: Installed in Device
// Regulation: IATA DGR Section 3.3 / BAZL
// ─────────────────────────────────────────────
function evaluateBatteryInstalled(answers: Answers): RuleResult {
  const type = (answers['device-type'] as string) || 'small';

  if (type === 'large') {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: 'Devices with batteries over 160 Wh (e.g. some e-bikes) are prohibited in all baggage without explicit airline approval.',
        tip: 'Contact your airline. For most consumer devices this limit is never reached.',
      },
      checkedBaggage: {
        verdict: 'not_allowed',
        message: 'Devices with batteries over 160 Wh require prior airline approval and are generally prohibited.',
      },
    };
  }

  if (type === 'medium') {
    return {
      handBaggage: {
        verdict: 'allowed',
        message: 'Laptops and devices with batteries 100–160 Wh are allowed in hand baggage. Remove from bag and place separately in a tray at security screening.',
      },
      checkedBaggage: {
        verdict: 'conditional',
        message: 'Allowed in checked baggage if the device is completely switched off (not sleep/hibernate) and protected against damage and accidental activation.',
        tip: 'Recommended: carry laptops in hand baggage to reduce theft risk and comply with some airline policies.',
      },
    };
  }

  // small: phones, tablets, cameras, < 100 Wh
  return {
    handBaggage: {
      verdict: 'allowed',
      message: 'Phones, tablets, cameras and similar devices are allowed in hand baggage. Device must be switched off during take-off and landing if instructed by crew.',
    },
    checkedBaggage: {
      verdict: 'conditional',
      message: 'Allowed in checked baggage. The device must be completely switched off and protected against accidental activation.',
      tip: 'Recommended: keep valuable electronics in hand baggage.',
    },
  };
}

// ─────────────────────────────────────────────
// Liquids, Gels, Aerosols
// Regulation: EU Regulation 2015/1998 (100 ml rule, still in force for 2026)
// ZRH Directive: January 2023 update — 100 ml rule remains
// ─────────────────────────────────────────────
function evaluateLiquids(answers: Answers): RuleResult {
  const size = (answers['container-size'] as string) || 'small';
  const type = (answers['liquid-type'] as string) || 'regular';

  if (type === 'medication') {
    return {
      handBaggage: {
        verdict: 'conditional',
        message: 'Medication in quantities exceeding 100 ml is allowed in hand baggage.',
        tip: 'Carry a prescription, medical certificate, or doctor\'s letter. Be prepared for additional security checks.',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Medication is allowed in checked baggage.',
      },
    };
  }

  if (type === 'baby-food') {
    return {
      handBaggage: {
        verdict: 'allowed',
        message: 'Baby food and special dietary food may exceed 100 ml in hand baggage in quantities sufficient for the journey.',
        tip: 'Carry only the amount needed for the trip. Security staff may ask you to taste liquid baby food.',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage without restriction.',
      },
    };
  }

  if (type === 'duty-free') {
    return {
      handBaggage: {
        verdict: 'conditional',
        message: size === 'large'
          ? 'Duty-free liquids over 100 ml are allowed only if: purchased after the security checkpoint (at a Zurich Airport duty-free shop), inside a sealed, tamper-evident ICAO security bag, and accompanied by the purchase receipt.'
          : 'Duty-free liquids in containers up to 100 ml are allowed. Must still fit inside your 1-litre transparent resealable bag.',
        tip: 'Important: the sealed bag must not be opened during transit. At connecting airports, additional rules may apply.',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage without size restriction.',
      },
    };
  }

  // Regular liquid
  if (size === 'large') {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: 'Containers over 100 ml are not allowed in hand baggage. The 100 ml / 1-litre rule remains fully in force at Zurich Airport.',
        tip: 'Transfer to a container of 100 ml or less, or pack in checked baggage.',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Liquids in any quantity are allowed in checked baggage.',
      },
    };
  }

  return {
    handBaggage: {
      verdict: 'conditional',
      message: 'Allowed in hand baggage. Each container must be 100 ml or less. All liquid containers must fit inside one transparent, resealable plastic bag of maximum 1 litre (approx. 20×20 cm). One bag per passenger.',
      tip: 'Common example: a 1-litre zip-lock bag at the supermarket. Do not overfill — it must close properly.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage without restriction on container size.',
    },
  };
}

// ─────────────────────────────────────────────
// Bladed / Sharp Objects
// Regulation: EU 2015/1998 Annex (prohibited sharp/bladed items)
// ZRH Security Directive: sharp objects forbidden in cabin
// Note: EU regulation prohibits most bladed items > 6 cm in hand baggage.
// Items < 6 cm with non-locking blade may pass, but ZRH security is strict.
// ─────────────────────────────────────────────
function evaluateBlade(answers: Answers, keyId: string, itemLabel: string): RuleResult {
  const size = (answers[keyId] as string) || 'short';
  if (size === 'long') {
    return {
      handBaggage: {
        verdict: 'not_allowed',
        message: `${itemLabel} with blades 6 cm or longer are prohibited in hand baggage under EU aviation security rules.`,
        tip: 'Pack in checked baggage. If confiscated at security, it cannot be returned.',
      },
      checkedBaggage: {
        verdict: 'allowed',
        message: 'Allowed in checked baggage. Blades should be sheathed or wrapped to protect handlers.',
      },
    };
  }
  return {
    handBaggage: {
      verdict: 'allowed',
      message: `${itemLabel} with blades under 6 cm are generally allowed in hand baggage. Security officers may use discretion — when in doubt, pack in checked baggage.`,
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage.',
    },
  };
}

// ─────────────────────────────────────────────
// Static Rules (no wizard needed)
// Sources: IATA DGR, BAZL, EU 2015/1998
// ─────────────────────────────────────────────
const staticRules: Record<string, RuleResult> = {
  lighter: {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Lighters are not allowed in hand baggage (cabin bag or carry-on). However, you may carry ONE lighter on your person (e.g. in your trouser pocket or jacket).',
      tip: 'One regular (non-torch) lighter on your person is allowed. Torch lighters and refuelling cartridges are fully prohibited.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Lighters are prohibited in checked baggage. Only one lighter carried on your person is allowed.',
    },
  },

  matches: {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Matches are not allowed in hand baggage. However, one small box of safety matches on your person is allowed.',
      tip: 'Strike-anywhere matches and safety matches in checked baggage are fully prohibited.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'All types of matches are prohibited in checked baggage.',
    },
  },

  'e-cigarettes': {
    handBaggage: {
      verdict: 'allowed',
      message: 'E-cigarettes, vapes and similar devices are only allowed in hand baggage. Do not use, charge, or activate on board the aircraft.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'E-cigarettes and vaping devices are never allowed in checked baggage due to fire risk from the lithium battery.',
      tip: 'Always carry your vaping device in hand baggage. This rule is non-negotiable.',
    },
  },

  electronics: {
    handBaggage: {
      verdict: 'allowed',
      message: 'Electronic devices are allowed in hand baggage. Laptops and large tablets must be placed separately in a tray at the security checkpoint.',
    },
    checkedBaggage: {
      verdict: 'conditional',
      message: 'Allowed in checked baggage. Device must be completely switched off (not standby/sleep) and protected against accidental activation.',
      tip: 'Recommended: carry valuable electronics in hand baggage to reduce theft and damage risk.',
    },
  },

  'smart-luggage-removable': {
    handBaggage: {
      verdict: 'allowed',
      message: 'Smart luggage with a removable battery is allowed as hand baggage if it meets size requirements.',
    },
    checkedBaggage: {
      verdict: 'conditional',
      message: 'Smart luggage is allowed in checked baggage only if the battery is removed before check-in. The removed battery must be carried in hand baggage.',
      tip: 'Remove the battery before arriving at the check-in counter. Tape the exposed terminals.',
    },
  },

  'smart-luggage-permanent': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Smart luggage with a permanently integrated (non-removable) battery is not accepted at Zurich Airport.',
      tip: 'Purchase luggage with a removable battery, or remove the battery before travelling if technically possible.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Smart luggage with a built-in, non-removable battery is not accepted in checked baggage.',
    },
  },

  'luggage-trackers': {
    handBaggage: {
      verdict: 'allowed',
      message: 'Luggage trackers (AirTag, Tile, Samsung SmartTag, etc.) are allowed in both hand and checked baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Luggage trackers are allowed in checked baggage. Airlines are required to accept them.',
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
      message: 'Blunt objects that could be used as weapons (baseball bats, golf clubs, cricket bats, hammers, clubs) are prohibited in hand baggage.',
      tip: 'Pack in checked baggage.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage.',
    },
  },

  'sports-equipment': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Sports equipment longer than 6 cm or that could cause injury (rackets, ski poles, fishing rods, hockey sticks) is not allowed in hand baggage.',
      tip: 'Pack in checked baggage. Check your airline for special sports equipment fees.',
    },
    checkedBaggage: {
      verdict: 'allowed',
      message: 'Allowed in checked baggage. Check airline size, weight, and sports equipment surcharge policies.',
    },
  },

  fireworks: {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Fireworks, sparklers, and pyrotechnics are strictly prohibited in all baggage and cannot be transported by air.',
      tip: 'There are no exceptions. Leave these items at home.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Fireworks are strictly prohibited in all baggage.',
    },
  },

  'fuel-paste': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Fuel paste, camping fuel, gasoline, lighter fluid, and flammable liquids are prohibited in all baggage.',
      tip: 'Purchase fuel at your destination.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Flammable liquids are prohibited in all baggage.',
    },
  },

  'toxic-corrosive': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Toxic, corrosive, and poisonous substances (acids, bleach, strong cleaning agents, poisons) are prohibited in all baggage.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Prohibited in all baggage.',
    },
  },

  'gas-cartridges': {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Compressed gas cylinders, gas cartridges, and aerosols with flammable or toxic gas are prohibited in all baggage.',
      tip: 'Small non-flammable aerosols for personal care (deodorant, etc.) under 100 ml are governed by the liquids rule instead.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Prohibited in all baggage.',
    },
  },

  paints: {
    handBaggage: {
      verdict: 'not_allowed',
      message: 'Paints, varnishes, lacquers, and flammable solvents (acetone, turpentine, paint thinner) are prohibited in all baggage.',
      tip: 'Purchase paints and solvents at your destination.',
    },
    checkedBaggage: {
      verdict: 'not_allowed',
      message: 'Prohibited in all baggage.',
    },
  },
};

// ─────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────
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
        handBaggage: {
          verdict: 'conditional',
          message: 'This item could not be classified. Please check with Zurich Airport security or your airline before travelling.',
          tip: 'Contact: flughafen-zuerich.ch or your airline\'s customer service.',
        },
        checkedBaggage: {
          verdict: 'conditional',
          message: 'Please check with your airline or Zurich Airport security for this item.',
        },
      };
  }
}
