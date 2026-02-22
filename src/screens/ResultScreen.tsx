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
  const ai = fromHistory ? selectedHistoryItem.aiAnalysis : session.aiAnalysis;
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
          <button onClick={() => goTo('home')} className="text-airport-blue font-semibold text-sm">Go Home</button>
        </div>
      </div>
    );
  }

  const newScan = () => { clearSelectedHistory(); resetSession(); goTo('camera'); };
  const home = () => { clearSelectedHistory(); resetSession(); goTo('home'); };

  const props = ai?.detectedProperties;
  const hasProps = props && (props.mah || props.wh || props.volume_ml || props.blade_length_cm);

  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      <header className="bg-white shadow-sm px-5 pt-14 pb-5">
        <div className="max-w-lg mx-auto">
          <button onClick={home} className="text-sm text-slate-400 font-medium mb-4 block">← Home</button>
          <div className="flex items-center gap-4 anim-fade-in">
            {photo && (
              <img src={photo} alt="Item" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm" />
            )}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Result</p>
              <h2 className="text-lg font-bold text-slate-800">
                {cat?.icon} {ai?.itemName || cat?.name || catId}
              </h2>
              {ai?.summary && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-[240px]">{ai.summary}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-5 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Detected properties from AI label reading */}
        {hasProps && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4 anim-fade-in-up">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Detected from Label
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {props!.mah && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase">Capacity</p>
                  <p className="text-base font-bold text-slate-800">{props!.mah.toLocaleString()} mAh</p>
                </div>
              )}
              {props!.voltage && (
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase">Voltage</p>
                  <p className="text-base font-bold text-slate-800">{props!.voltage} V</p>
                </div>
              )}
              {props!.wh && (
                <div className={`rounded-xl p-3 text-center col-span-2 ${
                  props!.wh > 160 ? 'bg-red-50' : props!.wh > 100 ? 'bg-amber-50' : 'bg-emerald-50'
                }`}>
                  <p className="text-[10px] text-slate-400 uppercase">Energy</p>
                  <p className={`text-2xl font-extrabold ${
                    props!.wh > 160 ? 'text-red-600' : props!.wh > 100 ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                    {props!.wh} Wh
                  </p>
                  {props!.mah && props!.voltage && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {props!.mah.toLocaleString()} mAh × {props!.voltage} V ÷ 1000
                    </p>
                  )}
                </div>
              )}
              {props!.volume_ml && (
                <div className={`rounded-xl p-3 text-center col-span-2 ${props!.volume_ml > 100 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <p className="text-[10px] text-slate-400 uppercase">Volume</p>
                  <p className="text-2xl font-extrabold text-slate-800">{props!.volume_ml} ml</p>
                </div>
              )}
              {props!.blade_length_cm && (
                <div className={`rounded-xl p-3 text-center col-span-2 ${props!.blade_length_cm >= 6 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <p className="text-[10px] text-slate-400 uppercase">Blade Length</p>
                  <p className="text-2xl font-extrabold text-slate-800">{props!.blade_length_cm} cm</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verdict cards */}
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

        {/* Lighter / matches note */}
        {(catId === 'lighter' || catId === 'matches') && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 anim-fade-in-up anim-delay-4">
            <div className="flex gap-2.5 items-start">
              <span className="text-lg mt-0.5">📌</span>
              <div>
                <p className="text-sm font-semibold text-blue-800">On Your Person</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  {catId === 'lighter'
                    ? 'You may carry exactly 1 lighter on your person (in your pocket). This is the only way to bring it through security.'
                    : 'You may carry 1 box of matches on your person. This is the only way to bring them through security.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Source attribution */}
        <p className="text-[10px] text-slate-400 text-center mt-6 px-4 leading-relaxed">
          Rules sourced from{' '}
          <a href="https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/what-is-allowed-in-your-bag" target="_blank" rel="noopener noreferrer" className="underline">
            flughafen-zuerich.ch
          </a>
        </p>

        {/* Actions */}
        <div className="mt-6 space-y-2.5 anim-fade-in-up anim-delay-4">
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
