import type { ItemCategory } from '../types';
import { itemCategories } from '../data/categories';

const SYSTEM_PROMPT = `You are an airport security item classifier for Zurich Airport (ZRH).
Given an image, identify the item and classify it into exactly ONE of these categories:

1. batteries — Lithium batteries, power banks, rechargeable batteries, battery packs
2. e-cigarettes — E-cigarettes, vapes, e-pipes, e-cigars, vape pens, IQOS
3. electronics — Laptops, tablets, phones, cameras, headphones, electronic devices
4. smart-luggage-removable — Smart suitcase with removable battery
5. smart-luggage-permanent — Smart suitcase with non-removable battery
6. luggage-trackers — AirTag, Tile, small GPS trackers
7. electronic-bag-tags — Electronic bag tags (EBTS)
8. liquids — Liquids, gels, creams, sprays, pastes, aerosols, drinks, perfume, shampoo
9. knives-scissors — Knives, scissors, blades, box cutters, multi-tools
10. tools — Screwdrivers, wrenches, pliers, drills, saws
11. lighters-matches — Lighters, matches, Zippos
12. blunt-objects — Baseball bats, golf clubs, hammers, martial arts equipment, hockey sticks
13. prohibited — Fireworks, sparklers, fuel paste, gas cartridges, acids, toxic/corrosive substances

Respond ONLY with valid JSON. No other text.
{"categoryId":"one-of-the-ids-above","confidence":0.95,"itemName":"Short name of detected item"}

If you cannot classify the item or it does not fit any category, use:
{"categoryId":"unknown","confidence":0,"itemName":"description of what you see"}`;

export interface DetectionResult {
  category: ItemCategory | null;
  categoryId: string;
  confidence: number;
  itemName: string;
  error?: string;
}

export async function classifyWithVision(
  base64DataUrl: string,
  apiKey: string
): Promise<DetectionResult> {
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
                text: 'Identify this item for airport security purposes. What category does it belong to?',
              },
              {
                type: 'image_url',
                image_url: { url: base64DataUrl, detail: 'low' },
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      if (res.status === 401) {
        return { category: null, categoryId: 'error', confidence: 0, itemName: '', error: 'Invalid API key. Please check your OpenAI API key in settings.' };
      }
      if (res.status === 429) {
        return { category: null, categoryId: 'error', confidence: 0, itemName: '', error: 'Rate limit reached. Please wait a moment and try again.' };
      }
      return {
        category: null,
        categoryId: 'error',
        confidence: 0,
        itemName: '',
        error: errBody?.error?.message || `API error (${res.status})`,
      };
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { category: null, categoryId: 'unknown', confidence: 0, itemName: content.slice(0, 60), error: 'Could not parse AI response.' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      categoryId: string;
      confidence: number;
      itemName: string;
    };

    const cat = itemCategories.find((c) => c.id === parsed.categoryId) || null;

    return {
      category: cat,
      categoryId: parsed.categoryId,
      confidence: parsed.confidence,
      itemName: parsed.itemName,
    };
  } catch (err) {
    return {
      category: null,
      categoryId: 'error',
      confidence: 0,
      itemName: '',
      error: err instanceof Error ? err.message : 'Network error. Check your connection.',
    };
  }
}
