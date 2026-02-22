import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { hasApiKey } from '../utils/storage';
import type { Verdict } from '../types';

function getStatusColor(v: Verdict) {
  if (v === 'allowed') return { dot: 'bg-emerald-500', bg: '#d1fae5' };
  if (v === 'conditional') return { dot: 'bg-amber-500', bg: '#fef3c7' };
  return { dot: 'bg-red-500', bg: '#fee2e2' };
}

function getStatusIcon(v: Verdict) {
  if (v === 'allowed') return '✓';
  if (v === 'conditional') return '⚠';
  return '✕';
}

function worst(a: Verdict, b: Verdict): Verdict {
  const r: Record<Verdict, number> = { not_allowed: 0, conditional: 1, allowed: 2 };
  return r[a] <= r[b] ? a : b;
}

export default function HomeScreen() {
  const { goTo, resetSession, history, viewHistoryItem, deleteHistoryItem } = useApp();
  const { t, lang, setLang } = useI18n();
  const keyConfigured = hasApiKey();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleStart = () => {
    resetSession();
    goTo('camera');
  };

  const handleDelete = (id: string) => {
    deleteHistoryItem(id);
    setDeleteId(null);
  };

  const showTutorial = history.length === 0;

  return (
    <div className="min-h-full flex flex-col bg-[#fafafa]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-2">
        <div>
          <h1 className="text-[19px] font-semibold text-[#0a0a0a] tracking-tight">{t('appName')}</h1>
          <p className="text-xs text-[#999] mt-0.5">{t('airportName')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'de' ? 'en' : lang === 'en' ? 'fr' : 'de')}
            className="px-2.5 py-1 rounded-md border border-[#e5e5e5] bg-white text-xs font-semibold text-[#666] tracking-wide hover:bg-[#f5f5f5] transition-colors"
          >
            {lang === 'de' ? 'EN' : lang === 'en' ? 'FR' : 'DE'}
          </button>
          <button
            onClick={() => goTo('settings')}
            className="w-9 h-9 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
            aria-label="Settings"
          >
            <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scan CTA */}
      <div className="px-5 pt-4 anim-fade-in-up">
        <button
          onClick={handleStart}
          className="w-full bg-[#171717] rounded-xl p-4 flex items-center gap-3.5 active:opacity-90 transition-opacity"
        >
          <div className="w-11 h-11 rounded-[10px] bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] font-semibold text-white">{t('scan')}</p>
            <p className="text-xs text-white/55 leading-4 mt-0.5">{t('scanDesc')}</p>
          </div>
          <svg className="w-[18px] h-[18px] text-white/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Chatbot CTA */}
      <div className="px-5 pt-3 anim-fade-in-up">
        <button
          onClick={() => goTo('chat')}
          className="w-full bg-white border border-[#e5e5e5] rounded-xl p-3.5 flex items-center gap-3 hover:bg-[#f5f5f5] transition-colors"
        >
          <div className="w-10 h-10 rounded-[10px] bg-[#f2f2f2] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-semibold text-[#0a0a0a]">{t('chatMode')}</p>
            <p className="text-xs text-[#999] mt-0.5">{t('chatModeDesc')}</p>
          </div>
          <svg className="w-[18px] h-[18px] text-[#ccc] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-1.5 px-5 pt-3 pb-1">
        <svg className="w-[11px] h-[11px] text-[#999] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[11px] text-[#999] leading-[15px]">{t('infoNote')}</p>
      </div>

      {/* API key banner */}
      {!keyConfigured && (
        <div className="px-5 pt-3 anim-fade-in-up">
          <button
            onClick={() => goTo('settings')}
            className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3 text-left hover:bg-amber-100/50 transition-colors"
          >
            <span className="text-xl">🔑</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0a0a0a]">{t('setupAi')}</p>
              <p className="text-xs text-[#999] mt-0.5">{t('setupAiDesc')}</p>
            </div>
            <svg className="w-4 h-4 text-[#ccc] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Tutorial card */}
      {showTutorial && (
        <div className="px-5 pt-4 anim-fade-in-up anim-delay-1">
          <div className="bg-[#ebf5ff] rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <svg className="w-[13px] h-[13px] text-[#0070f3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[13px] font-semibold text-[#0070f3]">{t('howItWorks')}</span>
            </div>
            {[
              { num: '1', title: t('step1Title'), desc: t('step1Desc') },
              { num: '2', title: t('step2Title'), desc: t('step2Desc') },
              { num: '3', title: t('step3Title'), desc: t('step3Desc') },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-2.5 mb-3 last:mb-0">
                <div className="w-[22px] h-[22px] rounded-full bg-[#0070f3] flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-white">{step.num}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#0a0a0a]">{step.title}</p>
                  <p className="text-xs text-[#666] leading-4">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="flex items-center gap-1.5 px-5 mt-7 mb-1">
        <h2 className="text-[11px] font-semibold text-[#999] uppercase tracking-[1px]">{t('history')}</h2>
        {history.length > 0 && (
          <span className="text-[11px] text-[#999]">{history.length}</span>
        )}
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {history.length > 0 ? (
          <div>
            {history.map((rec) => {
              const hbStatus = rec.result.handBaggage.verdict;
              const cbStatus = rec.result.checkedBaggage.verdict;
              const overall = worst(hbStatus, cbStatus);
              const color = getStatusColor(overall);
              return (
                <div key={rec.id} className="relative">
                  <button
                    onClick={() => viewHistoryItem(rec)}
                    className="w-full flex items-center gap-2.5 py-2.5 text-left hover:bg-[#f2f2f2] rounded-lg transition-colors px-1"
                  >
                    <div className="w-[34px] h-[34px] rounded-lg bg-[#f2f2f2] flex items-center justify-center flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0a0a0a] truncate">{rec.categoryName}</p>
                      <p className="text-[11px] text-[#999] mt-0.5">
                        {new Date(rec.timestamp).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 mr-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-medium text-[#999]">{t('handBaggageShort')}</span>
                        <span className={`text-[11px] ${hbStatus === 'allowed' ? 'text-emerald-600' : hbStatus === 'conditional' ? 'text-amber-600' : 'text-red-600'}`}>
                          {getStatusIcon(hbStatus)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-medium text-[#999]">{t('checkedBaggageShort')}</span>
                        <span className={`text-[11px] ${cbStatus === 'allowed' ? 'text-emerald-600' : cbStatus === 'conditional' ? 'text-amber-600' : 'text-red-600'}`}>
                          {getStatusIcon(cbStatus)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(rec.id); }}
                      className="p-1.5 rounded-md hover:bg-[#e5e5e5] transition-colors flex-shrink-0"
                      aria-label="Delete"
                    >
                      <svg className="w-3.5 h-3.5 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </button>
                  {rec.id !== history[history.length - 1]?.id && (
                    <div className="h-px bg-[#ebebeb] ml-11" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 anim-fade-in">
            <svg className="w-5 h-5 text-[#e5e5e5] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[13px] font-medium text-[#666]">{t('noHistory')}</p>
            <p className="text-xs text-[#999] mt-0.5">{t('noHistoryDesc')}</p>
          </div>
        )}

        <p className="text-[10px] text-[#999] text-center mt-6 px-2 leading-relaxed">
          {t('source')}
        </p>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-5 mx-8 max-w-xs w-full shadow-2xl anim-fade-in" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-[#0a0a0a] mb-4 text-center">{t('deleteConfirm')}</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#e5e5e5] text-sm font-medium text-[#666]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
