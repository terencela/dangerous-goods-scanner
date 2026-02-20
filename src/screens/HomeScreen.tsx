import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { preloadModel } from '../utils/classifier';
import type { Verdict } from '../types';

const dotColor: Record<Verdict, string> = {
  allowed: 'bg-emerald-500',
  conditional: 'bg-amber-500',
  not_allowed: 'bg-red-500',
};

function worst(a: Verdict, b: Verdict): Verdict {
  const r: Record<Verdict, number> = { not_allowed: 0, conditional: 1, allowed: 2 };
  return r[a] <= r[b] ? a : b;
}

export default function HomeScreen() {
  const { goTo, resetSession, history, viewHistoryItem } = useApp();

  useEffect(() => {
    preloadModel();
  }, []);

  const handleStart = () => {
    resetSession();
    goTo('camera');
  };

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-b from-airport-blue via-airport-blue to-slate-900">
      {/* Hero */}
      <div className="flex-shrink-0 px-6 pt-16 pb-10 text-center anim-fade-in">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-widest">
            Zurich Airport
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Baggage Checker
        </h1>
        <p className="text-sm text-blue-200/80 mt-2 max-w-xs mx-auto leading-relaxed">
          Scan any item to check if it's allowed in your hand or checked baggage
        </p>
      </div>

      {/* Scan button */}
      <div className="px-6 pb-8 anim-fade-in-up">
        <button
          onClick={handleStart}
          className="relative w-full group"
        >
          <div className="absolute inset-0 bg-white/20 rounded-3xl anim-pulse-ring" />
          <div className="relative bg-white text-airport-blue font-bold text-lg py-5 px-6 rounded-3xl shadow-2xl shadow-black/20 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform">
            <span className="text-2xl anim-bounce">📷</span>
            Scan an Item
          </div>
        </button>
      </div>

      {/* Bottom sheet with history */}
      <div className="flex-1 bg-airport-light rounded-t-3xl px-5 pt-6 pb-8 overflow-y-auto">
        {history.length > 0 ? (
          <>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Recent Scans
            </h2>
            <div className="space-y-2.5">
              {history.map((rec, i) => {
                const v = worst(rec.result.handBaggage.verdict, rec.result.checkedBaggage.verdict);
                return (
                  <button
                    key={rec.id}
                    onClick={() => viewHistoryItem(rec)}
                    className={`anim-fade-in-up anim-delay-${Math.min(i, 3) + 1} w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${dotColor[v]} bg-opacity-15 flex items-center justify-center`}>
                      <span className={`w-3 h-3 rounded-full ${dotColor[v]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{rec.categoryName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(rec.timestamp).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-10 anim-fade-in">
            <p className="text-4xl mb-3">✈️</p>
            <p className="text-sm font-medium text-slate-500">No scans yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Tap "Scan an Item" to check your first item
            </p>
          </div>
        )}

        <p className="text-[10px] text-slate-400 text-center mt-8 px-2 leading-relaxed">
          Rules apply to departures from Zurich Airport. Airlines may have stricter rules.
          Source:{' '}
          <a
            href="https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/what-is-allowed-in-your-bag"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            flughafen-zuerich.ch
          </a>
        </p>
      </div>
    </div>
  );
}
