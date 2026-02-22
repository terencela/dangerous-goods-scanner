import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Screen, ScanSession, ScanRecord, RuleResult } from '../types';
import type { AiExtraction } from '../utils/classifier';
import { getCategoryById } from '../data/categories';
import { evaluateRules } from '../data/rules';
import { extractionToAnswers } from '../utils/extractionToAnswers';
import { loadHistory, saveRecord, deleteRecord, generateId } from '../utils/storage';

interface AppContextType {
  screen: Screen;
  session: ScanSession;
  history: ScanRecord[];
  selectedHistoryItem: ScanRecord | null;
  goTo: (screen: Screen) => void;
  setPhoto: (url: string) => void;
  selectCategory: (id: string) => void;
  setAnswers: (answers: Record<string, string | number | boolean>) => void;
  setAiAnalysis: (analysis: AiExtraction) => void;
  /**
   * applyExtraction: converts AI extraction facts into deterministic rules verdict.
   * This is the ONLY approved path to set a result from AI data.
   * The AI never sets the verdict directly.
   */
  applyExtraction: (categoryId: string, extraction: AiExtraction) => RuleResult;
  computeResult: () => RuleResult;
  saveCurrentScan: () => void;
  resetSession: () => void;
  refreshHistory: () => void;
  viewHistoryItem: (record: ScanRecord) => void;
  clearSelectedHistory: () => void;
  deleteHistoryItem: (id: string) => void;
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

  const setAiAnalysis = useCallback((analysis: AiExtraction) => {
    setSession((prev) => ({ ...prev, aiAnalysis: analysis }));
  }, []);

  /**
   * applyExtraction: THE SAFE PATH for AI-driven results.
   *
   * 1. Converts AI-extracted properties → wizard answer format
   * 2. Calls evaluateRules (deterministic) → verdict
   * 3. Stores everything in session
   *
   * The AI NEVER determines the verdict. Only this pipeline does.
   */
  const applyExtraction = useCallback((categoryId: string, extraction: AiExtraction): RuleResult => {
    const answers = extractionToAnswers(categoryId, extraction);
    const result = evaluateRules(categoryId, answers);
    setSession((prev) => ({
      ...prev,
      categoryId,
      answers,
      aiAnalysis: extraction,
      result,
    }));
    return result;
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

  const deleteHistoryItem = useCallback((id: string) => {
    deleteRecord(id);
    setHistory(loadHistory());
  }, []);

  return (
    <AppContext.Provider
      value={{
        screen, session, history, selectedHistoryItem,
        goTo, setPhoto, selectCategory, setAnswers, setAiAnalysis,
        applyExtraction, computeResult, saveCurrentScan, resetSession,
        refreshHistory, viewHistoryItem, clearSelectedHistory, deleteHistoryItem,
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
