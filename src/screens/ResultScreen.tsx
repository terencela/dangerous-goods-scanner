import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryById } from '../data/categories';
import VerdictCard from '../components/VerdictCard';

export default function ResultScreen() {
  const { goTo, session, resetSession, saveCurrentScan, selectedHistoryItem, clearSelectedHistory } =
    useApp();
  const savedRef = useRef(false);

  const isHistory = !!selectedHistoryItem;
  const result = isHistory ? selectedHistoryItem.result : session.result;
  const categoryId = isHistory ? selectedHistoryItem.categoryId : session.categoryId;
  const photoUrl = isHistory ? selectedHistoryItem.photoUrl : session.photoUrl;

  const category = getCategoryById(categoryId || '');

  useEffect(() => {
    if (!isHistory && result && !savedRef.current) {
      savedRef.current = true;
      saveCurrentScan();
    }
  }, [isHistory, result, saveCurrentScan]);

  if (!result) {
    return (
      <div className="min-h-full flex items-center justify-center bg-airport-light">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No result to display.</p>
          <button
            onClick={() => goTo('home')}
            className="text-airport-blue font-semibold text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleNewScan = () => {
    clearSelectedHistory();
    resetSession();
    goTo('camera');
  };

  const handleGoHome = () => {
    clearSelectedHistory();
    resetSession();
    goTo('home');
  };

  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={handleGoHome} className="text-sm font-medium text-slate-500 hover:text-slate-700">
            ← Home
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Item info */}
        <div className="flex items-center gap-4 mb-6">
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Scanned item"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
            />
          )}
          <div>
            <p className="text-sm text-slate-400 font-medium">Result for</p>
            <h2 className="text-lg font-bold text-slate-800">
              {category?.icon} {category?.name || categoryId}
            </h2>
          </div>
        </div>

        {/* Wh display for batteries */}
        {categoryId === 'batteries' && !isHistory && (
          (() => {
            const mah = Number(session.answers['battery-mah']) || 0;
            const v = Number(session.answers['battery-voltage']) || 0;
            const wh = (mah * v) / 1000;
            if (wh > 0) {
              return (
                <div className="bg-white rounded-2xl p-4 mb-4 border border-slate-200 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Computed Energy</p>
                  <p className="text-2xl font-bold text-airport-blue">{wh.toFixed(1)} Wh</p>
                  <p className="text-xs text-slate-400 mt-1">{mah} mAh × {v} V ÷ 1000</p>
                </div>
              );
            }
            return null;
          })()
        )}

        {/* Verdict cards */}
        <div className="space-y-4">
          <VerdictCard
            title="Hand Baggage"
            verdict={result.handBaggage.verdict}
            message={result.handBaggage.message}
            tip={result.handBaggage.tip}
          />
          <VerdictCard
            title="Checked Baggage"
            verdict={result.checkedBaggage.verdict}
            message={result.checkedBaggage.message}
            tip={result.checkedBaggage.tip}
          />
        </div>

        {/* Person note for lighters */}
        {categoryId === 'lighters-matches' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-sm text-blue-800 font-medium">📌 On Your Person</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              You may carry exactly 1 lighter or 1 box of matches on your person (in your pocket).
              This is the only way to bring them through security.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleNewScan}
            className="w-full bg-airport-blue text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">📷</span>
            Check Another Item
          </button>
          <button
            onClick={handleGoHome}
            className="w-full bg-white text-slate-600 font-semibold py-3.5 rounded-2xl border border-slate-200"
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}
