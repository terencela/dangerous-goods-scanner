import { useApp } from '../context/AppContext';
import type { Verdict } from '../types';

const verdictColors: Record<Verdict, string> = {
  allowed: 'bg-green-500',
  conditional: 'bg-amber-500',
  not_allowed: 'bg-red-500',
};

function getWorstVerdict(hand: Verdict, checked: Verdict): Verdict {
  const rank: Record<Verdict, number> = { not_allowed: 0, conditional: 1, allowed: 2 };
  return rank[hand] <= rank[checked] ? hand : checked;
}

export default function HomeScreen() {
  const { goTo, resetSession, history, viewHistoryItem } = useApp();

  const handleStartScan = () => {
    resetSession();
    goTo('camera');
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="bg-airport-blue text-white px-6 pt-14 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-200 mb-1">
            Zurich Airport
          </p>
          <h1 className="text-2xl font-bold">Baggage Checker</h1>
          <p className="text-sm text-blue-200 mt-1">
            Check if your item is allowed in hand or checked baggage
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-6 max-w-lg mx-auto w-full">
        <button
          onClick={handleStartScan}
          className="w-full bg-airport-blue hover:bg-airport-blue/90 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <span className="text-2xl">📷</span>
          Scan an Item
        </button>

        {/* History */}
        {history.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
              Recent Scans
            </h2>
            <div className="space-y-2">
              {history.map((record) => {
                const worst = getWorstVerdict(
                  record.result.handBaggage.verdict,
                  record.result.checkedBaggage.verdict
                );
                return (
                  <button
                    key={record.id}
                    onClick={() => viewHistoryItem(record)}
                    className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left"
                  >
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${verdictColors[worst]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {record.categoryName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(record.timestamp).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="text-slate-300 text-lg">›</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center mt-8 px-4 leading-relaxed">
          Rules apply to departures from Zurich Airport only. Individual airlines may have
          stricter rules. Source:{' '}
          <a
            href="https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/what-is-allowed-in-your-bag"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            flughafen-zuerich.ch
          </a>
        </p>
      </main>
    </div>
  );
}
