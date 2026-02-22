const CATEGORIES_INFO = [
  { id: 'battery-spare', name: 'Spare Battery / Power Bank', keywords: 'power bank, portable charger, spare battery, external battery, battery pack' },
  { id: 'battery-installed', name: 'Battery Installed in Device', keywords: 'laptop battery, phone battery, tablet battery, device with built-in battery' },
  { id: 'liquids', name: 'Liquids, Gels & Aerosols', keywords: 'water, perfume, shampoo, lotion, gel, spray, deodorant, toothpaste, cream, drink, juice, oil' },
  { id: 'knife', name: 'Knife', keywords: 'knife, pocket knife, swiss army knife, utility knife, kitchen knife, hunting knife' },
  { id: 'scissors', name: 'Scissors', keywords: 'scissors, shears, craft scissors, nail scissors' },
  { id: 'tools', name: 'Tools', keywords: 'screwdriver, wrench, pliers, hammer tool, multi-tool, spanner' },
  { id: 'lighter', name: 'Lighter', keywords: 'lighter, zippo, gas lighter, cigarette lighter, torch lighter' },
  { id: 'matches', name: 'Matches', keywords: 'matches, matchbox, matchstick' },
  { id: 'e-cigarettes', name: 'E-Cigarette / Vape', keywords: 'e-cigarette, vape, vaping device, e-pipe, juul, vape pen, iqos' },
  { id: 'electronics', name: 'Laptop / Tablet / Phone / Camera', keywords: 'laptop, tablet, phone, camera, smartphone, macbook, ipad, DSLR, gopro, kindle' },
  { id: 'smart-luggage-removable', name: 'Smart Luggage (removable battery)', keywords: 'smart suitcase, smart luggage with removable battery' },
  { id: 'smart-luggage-permanent', name: 'Smart Luggage (built-in battery)', keywords: 'smart suitcase with permanent battery' },
  { id: 'luggage-trackers', name: 'Luggage Tracker', keywords: 'airtag, tile tracker, luggage tracker, gps tracker' },
  { id: 'electronic-bag-tags', name: 'Electronic Bag Tags', keywords: 'electronic bag tag, EBTS, e-tag' },
  { id: 'blunt-objects', name: 'Blunt Objects', keywords: 'baseball bat, golf club, hammer, cricket bat, hockey stick' },
  { id: 'sports-equipment', name: 'Sports Equipment', keywords: 'tennis racket, badminton racket, ski poles, hiking poles, racket' },
  { id: 'fireworks', name: 'Fireworks / Sparklers', keywords: 'fireworks, sparklers, firecrackers, pyrotechnics' },
  { id: 'fuel-paste', name: 'Fuel Paste / Flammable Liquids', keywords: 'fuel, gasoline, lighter fluid, flammable liquid' },
  { id: 'toxic-corrosive', name: 'Acids / Toxic / Corrosive', keywords: 'acid, bleach, corrosive, toxic chemical, poison' },
  { id: 'gas-cartridges', name: 'Gas Cartridges / Compressed Gas', keywords: 'gas cartridge, compressed gas, propane, butane, pepper spray' },
  { id: 'paints', name: 'Paints / Solvents', keywords: 'paint, paint thinner, solvent, turpentine, acetone' },
];

