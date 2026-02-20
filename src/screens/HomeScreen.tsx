import { useApp } from '../context/AppContext';
import { hasApiKey } from '../utils/storage';
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
  const keyConfigured = hasApiKey();

  const handleStart = () => {
    resetSession();
    goTo('camera');
  };

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-b from-airport-blue via-airport-blue to-slate-900">
      {/* Header row with settings */}
      <div className="flex justify-end px-5 pt-12">
        <button
          onClick={() => goTo('settings')}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          aria-label="Settings"
        >
          <svg className="w-[18px] h-[18px] text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Hero */}
      <div className="flex-shrink-0 px-6 pt-2 pb-8 text-center anim-fade-in">
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

      {/* API key banner */}
      {!keyConfigured && (
        <div className="px-6 pb-4 anim-fade-in-up">
          <button
            onClick={() => goTo('settings')}
            className="w-full bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 text-left rounded-2xl px-5 py-4 flex items-center gap-4"
          >
            <span className="text-2xl">🔑</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Set Up AI Detection</p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Add your OpenAI API key to enable automatic item identification
              </p>
            </div>
            <svg className="w-5 h-5 text-amber-200/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Scan button */}
      <div className="px-6 pb-8 anim-fade-in-up">
        <button
          onClick={handleStart}
          className="w-full bg-white text-airport-blue font-bold text-lg py-5 px-6 rounded-3xl shadow-2xl shadow-black/20 flex items-center justify-center gap-3 active:scale-[0.97] transition-transform"
        >
          <span className="text-2xl">📷</span>
          Scan an Item
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
              {history.map((rec) => {
                const v = worst(rec.result.handBaggage.verdict, rec.result.checkedBaggage.verdict);
                return (
                  <button
                    key={rec.id}
                    onClick={() => viewHistoryItem(rec)}
                    className="anim-fade-in-up w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${dotColor[v] === 'bg-emerald-500' ? '#d1fae5' : dotColor[v] === 'bg-amber-500' ? '#fef3c7' : '#fee2e2'}` }}>
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
