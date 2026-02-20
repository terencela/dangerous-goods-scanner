import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryById } from '../data/categories';
import { getQuestionsForCategory } from '../data/questions';
import ProgressBar from '../components/ProgressBar';

export default function WizardScreen() {
  const { goTo, session, setAnswers, computeResult } = useApp();
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState<Record<string, string | number | boolean>>(() => ({
    ...session.answers,
  }));

  const category = useMemo(() => getCategoryById(session.categoryId || ''), [session.categoryId]);
  const qs = useMemo(() => getQuestionsForCategory(session.categoryId || ''), [session.categoryId]);
  const q = qs[step];
  const val = q ? local[q.id] : undefined;
  const last = step === qs.length - 1;

  const wh = useMemo(() => {
    if (session.categoryId !== 'batteries') return null;
    const m = Number(local['battery-mah']) || 0;
    const v = Number(local['battery-voltage']) || 0;
    return m > 0 && v > 0 ? (m * v) / 1000 : null;
  }, [local, session.categoryId]);

  const handleNum = useCallback((id: string, raw: string) => {
    setLocal((p) => ({ ...p, [id]: raw === '' ? '' : Number(raw) }));
  }, []);

  const handleSel = useCallback((id: string, v: string) => {
    setLocal((p) => ({ ...p, [id]: v }));
  }, []);

  const ok = val !== undefined && val !== '';

  const next = () => {
    if (!ok) return;
    if (last) {
      setAnswers(local);
      setTimeout(() => { computeResult(); goTo('result'); }, 0);
    } else {
      setStep((s) => s + 1);
    }
  };

  const back = () => (step > 0 ? setStep((s) => s - 1) : goTo('identify'));

  if (!category || !q) {
    return (
      <div className="min-h-full flex items-center justify-center bg-airport-light">
        <p className="text-slate-400 text-sm">No questions for this category.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 pt-14 pb-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={back} className="text-sm text-slate-400 font-medium">
              ← Back
            </button>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
              <span className="text-base">{category.icon}</span>
              <span className="text-xs font-semibold text-slate-600 max-w-[160px] truncate">{category.name}</span>
            </div>
          </div>
          <ProgressBar current={step} total={qs.length} />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full anim-fade-in" key={step}>
        {session.photoUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={session.photoUrl}
              alt="Item"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-800 text-center mb-8 leading-snug">
          {q.text}
        </h2>

        {/* Number input */}
        {q.type === 'number' && (
          <div className="max-w-xs mx-auto anim-fade-in-up">
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={val === undefined ? '' : String(val)}
                onChange={(e) => handleNum(q.id, e.target.value)}
                placeholder={q.placeholder}
                autoFocus
                className="w-full text-center text-3xl font-bold py-5 bg-white rounded-2xl border-2 border-slate-200 focus:border-airport-blue focus:outline-none transition-colors text-slate-800 shadow-sm"
              />
              {q.unit && (
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  {q.unit}
                </span>
              )}
            </div>

            {wh !== null && q.id === 'battery-voltage' && (
              <div className="mt-5 bg-white rounded-2xl p-4 border border-slate-200 text-center anim-fade-in-up anim-delay-1">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Energy</p>
                <p className={`text-3xl font-extrabold ${
                  wh > 160 ? 'text-red-600' : wh > 100 ? 'text-amber-500' : 'text-emerald-600'
                }`}>
                  {wh.toFixed(1)} Wh
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {Number(local['battery-mah'])} mAh × {Number(local['battery-voltage'])} V ÷ 1000
                </p>
              </div>
            )}
          </div>
        )}

        {/* Select options */}
        {q.type === 'select' && q.options && (
          <div className="space-y-2.5 max-w-sm mx-auto">
            {q.options.map((opt, i) => {
              const sel = val === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSel(q.id, opt.value)}
                  className={`anim-fade-in-up anim-delay-${Math.min(i, 3) + 1} w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    sel
                      ? 'border-airport-blue bg-airport-blue/5 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        sel ? 'border-airport-blue bg-airport-blue' : 'border-slate-300'
                      }`}
                    >
                      {sel && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${sel ? 'font-semibold text-airport-blue' : 'text-slate-700'}`}>
                      {opt.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom */}
      <div className="px-5 pb-10 pt-4 bg-airport-light">
        <div className="max-w-lg mx-auto">
          <button
            onClick={next}
            disabled={!ok}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
              ok
                ? 'bg-airport-blue text-white shadow-lg shadow-airport-blue/20 active:scale-[0.97]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {last ? 'Check Verdict →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
