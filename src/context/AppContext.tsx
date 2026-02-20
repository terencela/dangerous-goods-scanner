import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Screen, ScanSession, ScanRecord, RuleResult } from '../types';
import { getCategoryById } from '../data/categories';
import { evaluateRules } from '../data/rules';
import { loadHistory, saveRecord, generateId } from '../utils/storage';

interface AppState {
  screen: Screen;
  session: ScanSession;
  history: ScanRecord[];
  selectedHistoryItem: ScanRecord | null;
}

interface AppContextType extends AppState {
  goTo: (screen: Screen) => void;
  setPhoto: (url: string) => void;
  selectCategory: (id: string) => void;
  setAnswers: (answers: Record<string, string | number | boolean>) => void;
  computeResult: () => RuleResult;
  saveCurrentScan: () => void;
  resetSession: () => void;
  refreshHistory: () => void;
  viewHistoryItem: (record: ScanRecord) => void;
  clearSelectedHistory: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const emptySession: ScanSession = { answers: {} };

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<ScanSession>(emptySession);
  const [history, setHistory] = useState<ScanRecord[]>(() => loadHistory());
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScanRecord | null>(null);

  const goTo = useCallback((s: Screen) => setScreen(s), []);

  const setPhoto = useCallback((url: string) => {
    setSession((prev) => ({ ...prev, photoUrl: url }));
  }, []);

  const selectCategory = useCallback((id: string) => {
    setSession((prev) => ({ ...prev, categoryId: id }));
  }, []);

  const setAnswers = useCallback((answers: Record<string, string | number | boolean>) => {
    setSession((prev) => ({ ...prev, answers }));
  }, []);

  const computeResult = useCallback((): RuleResult => {
    const result = evaluateRules(session.categoryId || '', session.answers);
    setSession((prev) => ({ ...prev, result }));
    return result;
  }, [session.categoryId, session.answers]);

  const saveCurrentScan = useCallback(() => {
    if (!session.categoryId || !session.result) return;
    const cat = getCategoryById(session.categoryId);
    const record: ScanRecord = {
      id: generateId(),
      categoryId: session.categoryId,
      categoryName: cat?.name || session.categoryId,
      answers: session.answers,
      result: session.result,
      photoUrl: session.photoUrl,
      timestamp: Date.now(),
    };
    saveRecord(record);
    setHistory(loadHistory());
  }, [session]);

  const resetSession = useCallback(() => {
    setSession(emptySession);
    setSelectedHistoryItem(null);
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(loadHistory());
  }, []);

  const viewHistoryItem = useCallback((record: ScanRecord) => {
    setSelectedHistoryItem(record);
    setScreen('result');
  }, []);

  const clearSelectedHistory = useCallback(() => {
    setSelectedHistoryItem(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        screen,
        session,
        history,
        selectedHistoryItem,
        goTo,
        setPhoto,
        selectCategory,
        setAnswers,
        computeResult,
        saveCurrentScan,
        resetSession,
        refreshHistory,
        viewHistoryItem,
        clearSelectedHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
