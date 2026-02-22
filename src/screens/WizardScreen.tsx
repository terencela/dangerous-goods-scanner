import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { getCategoryById } from '../data/categories';
import { getQuestionsForCategory } from '../data/questions';

export default function WizardScreen() {
  const { goTo, session, setAnswers, computeResult } = useApp();
  const { t } = useI18n();
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
      <div className="min-h-full flex items-center justify-center bg-[#fafafa]">
        <p className="text-[#999] text-sm">{t('noQuestions')}</p>
      </div>
    );
  }

  const progress = ((step + 1) / qs.length) * 100;

  return (
    <div className="min-h-full flex flex-col bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e5e5] px-5 pt-14 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={back} className="text-sm text-[#999] font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('back')}
            </button>
            <span className="text-xs font-medium text-[#999]">{step + 1} / {qs.length}</span>
          </div>
          {/* Progress bar */}
          <div className="h-[2px] bg-[#e5e5e5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#171717] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full anim-fade-in" key={step}>
        {/* Contextual hint */}
        <div className="flex items-start gap-1.5 bg-[#ebf5ff] rounded-lg p-2.5 mb-5">
          <svg className="w-3 h-3 text-[#0070f3] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#666] leading-[17px]">{t('questionHint')}</p>
        </div>

        <h2 className="text-xl font-semibold text-[#0a0a0a] text-center mb-7 leading-7 tracking-[-0.3px]">
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
                className="w-full text-center text-3xl font-bold py-5 bg-white rounded-[10px] border border-[#e5e5e5] focus:border-[#171717] focus:outline-none transition-colors text-[#0a0a0a]"
              />
              {q.unit && (
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#999] font-medium text-sm">
                  {q.unit}
                </span>
              )}
            </div>

            {wh !== null && q.id === 'battery-voltage' && (
              <div className="mt-5 bg-white rounded-[10px] p-4 border border-[#e5e5e5] text-center anim-fade-in-up anim-delay-1">
                <p className="text-xs text-[#999] uppercase tracking-widest mb-1">{t('energy')}</p>
                <p className={`text-3xl font-extrabold ${
                  wh > 160 ? 'text-red-600' : wh > 100 ? 'text-amber-500' : 'text-emerald-600'
                }`}>
                  {wh.toFixed(1)} Wh
                </p>
              </div>
            )}
          </div>
        )}

        {/* Select options */}
        {q.type === 'select' && q.options && (
          <div className="space-y-2 max-w-sm mx-auto">
            {q.options.map((opt, i) => {
              const sel = val === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSel(q.id, opt.value)}
                  className={`anim-fade-in-up w-full p-3.5 rounded-[10px] border text-left transition-all flex items-center gap-3 ${
                    sel
                      ? 'border-[#171717] bg-[#f5f5f5]'
                      : 'border-[#e5e5e5] bg-white hover:border-[#ccc]'
                  }`}
                  style={{ animationDelay: `${(i + 1) * 0.06}s` }}
                >
                  <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${
                    sel ? 'border-[#171717] bg-[#171717]' : 'border-[#ccc]'
                  }`}>
                    {sel && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[13px] ${sel ? 'font-medium text-[#0a0a0a]' : 'text-[#666]'}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom */}
      <div className="px-5 pb-10 pt-3 border-t border-[#e5e5e5] bg-[#fafafa]">
        <div className="max-w-lg mx-auto">
          <button
            onClick={next}
            disabled={!ok}
            className={`w-full py-3.5 rounded-[10px] font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              ok
                ? 'bg-[#171717] text-white active:opacity-90'
                : 'bg-[#f2f2f2] text-[#999] cursor-not-allowed'
            }`}
          >
            {last ? t('showResult') : t('next')}
            <svg className={`w-4 h-4 ${ok ? 'text-white' : 'text-[#999]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={last ? 'M5 13l4 4L19 7' : 'M9 5l7 7-7 7'} />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
