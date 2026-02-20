import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { itemCategories, categoryGroups, getCategoryById } from '../data/categories';
import { getQuestionsForCategory } from '../data/questions';
import { classifyWithVision, type DetectionResult } from '../utils/classifier';
import { getApiKey, hasApiKey } from '../utils/storage';

type Phase = 'analyzing' | 'detected' | 'error' | 'manual';

export default function IdentifyScreen() {
  const { goTo, session, selectCategory, computeResult } = useApp();
  const [phase, setPhase] = useState<Phase>(() => {
    if (session.photoUrl && hasApiKey()) return 'analyzing';
    return 'manual';
  });
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [search, setSearch] = useState('');

  const runDetection = useCallback(async () => {
    if (!session.photoUrl) { setPhase('manual'); return; }
    const key = getApiKey();
    if (!key) { setPhase('manual'); return; }

    try {
      const result = await classifyWithVision(session.photoUrl, key);
      setDetection(result);

      if (result.error) {
        setPhase('error');
      } else if (result.category && result.confidence > 0.3) {
        setPhase('detected');
      } else {
        setPhase('manual');
      }
    } catch {
      setPhase('manual');
    }
  }, [session.photoUrl]);

  useEffect(() => {
    if (phase === 'analyzing') {
      runDetection();
    }
  }, [phase, runDetection]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return itemCategories;
    return itemCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q)
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
            GPT-4o Vision is analyzing the photo
          </p>
        </div>
      </div>
    );
  }

  /* ---- Detected ---- */
  if (phase === 'detected' && detection?.category) {
    const cat = detection.category;
    const pct = Math.round(detection.confidence * 100);

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
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                Detected
              </p>
              <p className="text-lg font-bold text-slate-800 leading-snug">
                {cat.icon} {cat.name}
              </p>
              {detection.itemName && (
                <p className="text-xs text-slate-400 mt-1">{detection.itemName}</p>
              )}
              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-400">{pct}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 overflow-y-auto">
          <button
            onClick={() => handleSelect(cat.id)}
            className="w-full bg-airport-blue text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.97] transition-transform anim-fade-in-up"
          >
            Yes, This Is Correct →
          </button>

          <button
            onClick={() => setPhase('manual')}
            className="w-full mt-4 text-center text-sm font-semibold text-airport-blue py-3 anim-fade-in-up anim-delay-1"
          >
            Not correct — select manually
          </button>
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (phase === 'error' && detection?.error) {
    return (
      <div className="min-h-full flex flex-col bg-airport-light">
        <header className="bg-white shadow-sm px-5 pt-14 pb-5">
          <div className="max-w-lg mx-auto">
            <button onClick={() => goTo('camera')} className="text-sm text-slate-400 font-medium mb-3 block">
              ← Back
            </button>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-8 anim-fade-in">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-base font-bold text-slate-700 mb-2 text-center">Detection Failed</p>
          <p className="text-sm text-slate-400 text-center leading-relaxed mb-6 max-w-xs">
            {detection.error}
          </p>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={() => goTo('settings')}
              className="flex-1 bg-white text-slate-600 font-semibold py-3 rounded-xl border border-slate-200 text-sm"
            >
              Settings
            </button>
            <button
              onClick={() => setPhase('manual')}
              className="flex-1 bg-airport-blue text-white font-semibold py-3 rounded-xl text-sm"
            >
              Select Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Manual Selection ---- */
  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      <header className="bg-white shadow-sm px-5 pt-14 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => (session.photoUrl ? goTo('camera') : goTo('home'))}
              className="text-sm text-slate-400 font-medium"
            >
              ← Back
            </button>
          </div>

          {session.photoUrl && (
            <div className="flex items-center gap-3 mb-4">
              <img
                src={session.photoUrl}
                alt="Item"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
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
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
              {group}
            </h3>
            <div className="space-y-1.5">
              {items.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelect(cat.id)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md active:bg-slate-50 transition-all text-left"
                >
                  <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {cat.icon}
                  </div>
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
