import type { ItemCategory } from '../types';
import { itemCategories } from '../data/categories';

interface Prediction {
  className: string;
  probability: number;
}

interface MobileNetModel {
  classify(img: HTMLImageElement, topk?: number): Promise<Prediction[]>;
}

let model: MobileNetModel | null = null;
let modelLoadPromise: Promise<boolean> | null = null;

// Maps MobileNet ImageNet labels (lowercased) to our category IDs.
// MobileNet returns comma-separated alternative names per class.
const keywordToCategory: Record<string, string> = {
  // Electronics
  'laptop': 'electronics',
  'notebook': 'electronics',
  'desktop computer': 'electronics',
  'computer keyboard': 'electronics',
  'space bar': 'electronics',
  'mouse': 'electronics',
  'cellular telephone': 'electronics',
  'cell phone': 'electronics',
  'cellphone': 'electronics',
  'smartphone': 'electronics',
  'dial telephone': 'electronics',
  'ipod': 'electronics',
  'digital watch': 'electronics',
  'digital clock': 'electronics',
  'monitor': 'electronics',
  'screen': 'electronics',
  'television': 'electronics',
  'remote control': 'electronics',
  'camera': 'electronics',
  'reflex camera': 'electronics',
  'polaroid camera': 'electronics',
  'projector': 'electronics',
  'loudspeaker': 'electronics',
  'speaker': 'electronics',
  'microphone': 'electronics',
  'printer': 'electronics',
  'hard disc': 'electronics',
  'modem': 'electronics',
  'joystick': 'electronics',
  'cd player': 'electronics',
  'tape player': 'electronics',
  'cassette player': 'electronics',
  'radio': 'electronics',
  'headphone': 'electronics',
  'earphone': 'electronics',
  'hand-held computer': 'electronics',
  'electric fan': 'electronics',
  'hair dryer': 'electronics',
  'vacuum': 'electronics',
  'electric guitar': 'electronics',
  'space heater': 'electronics',
  'torch': 'electronics',
  'flashlight': 'electronics',

  // Batteries & Power Banks
  'power supply': 'batteries',
  'battery': 'batteries',
  'adapter': 'batteries',

  // Liquids
  'water bottle': 'liquids',
  'pop bottle': 'liquids',
  'soda bottle': 'liquids',
  'wine bottle': 'liquids',
  'beer bottle': 'liquids',
  'beer glass': 'liquids',
  'cocktail shaker': 'liquids',
  'coffee mug': 'liquids',
  'cup': 'liquids',
  'pitcher': 'liquids',
  'milk can': 'liquids',
  'water jug': 'liquids',
  'perfume': 'liquids',
  'lotion': 'liquids',
  'soap dispenser': 'liquids',
  'hair spray': 'liquids',
  'bottle': 'liquids',
  'jug': 'liquids',
  'pill bottle': 'liquids',
  'medicine chest': 'liquids',
  'goblet': 'liquids',
  'red wine': 'liquids',
  'eggnog': 'liquids',
  'espresso': 'liquids',

  // Knives & Scissors
  'cleaver': 'knives-scissors',
  'letter opener': 'knives-scissors',
  'paper knife': 'knives-scissors',
  'knife': 'knives-scissors',
  'butcher knife': 'knives-scissors',
  'scissors': 'knives-scissors',
  'pocketknife': 'knives-scissors',
  'jackknife': 'knives-scissors',
  'swiss army knife': 'knives-scissors',
  'dagger': 'knives-scissors',
  'sword': 'knives-scissors',

  // Tools
  'screwdriver': 'tools',
  'hammer': 'tools',
  'hatchet': 'tools',
  'power drill': 'tools',
  'wrench': 'tools',
  'plunger': 'tools',
  'nail': 'tools',
  'screw': 'tools',
  'chain saw': 'tools',
  'corkscrew': 'tools',
  'crowbar': 'tools',
  'shovel': 'tools',
  'plane': 'tools',

  // Lighters & Matches
  'lighter': 'lighters-matches',
  'matchstick': 'lighters-matches',
  'match': 'lighters-matches',
  'candle': 'lighters-matches',

  // Blunt Objects
  'baseball bat': 'blunt-objects',
  'golf ball': 'blunt-objects',
  'dumbbell': 'blunt-objects',
  'barbell': 'blunt-objects',
  'tennis racket': 'blunt-objects',
  'racket': 'blunt-objects',
  'cricket bat': 'blunt-objects',

  // E-cigarettes
  'cigarette': 'e-cigarettes',

  // Prohibited
  'firecracker': 'prohibited',
  'projectile': 'prohibited',
  'missile': 'prohibited',

  // Smart Luggage
  'suitcase': 'smart-luggage-removable',
  'luggage': 'smart-luggage-removable',
  'backpack': 'smart-luggage-removable',
};

export interface CategoryMatch {
  category: ItemCategory;
  confidence: number;
  detectedLabel: string;
}

function mapPredictions(predictions: Prediction[]): CategoryMatch[] {
  const matches: CategoryMatch[] = [];
  const seen = new Set<string>();

  for (const pred of predictions) {
    const variants = pred.className.toLowerCase().split(/\s*,\s*/);

    for (const variant of variants) {
      const trimmed = variant.trim();

      for (const [keyword, catId] of Object.entries(keywordToCategory)) {
        if (seen.has(catId)) continue;
        if (trimmed.includes(keyword) || keyword.includes(trimmed)) {
          const cat = itemCategories.find((c) => c.id === catId);
          if (cat) {
            matches.push({
              category: cat,
              confidence: pred.probability,
              detectedLabel: pred.className,
            });
            seen.add(catId);
          }
          break;
        }
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

export async function preloadModel(): Promise<boolean> {
  if (model) return true;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = (async () => {
    try {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const mobilenet = await import('@tensorflow-models/mobilenet');
      model = await mobilenet.load({ version: 2, alpha: 0.5 }) as unknown as MobileNetModel;
      return true;
    } catch (err) {
      console.error('AI model load failed:', err);
      model = null;
      return false;
    }
  })();

  return modelLoadPromise;
}

export async function classifyImage(imgElement: HTMLImageElement): Promise<CategoryMatch[]> {
  const ok = await preloadModel();
  if (!ok || !model) return [];

  try {
    const predictions = await model.classify(imgElement, 15);
    return mapPredictions(predictions);
  } catch (err) {
    console.error('Classification error:', err);
    return [];
  }
}

export function isModelReady(): boolean {
  return model !== null;
}
