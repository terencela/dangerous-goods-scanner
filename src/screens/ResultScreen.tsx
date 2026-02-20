import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryById } from '../data/categories';
import VerdictCard from '../components/VerdictCard';

export default function ResultScreen() {
  const { goTo, session, resetSession, saveCurrentScan, selectedHistoryItem, clearSelectedHistory } =
    useApp();
  const savedRef = useRef(false);

  const fromHistory = !!selectedHistoryItem;
  const result = fromHistory ? selectedHistoryItem.result : session.result;
  const catId = fromHistory ? selectedHistoryItem.categoryId : session.categoryId;
  const photo = fromHistory ? selectedHistoryItem.photoUrl : session.photoUrl;
  const cat = getCategoryById(catId || '');

  useEffect(() => {
    if (!fromHistory && result && !savedRef.current) {
      savedRef.current = true;
      saveCurrentScan();
    }
  }, [fromHistory, result, saveCurrentScan]);

  if (!result) {
    return (
      <div className="min-h-full flex items-center justify-center bg-airport-light">
        <div className="text-center px-8">
          <p className="text-4xl mb-3">🤷</p>
          <p className="text-slate-500 mb-4 text-sm">No result to display.</p>
          <button onClick={() => goTo('home')} className="text-airport-blue font-semibold text-sm">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const newScan = () => { clearSelectedHistory(); resetSession(); goTo('camera'); };
  const home = () => { clearSelectedHistory(); resetSession(); goTo('home'); };

  // Wh computation for battery results
  const whBlock = (() => {
    if (catId !== 'batteries' || fromHistory) return null;
    const m = Number(session.answers['battery-mah']) || 0;
    const v = Number(session.answers['battery-voltage']) || 0;
    const wh = (m * v) / 1000;
    if (wh <= 0) return null;
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200 text-center mb-4 anim-fade-in-up anim-delay-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          Computed Energy
        </p>
        <p className={`text-3xl font-extrabold ${
          wh > 160 ? 'text-red-600' : wh > 100 ? 'text-amber-500' : 'text-emerald-600'
        }`}>
          {wh.toFixed(1)} Wh
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {m} mAh × {v} V ÷ 1000
        </p>
      </div>
    );
  })();

  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 pt-14 pb-5">
        <div className="max-w-lg mx-auto">
          <button onClick={home} className="text-sm text-slate-400 font-medium mb-4 block">
            ← Home
          </button>

          <div className="flex items-center gap-4 anim-fade-in">
            {photo && (
              <img
                src={photo}
                alt="Item"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            )}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Result
              </p>
              <h2 className="text-lg font-bold text-slate-800">
                {cat?.icon} {cat?.name || catId}
              </h2>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-5 max-w-lg mx-auto w-full overflow-y-auto">
        {whBlock}

        <div className="space-y-3.5">
          <VerdictCard
            title="Hand Baggage"
            verdict={result.handBaggage.verdict}
            message={result.handBaggage.message}
            tip={result.handBaggage.tip}
            delay={0}
          />
          <VerdictCard
            title="Checked Baggage"
            verdict={result.checkedBaggage.verdict}
            message={result.checkedBaggage.message}
            tip={result.checkedBaggage.tip}
            delay={1}
          />
        </div>

        {/* Special lighter note */}
        {catId === 'lighters-matches' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 anim-fade-in-up anim-delay-4">
            <div className="flex gap-2.5 items-start">
              <span className="text-lg mt-0.5">📌</span>
              <div>
                <p className="text-sm font-semibold text-blue-800">On Your Person</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  You may carry exactly 1 lighter or 1 box of matches on your person (in your
                  pocket). This is the only way to bring them through security.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-2.5 anim-fade-in-up anim-delay-4">
          <button
            onClick={newScan}
            className="w-full bg-airport-blue text-white font-bold py-4 rounded-2xl shadow-lg shadow-airport-blue/20 active:scale-[0.97] transition-transform flex items-center justify-center gap-2.5"
          >
            <span className="text-xl">📷</span>
            Check Another Item
          </button>
          <button
            onClick={home}
            className="w-full bg-white text-slate-600 font-semibold py-3.5 rounded-2xl border border-slate-200"
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}
