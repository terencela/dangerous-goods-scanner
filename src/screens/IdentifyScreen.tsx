import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { itemCategories, categoryGroups, getCategoryById } from '../data/categories';
import { getQuestionsForCategory } from '../data/questions';
import { classifyWithVision, type AiExtraction } from '../utils/classifier';
import { canSkipWizardWithExtraction } from '../utils/extractionToAnswers';
import { getApiKey, hasApiKey } from '../utils/storage';

type Phase = 'analyzing' | 'detected' | 'error' | 'manual';

function ProgressStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
        done ? 'bg-emerald-500' : active ? 'bg-[#0070f3]' : 'bg-[#e5e5e5]'
      }`}>
        {done ? (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : active ? (
          <div className="w-2 h-2 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
        ) : null}
      </div>
      <span className={`text-[13px] ${active || done ? 'text-[#0a0a0a] font-medium' : 'text-[#999]'}`}>
        {label}
      </span>
    </div>
  );
}

export default function IdentifyScreen() {
  const { goTo, session, selectCategory, applyExtraction, computeResult, setAiAnalysis } = useApp();
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>(() =>
    session.photoUrl && hasApiKey() ? 'analyzing' : 'manual'
  );
  const [analysis, setAnalysis] = useState<AiExtraction | null>(null);
  const [search, setSearch] = useState('');
  const [progressIdx, setProgressIdx] = useState(0);

  const runDetection = useCallback(async () => {
    if (!session.photoUrl) { setPhase('manual'); return; }
    const key = getApiKey();
    if (!key) { setPhase('manual'); return; }

    setProgressIdx(0);
    const timer = setInterval(() => {
      setProgressIdx(prev => Math.min(prev + 1, 2));
    }, 2200);

    try {
      // Step 1: AI extracts facts only — never a verdict
      const result = await classifyWithVision(session.photoUrl, key);
      clearInterval(timer);
      setProgressIdx(3);
      setAnalysis(result);

      if (result.error) {
        setPhase('error');
      } else if (result.identified && result.categoryId) {
        setPhase('detected');
      } else {
        setPhase('manual');
      }
    } catch {
      clearInterval(timer);
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

  /**
   * SAFE ACCEPT PATH:
   * - If AI detected with sufficient data → applyExtraction (deterministic rules engine decides verdict)
   * - If AI detected but data is missing → route to wizard
   * - AI NEVER decides the verdict
   */
  const handleAcceptAi = () => {
    if (!analysis || !analysis.categoryId) return;
    const catId = analysis.categoryId;

    // Store AI extraction in session for display purposes
    setAiAnalysis(analysis);
    selectCategory(catId);

    if (canSkipWizardWithExtraction(catId, analysis)) {
      // Convert AI extraction to answers + run deterministic rules
      // applyExtraction does this atomically and returns the result
      applyExtraction(catId, analysis);
      goTo('result');
    } else {
      // Need wizard to fill in missing critical data (e.g. couldn't read Wh from label)
      // The wizard will collect answers and evaluateRules will decide
      goTo('wizard');
    }
  };

  const handleRetry = () => {
    setPhase('analyzing');
    setAnalysis(null);
    setProgressIdx(0);
  };

  /* ─── Analyzing ─── */
  if (phase === 'analyzing') {
    const steps = [t('analyzingStep1'), t('analyzingStep2'), t('analyzingStep3')];

    return (
      <div className="min-h-full flex flex-col bg-[#fafafa]">
        <div className="flex items-center justify-between px-4 pt-14 pb-2">
          <button onClick={() => goTo('camera')} className="w-9 h-9 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold text-[#0a0a0a]">{t('aiAnalysis')}</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 px-5 pt-4">
          {session.photoUrl && (
            <div className="w-full h-52 rounded-xl overflow-hidden bg-[#f2f2f2] mb-4 relative">
              <img src={session.photoUrl} alt="Your item" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-[120px] h-[120px] relative anim-pulse-frame">
                  {[
                    'top-0 left-0 border-t-2 border-l-2 rounded-tl-md',
                    'top-0 right-0 border-t-2 border-r-2 rounded-tr-md',
                    'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md',
                    'bottom-0 right-0 border-b-2 border-r-2 rounded-br-md',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute ${cls} border-white w-6 h-6`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 py-1">
            {steps.map((label, i) => (
              <ProgressStep key={i} label={label} active={progressIdx === i} done={progressIdx > i} />
            ))}
          </div>

          <div className="flex items-start gap-1.5 bg-[#ebf5ff] rounded-lg p-2.5 mt-4">
            <svg className="w-[11px] h-[11px] text-[#0070f3] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-[11px] text-[#666] leading-4">{t('analyzingHint')}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Detected ─── */
  if (phase === 'detected' && analysis?.identified) {
    const cat = getCategoryById(analysis.categoryId || '');
    const props = analysis.detectedProperties;
    const hasProps = props && (props.mah || props.wh || props.volume_ml || props.blade_length_cm);
    const confColor = analysis.confidence === 'high' ? 'text-emerald-600' : analysis.confidence === 'medium' ? 'text-amber-600' : 'text-[#999]';
    const confDotColor = analysis.confidence === 'high' ? 'bg-emerald-500' : analysis.confidence === 'medium' ? 'bg-amber-500' : 'bg-[#999]';
    const confLabel = analysis.confidence === 'high' ? t('highConfidence') : analysis.confidence === 'medium' ? t('medConfidence') : t('lowConfidence');

    const willSkipWizard = canSkipWizardWithExtraction(analysis.categoryId || '', analysis);

    return (
      <div className="min-h-full flex flex-col bg-[#fafafa]">
        <div className="flex items-center justify-between px-4 pt-14 pb-2">
          <button onClick={() => goTo('camera')} className="w-9 h-9 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold text-[#0a0a0a]">{t('aiAnalysis')}</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 px-5 pt-2 overflow-y-auto pb-6">
          {/* Item card */}
          <div className="bg-white rounded-[10px] border border-[#e5e5e5] p-4 mb-4 anim-fade-in-up">
            <div className="mb-1">
              <p className="text-base font-semibold text-[#0a0a0a]">{analysis.itemName || cat?.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${confDotColor}`} />
                <span className={`text-[11px] font-medium ${confColor}`}>{confLabel}</span>
                {analysis.confidence === 'low' && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">
                    → verify manually
                  </span>
                )}
              </div>
            </div>

            {/* Missing data warning */}
            {analysis.missingCriticalData && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 rounded-lg p-2.5">
                <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-[11px] text-amber-700 leading-4">
                  Couldn't read all required data from the label. You'll need to answer one question.
                </p>
              </div>
            )}

            {analysis.summary && (
              <p className="text-xs text-[#666] leading-[17px] mt-3">{analysis.summary}</p>
            )}
          </div>

          {/* Detected properties */}
          {hasProps && (
            <div className="bg-white rounded-[10px] border border-[#e5e5e5] p-4 mb-4 anim-fade-in-up anim-delay-1">
              <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-3">{t('detectedFromLabel')}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {props!.mah && (
                  <div className="bg-[#f2f2f2] rounded-lg p-3 text-center">
                    <p className="text-[10px] text-[#999]">{t('capacity')}</p>
                    <p className="text-base font-bold text-[#0a0a0a]">{props!.mah.toLocaleString()} mAh</p>
                  </div>
                )}
                {props!.voltage && (
                  <div className="bg-[#f2f2f2] rounded-lg p-3 text-center">
                    <p className="text-[10px] text-[#999]">{t('voltage')}</p>
                    <p className="text-base font-bold text-[#0a0a0a]">{props!.voltage} V</p>
                  </div>
                )}
                {props!.wh && (
                  <div className={`rounded-lg p-3 text-center col-span-2 ${
                    props!.wh > 160 ? 'bg-red-50' : props!.wh > 100 ? 'bg-amber-50' : 'bg-emerald-50'
                  }`}>
                    <p className="text-[10px] text-[#999]">{t('energy')}</p>
                    <p className={`text-2xl font-extrabold ${
                      props!.wh > 160 ? 'text-red-600' : props!.wh > 100 ? 'text-amber-500' : 'text-emerald-600'
                    }`}>{props!.wh} Wh</p>
                    {props!.mah && props!.voltage && (
                      <p className="text-[10px] text-[#999] mt-0.5">
                        {props!.mah.toLocaleString()} mAh × {props!.voltage} V ÷ 1000
                      </p>
                    )}
                  </div>
                )}
                {props!.volume_ml && (
                  <div className={`rounded-lg p-3 text-center col-span-2 ${props!.volume_ml > 100 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    <p className="text-[10px] text-[#999]">{t('volume')}</p>
                    <p className="text-2xl font-extrabold text-[#0a0a0a]">{props!.volume_ml} ml</p>
                  </div>
                )}
                {props!.blade_length_cm && (
                  <div className={`rounded-lg p-3 text-center col-span-2 ${props!.blade_length_cm >= 6 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <p className="text-[10px] text-[#999]">{t('bladeLength')}</p>
                    <p className="text-2xl font-extrabold text-[#0a0a0a]">{props!.blade_length_cm} cm</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Safety note */}
          <div className="flex items-start gap-1.5 bg-[#f2f2f2] rounded-lg p-2.5 mb-4">
            <svg className="w-[11px] h-[11px] text-[#999] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-[10px] text-[#999] leading-4">
              {willSkipWizard
                ? 'Verdict will be computed using official Zurich Airport rules applied to the detected values above.'
                : 'We need one more answer to determine the exact rule. The rules engine, not AI, decides the verdict.'}
            </p>
          </div>

          <button
            onClick={handleAcceptAi}
            className="w-full bg-[#171717] text-white font-semibold py-3.5 rounded-[10px] flex items-center justify-center gap-2 anim-fade-in-up anim-delay-2"
          >
            {willSkipWizard ? t('seeVerdict') : t('yesCorrect')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setPhase('manual')}
            className="w-full mt-3 text-center text-[13px] font-medium text-[#666] py-2.5"
          >
            {t('notCorrect')}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (phase === 'error') {
    return (
      <div className="min-h-full flex flex-col bg-[#fafafa]">
        <div className="flex items-center justify-between px-4 pt-14 pb-2">
          <button onClick={() => goTo('camera')} className="w-9 h-9 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold text-[#0a0a0a]">{t('aiAnalysis')}</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 anim-fade-in">
          <svg className="w-5 h-5 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-[15px] font-semibold text-[#0a0a0a] mb-1">{t('analysisFailed')}</p>
          <p className="text-xs text-[#999] text-center leading-[17px] mb-6 max-w-xs">{analysis?.error || ''}</p>
          <div className="flex gap-2.5 w-full max-w-xs">
            <button
              onClick={() => setPhase('manual')}
              className="flex-1 flex items-center justify-center gap-2 bg-[#171717] text-white font-semibold py-3 rounded-[10px] text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {t('selectManually')}
            </button>
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 bg-white border border-[#e5e5e5] text-[#666] font-medium py-3 px-4 rounded-[10px] text-sm"
            >
              <svg className="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Manual ─── */
  return (
    <div className="min-h-full flex flex-col bg-[#fafafa]">
      <div className="bg-white border-b border-[#e5e5e5] px-5 pt-14 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => (session.photoUrl ? goTo('camera') : goTo('home'))}
              className="text-sm text-[#999] font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('back')}
            </button>
          </div>
          {session.photoUrl && (
            <div className="flex items-center gap-3 mb-3 p-2 bg-[#fafafa] border border-[#e5e5e5] rounded-lg">
              <img src={session.photoUrl} alt="Item" className="w-9 h-9 rounded-md object-cover" />
              <p className="text-xs text-[#666]">{t('yourPhoto')}</p>
            </div>
          )}

          <div className="flex items-start gap-1.5 bg-[#ebf5ff] rounded-lg p-2.5 mb-3">
            <svg className="w-3 h-3 text-[#0070f3] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-[#666] leading-[17px]">{t('categoryHint')}</p>
          </div>

          <h2 className="text-base font-semibold text-[#0a0a0a] mb-3">{t('selectCategory')}</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white border border-[#e5e5e5] text-sm text-[#0a0a0a] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]/40 transition-all"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 px-5 py-3 max-w-lg mx-auto w-full overflow-y-auto pb-8">
        {grouped.size === 0 && (
          <div className="text-center py-8">
            <svg className="w-5 h-5 text-[#e5e5e5] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-[13px] text-[#999]">{t('noResults')}</p>
          </div>
        )}
        {Array.from(grouped.entries()).map(([group, items]) => {
          const isProhibited = group === 'Always Prohibited';
          return (
            <div key={group} className="mb-4">
              <h3 className="text-[11px] font-semibold text-[#999] uppercase tracking-[0.8px] mb-1 px-1">{group}</h3>
              <div>
                {items.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelect(cat.id)}
                    className="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-lg hover:bg-[#f2f2f2] transition-colors text-left"
                  >
                    <div className={`w-[30px] h-[30px] rounded-md flex items-center justify-center flex-shrink-0 ${
                      isProhibited ? 'bg-red-50' : 'bg-[#f2f2f2]'
                    }`}>
                      <span className="text-sm">{cat.icon}</span>
                    </div>
                    <span className={`flex-1 text-[13px] font-medium ${isProhibited ? 'text-red-600' : 'text-[#0a0a0a]'} leading-[18px]`}>
                      {cat.name}
                    </span>
                    {cat.skipWizard && !isProhibited && (
                      <span className="text-[9px] font-semibold text-[#999] uppercase tracking-wide bg-[#f2f2f2] px-1.5 py-0.5 rounded">
                        {t('direct')}
                      </span>
                    )}
                    <svg className="w-3.5 h-3.5 text-[#e5e5e5] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