const SYSTEM_PROMPT = `You are a Zurich Airport (ZRH) security expert. Your job is to identify items in photos and give a COMPLETE verdict on whether they are allowed in hand baggage and checked baggage.

CATEGORIES:
${CATEGORIES_INFO.map(c => `- ID: "${c.id}" | Name: "${c.name}" | Keywords: ${c.keywords}`).join('\n')}

ZURICH AIRPORT RULES:
- Spare batteries/power banks: Under 100 Wh = hand baggage allowed (tape terminals, max 20). 100-160 Wh = max 2, airline approval required. Over 160 Wh = prohibited. ALWAYS prohibited in checked baggage.
- Devices with built-in battery: Under 100 Wh = allowed. 100-160 Wh = allowed with airline approval. Over 160 Wh = prohibited. Checked baggage: device must be switched off.
- Liquids: Hand baggage max 100 ml per container, in transparent 1-litre resealable bag. Medication/baby food exempt. Duty-free with sealed bag and receipt allowed. Checked baggage: no size limit. 100ml/1L rule in effect until at least summer 2026.
- Knives/scissors/tools: Blade/length under 6 cm = hand baggage allowed. 6 cm or longer = checked baggage only.
- Lighters: Prohibited in all baggage. Only 1 lighter on your person allowed.
- Matches: Prohibited in all baggage. Only 1 box on your person allowed.
- E-cigarettes/vapes: Hand baggage only. Never in checked baggage.
- Smart luggage with removable battery: Remove battery, carry in hand baggage. Luggage can be checked.
- Smart luggage with fixed battery: Prohibited.
- Fireworks, fuel paste, toxic/corrosive, gas cartridges, paints/solvents: ALWAYS prohibited in all baggage.
- Blunt objects (bats, clubs, hammers): Checked baggage only.
- Sports equipment (rackets, poles): Checked baggage only.

YOUR TASK when you see an image:
1. Identify the item
2. Read ALL visible technical data from labels (mAh, Wh, V, ml, cm, weight) — the user should NOT have to type anything
3. Apply the rules and give the COMPLETE verdict
4. Respond in English

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "identified": true,
  "itemName": "Descriptive name of the item",
  "categoryId": "one of the category IDs above",
  "confidence": "high" | "medium" | "low",
  "detectedProperties": {
    "mah": number or null,
    "voltage": number or null,
    "wh": number or null,
    "volume_ml": number or null,
    "blade_length_cm": number or null
  },
  "verdict": {
    "handBaggage": {
      "status": "allowed" | "conditional" | "not_allowed",
      "text": "Clear explanation for the traveller",
      "tip": "Optional helpful tip"
    },
    "checkedBaggage": {
      "status": "allowed" | "conditional" | "not_allowed",
      "text": "Clear explanation",
      "tip": "Optional helpful tip"
    }
  },
  "summary": "Short summary of what you detected and how you reached the verdict"
}

If you cannot identify the item:
{"identified": false, "summary": "Explanation of why not identifiable"}

IMPORTANT:
- ALWAYS return a complete verdict when identified=true
- For batteries: read mAh/Wh from the label and compute the verdict yourself
- For liquids: read ml from the label
- For knives/scissors: estimate the blade length
- Write clearly for a normal traveller, not a technician`;

export interface AiAnalysis {
  identified: boolean;
  itemName?: string;
  categoryId?: string;
  confidence?: 'high' | 'medium' | 'low';
  detectedProperties?: {
    mah?: number | null;
    voltage?: number | null;
    wh?: number | null;
    volume_ml?: number | null;
    blade_length_cm?: number | null;
  };
  verdict?: {
    handBaggage: { status: string; text: string; tip?: string };
    checkedBaggage: { status: string; text: string; tip?: string };
  };
  summary?: string;
  error?: string;
}

export async function classifyWithVision(
  base64DataUrl: string,
  apiKey: string
): Promise<AiAnalysis> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this item, read all visible technical data from the label, and give the complete verdict for Zurich Airport baggage security.',
              },
              {
                type: 'image_url',
                image_url: { url: base64DataUrl, detail: 'high' },
              },
            ],
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      if (res.status === 401) {
        return { identified: false, error: 'Invalid API key. Please check your OpenAI API key in settings.' };
      }
      if (res.status === 429) {
        return { identified: false, error: 'Rate limit reached. Please wait a moment and try again.' };
      }
      return { identified: false, error: errBody?.error?.message || `API error (${res.status})` };
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || '';

    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { identified: false, error: 'Could not parse AI response.' };
    }

    return JSON.parse(jsonMatch[0]) as AiAnalysis;
  } catch (err) {
    return {
      identified: false,
      error: err instanceof Error ? err.message : 'Network error. Check your connection.',
    };
  }
}
