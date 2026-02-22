import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Screen, ScanSession, ScanRecord, RuleResult } from '../types';
import type { AiAnalysis } from '../utils/classifier';
import { getCategoryById } from '../data/categories';
import { evaluateRules } from '../data/rules';
import { loadHistory, saveRecord, generateId } from '../utils/storage';

interface AppContextType {
  screen: Screen;
  session: ScanSession;
  history: ScanRecord[];
  selectedHistoryItem: ScanRecord | null;
  goTo: (screen: Screen) => void;
  setPhoto: (url: string) => void;
  selectCategory: (id: string) => void;
  setAnswers: (answers: Record<string, string | number | boolean>) => void;
  setAiAnalysis: (analysis: AiAnalysis) => void;
  applyAiVerdict: (analysis: AiAnalysis) => void;
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

  const setAiAnalysis = useCallback((analysis: AiAnalysis) => {
    setSession((prev) => ({ ...prev, aiAnalysis: analysis }));
  }, []);

  const applyAiVerdict = useCallback((analysis: AiAnalysis) => {
    if (!analysis.verdict || !analysis.categoryId) return;
    const result: RuleResult = {
      handBaggage: {
        verdict: analysis.verdict.handBaggage.status as RuleResult['handBaggage']['verdict'],
        message: analysis.verdict.handBaggage.text,
        tip: analysis.verdict.handBaggage.tip,
      },
      checkedBaggage: {
        verdict: analysis.verdict.checkedBaggage.status as RuleResult['checkedBaggage']['verdict'],
        message: analysis.verdict.checkedBaggage.text,
        tip: analysis.verdict.checkedBaggage.tip,
      },
    };
    setSession((prev) => ({
      ...prev,
      categoryId: analysis.categoryId,
      aiAnalysis: analysis,
      result,
    }));
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
      categoryName: cat?.name || session.aiAnalysis?.itemName || session.categoryId,
      answers: session.answers,
      result: session.result,
      photoUrl: session.photoUrl,
      timestamp: Date.now(),
      aiAnalysis: session.aiAnalysis,
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
        screen, session, history, selectedHistoryItem,
        goTo, setPhoto, selectCategory, setAnswers, setAiAnalysis,
        applyAiVerdict, computeResult, saveCurrentScan, resetSession,
        refreshHistory, viewHistoryItem, clearSelectedHistory,
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
