import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { getApiKey, setApiKey } from '../utils/storage';

export default function SettingsScreen() {
  const { goTo } = useApp();
  const { t, lang, setLang } = useI18n();
  const [key, setKey] = useState(() => getApiKey());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-full flex flex-col bg-[#fafafa]">
      <div className="bg-white border-b border-[#e5e5e5] px-5 pt-14 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <button onClick={() => goTo('home')} className="text-sm text-[#999] font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('back')}
            </button>
            <h1 className="text-[15px] font-semibold text-[#0a0a0a]">{t('settings')}</h1>
            <div className="w-12" />
          </div>
        </div>
      </div>

      <main className="flex-1 px-5 py-5 max-w-lg mx-auto w-full">
        {/* Language */}
        <div className="bg-white rounded-[10px] p-4 border border-[#e5e5e5] mb-4 anim-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f2f2f2] rounded-[10px] flex items-center justify-center">
                <span className="text-base">🌐</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a0a0a]">Language / Sprache / Langue</p>
                <p className="text-xs text-[#999]">{lang === 'de' ? 'Deutsch' : lang === 'fr' ? 'Français' : 'English'}</p>
              </div>
            </div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="px-2 py-1.5 rounded-md border border-[#e5e5e5] text-xs font-semibold text-[#666] bg-white outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-[10px] p-4 border border-[#e5e5e5] anim-fade-in-up anim-delay-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#f2f2f2] rounded-[10px] flex items-center justify-center">
              <span className="text-base">🔑</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0a0a0a]">{t('apiKey')}</h2>
              <p className="text-xs text-[#999]">{t('apiKeyRequired')}</p>
            </div>
          </div>

          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="sk-..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#fafafa] border border-[#e5e5e5] text-sm text-[#0a0a0a] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]/40 transition-all font-mono"
          />

          <button
            onClick={handleSave}
            className={`w-full mt-3 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-[#171717] text-white active:opacity-90'
            }`}
          >
            {saved ? t('saved') : t('saveKey')}
          </button>

          <div className="mt-3 bg-[#fafafa] rounded-lg p-3">
            <p className="text-xs text-[#666] leading-relaxed">
              {t('apiKeyHint')}{' '}
              {t('getKey')}{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0070f3] underline font-medium"
              >
                platform.openai.com
              </a>
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-[10px] p-4 border border-[#e5e5e5] mt-4 anim-fade-in-up anim-delay-2">
          <h2 className="text-sm font-semibold text-[#0a0a0a] mb-3">{t('howItWorks')}</h2>
          <div className="space-y-3">
            {[
              { num: '1', text: t('step1Desc') },
              { num: '2', text: t('step2Desc') },
              { num: '3', text: t('step3Desc') },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-2.5">
                <div className="w-[22px] h-[22px] rounded-full bg-[#0070f3] flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-white">{s.num}</span>
                </div>
                <p className="text-xs text-[#666] leading-relaxed pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
