import type { AiExtraction } from '../utils/classifier';
/** @deprecated use AiExtraction */
export type AiAnalysis = AiExtraction;

export type Screen = 'home' | 'camera' | 'identify' | 'wizard' | 'result' | 'settings' | 'chat';

export type Verdict = 'allowed' | 'conditional' | 'not_allowed';

export interface ItemCategory {
  id: string;
  name: string;
  icon: string;
  group: string;
  description: string;
  skipWizard?: boolean;
}

export interface Question {
  id: string;
  categoryId: string;
  text: string;
  type: 'number' | 'select' | 'boolean';
  options?: { label: string; value: string }[];
  unit?: string;
  placeholder?: string;
  order: number;
}

export interface RuleResult {
  handBaggage: {
    verdict: Verdict;
    message: string;
    tip?: string;
  };
  checkedBaggage: {
    verdict: Verdict;
    message: string;
    tip?: string;
  };
}

export interface ScanRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  answers: Record<string, string | number | boolean>;
  result: RuleResult;
  photoUrl?: string;
  timestamp: number;
  aiAnalysis?: AiExtraction;
}

export interface ScanSession {
  photoUrl?: string;
  categoryId?: string;
  answers: Record<string, string | number | boolean>;
  result?: RuleResult;
  aiAnalysis?: AiExtraction;
}
