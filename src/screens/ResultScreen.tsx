import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { getCategoryById } from '../data/categories';
import type { Verdict } from '../types';

function getStatusConfig(status: Verdict, t: (k: any) => string) {
  switch (status) {
    case 'allowed': return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✓', label: t('allowed') };
    case 'conditional': return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠', label: t('conditional') };
    case 'not_allowed': return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: '✕', label: t('notAllowed') };
  }
}

function VerdictCard({ title, status, text, tip, explain, t, delay }: {
  title: string; status: Verdict; text: string; tip?: string; explain: string; t: (k: any) => string; delay: number;
}) {
  const cfg = getStatusConfig(status, t);
  const delayClass = delay === 1 ? 'anim-delay-1' : delay === 2 ? 'anim-delay-2' : '';

  return (
    <div className={`anim-fade-in-up ${delayClass} bg-white rounded-[10px] border border-[#e5e5e5] p-3.5`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-[#999] uppercase tracking-[0.5px]">{title}</h3>
          <p className="text-[11px] text-[#999] leading-[15px] mt-0.5">{explain}</p>
        </div>
        <span className={`${cfg.bg} ${cfg.color} text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1`}>
          <span className="text-xs">{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>
      <p className="text-[13px] text-[#0a0a0a] leading-[19px]">{text}</p>
      {tip && (
        <div className="mt-2 pt-2 border-t border-[#ebebeb] flex items-start gap-1.5">
          <svg className="w-[11px] h-[11px] text-[#999] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] text-[#999] leading-4">{tip}</p>
        </div>
      )}
    </div>
  );
}

export default function ResultScreen() {
  const { goTo, session, resetSession, saveCurrentScan, selectedHistoryItem, clearSelectedHistory } = useApp();
  const { t } = useI18n();
  const savedRef = useRef(false);

  const fromHistory = !!selectedHistoryItem;
  const result = fromHistory ? selectedHistoryItem.result : session.result;
  const catId = fromHistory ? selectedHistoryItem.categoryId : session.categoryId;
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
      <div className="min-h-full flex items-center justify-center bg-[#fafafa]">
        <p className="text-[13px] text-[#999]">{t('loading')}</p>
      </div>
    );
  }

  const newScan = () => { clearSelectedHistory(); resetSession(); goTo('camera'); };
  const home = () => { clearSelectedHistory(); resetSession(); goTo('home'); };

  const overall: Verdict = result.handBaggage.verdict === 'not_allowed' || result.checkedBaggage.verdict === 'not_allowed'
    ? 'not_allowed'
    : result.handBaggage.verdict === 'conditional' || result.checkedBaggage.verdict === 'conditional'
    ? 'conditional' : 'allowed';
  const overallCfg = getStatusConfig(overall, t);
  const catName = ai?.itemName || cat?.name || catId || '';
  const overallExplain = overall === 'allowed' ? t('verdictExplainAllowed')
    : overall === 'conditional' ? t('verdictExplainConditional')
    : t('verdictExplainNotAllowed');

  const props = ai?.detectedProperties;
  const hasProps = props && (props.mah || props.wh || props.volume_ml || props.blade_length_cm);

  return (
    <div className="min-h-full flex flex-col bg-[#fafafa]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-14 pb-2">
        <div className="w-9" />
        <span className="text-[15px] font-semibold text-[#0a0a0a]">{t('result')}</span>
        <button onClick={home} className="w-9 h-9 rounded-full flex items-center justify-center">
          <svg className="w-[18px] h-[18px] text-[#0a0a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-5 overflow-y-auto pb-8">
        {/* Hero */}
        <div className="text-center py-5 anim-fade-in">
          <div className={`w-[60px] h-[60px] rounded-full ${overallCfg.bg} border-[1.5px] ${overallCfg.border} flex items-center justify-center mx-auto mb-3`}>
            <span className={`text-[28px] ${overallCfg.color}`}>{overallCfg.icon}</span>
          </div>
          <h2 className="text-[17px] font-semibold text-[#0a0a0a] text-center">{catName}</h2>
          <p className={`text-[13px] font-medium text-center leading-[18px] mt-1 ${overallCfg.color}`}>{overallExplain}</p>
        </div>

        {/* What does this mean */}
        <div className="flex items-center gap-1.5 bg-[#ebf5ff] rounded-lg p-2.5 mb-3.5 anim-fade-in-up">
          <svg className="w-[13px] h-[13px] text-[#0070f3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-[13px] font-semibold text-[#0070f3]">{t('whatToDo')}</span>
        </div>

        {/* Verdict cards */}
        <div className="space-y-3">
          <VerdictCard
            title={t('handBaggage')}
            status={result.handBaggage.verdict}
            text={result.handBaggage.message}
            tip={result.handBaggage.tip}
            explain={t('handBaggageExplain')}
            t={t}
            delay={1}
          />
          <VerdictCard
            title={t('checkedBaggage')}
            status={result.checkedBaggage.verdict}
            text={result.checkedBaggage.message}
            tip={result.checkedBaggage.tip}
            explain={t('checkedBaggageExplain')}
            t={t}
            delay={2}
          />
        </div>

        {/* Detected properties from AI */}
        {hasProps && (
          <div className="bg-white rounded-[10px] border border-[#e5e5e5] p-4 mt-3.5 anim-fade-in-up anim-delay-3">
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-3">{t('detectedFromLabel')}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {props!.mah && (
                <div className="bg-[#f2f2f2] rounded-lg p-3 text-center">
                  <p className="text-[10px] text-[#999] uppercase">{t('capacity')}</p>
                  <p className="text-base font-bold text-[#0a0a0a]">{props!.mah.toLocaleString()} mAh</p>
                </div>
              )}
              {props!.voltage && (
                <div className="bg-[#f2f2f2] rounded-lg p-3 text-center">
                  <p className="text-[10px] text-[#999] uppercase">{t('voltage')}</p>
                  <p className="text-base font-bold text-[#0a0a0a]">{props!.voltage} V</p>
                </div>
              )}
              {props!.wh && (
                <div className={`rounded-lg p-3 text-center col-span-2 ${
                  props!.wh > 160 ? 'bg-red-50' : props!.wh > 100 ? 'bg-amber-50' : 'bg-emerald-50'
                }`}>
                  <p className="text-[10px] text-[#999] uppercase">{t('energy')}</p>
                  <p className={`text-2xl font-extrabold ${
                    props!.wh > 160 ? 'text-red-600' : props!.wh > 100 ? 'text-amber-500' : 'text-emerald-600'
                  }`}>{props!.wh} Wh</p>
                  {props!.mah && props!.voltage && (
                    <p className="text-[10px] text-[#999] mt-0.5">
                      {props!.mah.toLocaleString()} mAh x {props!.voltage} V / 1000
                    </p>
                  )}
                </div>
              )}
              {props!.volume_ml && (
                <div className={`rounded-lg p-3 text-center col-span-2 ${props!.volume_ml > 100 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <p className="text-[10px] text-[#999] uppercase">{t('volume')}</p>
                  <p className="text-2xl font-extrabold text-[#0a0a0a]">{props!.volume_ml} ml</p>
                </div>
              )}
              {props!.blade_length_cm && (
                <div className={`rounded-lg p-3 text-center col-span-2 ${props!.blade_length_cm >= 6 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <p className="text-[10px] text-[#999] uppercase">{t('bladeLength')}</p>
                  <p className="text-2xl font-extrabold text-[#0a0a0a]">{props!.blade_length_cm} cm</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lighter / matches note */}
        {(catId === 'lighter' || catId === 'matches') && (
          <div className="mt-3.5 bg-blue-50 border border-blue-200 rounded-[10px] p-3.5 anim-fade-in-up anim-delay-4">
            <div className="flex gap-2 items-start">
              <span className="text-sm mt-0.5">📌</span>
              <div>
                <p className="text-sm font-semibold text-blue-800">{t('onYourPerson')}</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  {catId === 'lighter' ? t('onYourPersonLighter') : t('onYourPersonMatches')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Source */}
        <p className="text-[10px] text-[#999] text-center mt-5 px-4 leading-relaxed">
          {t('source')}
        </p>

        {/* Actions */}
        <div className="mt-5 space-y-2.5 anim-fade-in-up anim-delay-4">
          <button
            onClick={newScan}
            className="w-full bg-[#171717] text-white font-semibold py-3.5 rounded-[10px] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('scanAnother')}
          </button>
          <button
            onClick={home}
            className="w-full bg-white text-[#666] font-medium py-3 rounded-[10px] border border-[#e5e5e5]"
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
