import type { ScanRecord } from '../types';

const HISTORY_KEY = 'zrh-scan-history';
const API_KEY_KEY = 'zrh-openai-key';

// --- Scan history ---

export function loadHistory(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(record: ScanRecord): void {
  const history = loadHistory();
  history.unshift(record);
  if (history.length > 50) history.length = 50;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- API key ---

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || '';
}

export function setApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(API_KEY_KEY, key.trim());
  } else {
    localStorage.removeItem(API_KEY_KEY);
  }
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}
