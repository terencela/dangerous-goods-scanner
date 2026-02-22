import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { itemCategories, categoryGroups, getCategoryById } from '../data/categories';
import { getQuestionsForCategory } from '../data/questions';
import { classifyWithVision, type AiAnalysis } from '../utils/classifier';
import { getApiKey, hasApiKey } from '../utils/storage';

type Phase = 'analyzing' | 'detected' | 'error' | 'manual';

export default function IdentifyScreen() {
  const { goTo, session, selectCategory, computeResult, applyAiVerdict } = useApp();
  const [phase, setPhase] = useState<Phase>(() =>
    session.photoUrl && hasApiKey() ? 'analyzing' : 'manual'
  );
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [search, setSearch] = useState('');

  const runDetection = useCallback(async () => {
    if (!session.photoUrl) { setPhase('manual'); return; }
    const key = getApiKey();
    if (!key) { setPhase('manual'); return; }

    try {
      const result = await classifyWithVision(session.photoUrl, key);
      setAnalysis(result);

      if (result.error) {
        setPhase('error');
      } else if (result.identified && result.categoryId && result.categoryId !== 'unknown') {
        setPhase('detected');
      } else {
        setPhase('manual');
      }
    } catch {
      setPhase('manual');
    }
  }, [session.photoUrl]);

  useEffect(() => {
    if (phase === 'analyzing') runDetection();
  }, [phase, runDetection]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return itemCategories;
    return itemCategories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const g of categoryGroups) {
      const items = filtered.filter((c) => c.group === g);
      if (items.length > 0) m.set(g, items);
    }
    return m;
  }, [filtered]);

  const handleSelect = (id: string) => {
    selectCategory(id);
    const cat = getCategoryById(id);
    const qs = getQuestionsForCategory(id);
    if (cat?.skipWizard || qs.length === 0) {
      computeResult();
      goTo('result');
    } else {
      goTo('wizard');
    }
  };

  const handleAcceptAi = () => {
    if (!analysis) return;

    if (analysis.verdict) {
      applyAiVerdict(analysis);
      goTo('result');
    } else if (analysis.categoryId) {
      handleSelect(analysis.categoryId);
    }
  };

  /* ---- Analyzing ---- */
  if (phase === 'analyzing') {
    return (
      <div className="min-h-full flex flex-col bg-airport-light">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          {session.photoUrl && (
            <div className="relative w-48 h-48 rounded-3xl overflow-hidden shadow-xl mb-8">
              <img src={session.photoUrl} alt="Your item" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-airport-blue/10 to-airport-blue/30" />
              <div className="absolute inset-x-0 h-1 bg-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,.6)] anim-scan-line" />
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 border-[2.5px] border-slate-300 border-t-airport-blue rounded-full animate-spin" />
            <p className="text-base font-bold text-slate-700">Identifying your item…</p>
          </div>
          <p className="text-sm text-slate-400 text-center">
            Reading labels and applying airport rules
          </p>
        </div>
      </div>
    );
  }

  /* ---- Detected ---- */
  if (phase === 'detected' && analysis?.identified) {
    const cat = getCategoryById(analysis.categoryId || '');
    const hasVerdict = !!analysis.verdict;
    const props = analysis.detectedProperties;
    const hasProps = props && (props.mah || props.wh || props.volume_ml || props.blade_length_cm);

    return (
      <div className="min-h-full flex flex-col bg-airport-light">
        <div className="bg-white px-5 pt-14 pb-6 shadow-sm">
          <button onClick={() => goTo('camera')} className="text-sm text-slate-400 font-medium mb-5 block">
            ← Retake Photo
          </button>

          <div className="flex items-start gap-5 anim-fade-in-up">
            {session.photoUrl && (
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                <img src={session.photoUrl} alt="Item" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  analysis.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
                  analysis.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {analysis.confidence} confidence
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800 leading-snug">
                {cat?.icon} {analysis.itemName || cat?.name}
              </p>
              {analysis.summary && (
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{analysis.summary}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 overflow-y-auto">
          {/* Detected properties */}
          {hasProps && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4 anim-fade-in-up">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Detected from Label
              </p>
              <div className="grid grid-cols-2 gap-3">
                {props!.mah && (
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400">Capacity</p>
                    <p className="text-lg font-bold text-slate-800">{props!.mah.toLocaleString()} mAh</p>
                  </div>
                )}
                {props!.voltage && (
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400">Voltage</p>
                    <p className="text-lg font-bold text-slate-800">{props!.voltage} V</p>
                  </div>
                )}
                {props!.wh && (
                  <div className={`rounded-xl p-3 text-center col-span-2 ${
                    props!.wh > 160 ? 'bg-red-50' : props!.wh > 100 ? 'bg-amber-50' : 'bg-emerald-50'
                  }`}>
                    <p className="text-xs text-slate-400">Energy</p>
                    <p className={`text-2xl font-extrabold ${
                      props!.wh > 160 ? 'text-red-600' : props!.wh > 100 ? 'text-amber-500' : 'text-emerald-600'
                    }`}>
                      {props!.wh} Wh
                    </p>
                  </div>
                )}
                {props!.volume_ml && (
                  <div className={`rounded-xl p-3 text-center col-span-2 ${
                    props!.volume_ml > 100 ? 'bg-amber-50' : 'bg-emerald-50'
                  }`}>
                    <p className="text-xs text-slate-400">Volume</p>
                    <p className="text-2xl font-extrabold text-slate-800">{props!.volume_ml} ml</p>
                  </div>
                )}
                {props!.blade_length_cm && (
                  <div className={`rounded-xl p-3 text-center col-span-2 ${
                    props!.blade_length_cm >= 6 ? 'bg-red-50' : 'bg-emerald-50'
                  }`}>
                    <p className="text-xs text-slate-400">Blade Length</p>
                    <p className="text-2xl font-extrabold text-slate-800">{props!.blade_length_cm} cm</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verdict preview if available */}
          {hasVerdict && analysis.verdict && (
            <div className="space-y-2 mb-4 anim-fade-in-up anim-delay-1">
              {(['handBaggage', 'checkedBaggage'] as const).map((bag) => {
                const v = analysis.verdict![bag];
                const color = v.status === 'allowed' ? 'emerald' : v.status === 'conditional' ? 'amber' : 'red';
                return (
                  <div key={bag} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {bag === 'handBaggage' ? 'Hand Baggage' : 'Checked Baggage'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${color}-600 text-white`}>
                        {v.status === 'allowed' ? '✓ Allowed' : v.status === 'conditional' ? '⚠ Conditions' : '✕ Not Allowed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleAcceptAi}
            className="w-full bg-airport-blue text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.97] transition-transform anim-fade-in-up anim-delay-2"
          >
            {hasVerdict ? 'See Full Verdict →' : 'Yes, This Is Correct →'}
          </button>

          <button
            onClick={() => setPhase('manual')}
            className="w-full mt-4 text-center text-sm font-semibold text-airport-blue py-3 anim-fade-in-up anim-delay-3"
          >
            Not correct — select manually
          </button>
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (phase === 'error' && analysis?.error) {
    return (
      <div className="min-h-full flex flex-col bg-airport-light">
        <header className="bg-white shadow-sm px-5 pt-14 pb-5">
          <button onClick={() => goTo('camera')} className="text-sm text-slate-400 font-medium">← Back</button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-8 anim-fade-in">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-base font-bold text-slate-700 mb-2 text-center">Detection Failed</p>
          <p className="text-sm text-slate-400 text-center leading-relaxed mb-6 max-w-xs">{analysis.error}</p>
          <div className="flex gap-3 w-full max-w-xs">
            <button onClick={() => goTo('settings')} className="flex-1 bg-white text-slate-600 font-semibold py-3 rounded-xl border border-slate-200 text-sm">
              Settings
            </button>
            <button onClick={() => setPhase('manual')} className="flex-1 bg-airport-blue text-white font-semibold py-3 rounded-xl text-sm">
              Select Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Manual ---- */
  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      <header className="bg-white shadow-sm px-5 pt-14 pb-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => (session.photoUrl ? goTo('camera') : goTo('home'))}
            className="text-sm text-slate-400 font-medium mb-4 block"
          >
            ← Back
          </button>
          {session.photoUrl && (
            <div className="flex items-center gap-3 mb-4">
              <img src={session.photoUrl} alt="Item" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
              <p className="text-xs text-slate-400">Your captured item</p>
            </div>
          )}
          <h2 className="text-xl font-bold text-slate-800 mb-3">Select Item Type</h2>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-airport-blue/20 focus:border-airport-blue/40 transition-all"
            />
          </div>
        </div>
      </header>
      <main className="flex-1 px-5 py-4 max-w-lg mx-auto w-full overflow-y-auto">
        {grouped.size === 0 && (
          <p className="text-center text-slate-400 mt-10 text-sm">No matching items found.</p>
        )}
        {Array.from(grouped.entries()).map(([group, items]) => (
          <div key={group} className="mb-5">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{group}</h3>
            <div className="space-y-1.5">
              {items.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelect(cat.id)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md active:bg-slate-50 transition-all text-left"
                >
                  <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{cat.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
