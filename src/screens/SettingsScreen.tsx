import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getApiKey, setApiKey } from '../utils/storage';

export default function SettingsScreen() {
  const { goTo } = useApp();
  const [key, setKey] = useState(() => getApiKey());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      <header className="bg-white shadow-sm px-5 pt-14 pb-5">
        <div className="max-w-lg mx-auto">
          <button onClick={() => goTo('home')} className="text-sm text-slate-400 font-medium mb-4 block">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        {/* API Key */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 anim-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-airport-blue/10 rounded-xl flex items-center justify-center">
              <span className="text-lg">🔑</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">OpenAI API Key</h2>
              <p className="text-xs text-slate-400">Required for AI item detection</p>
            </div>
          </div>

          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="sk-..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-airport-blue/20 focus:border-airport-blue/40 transition-all font-mono"
          />

          <button
            onClick={handleSave}
            className={`w-full mt-3 py-3 rounded-xl font-semibold text-sm transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-airport-blue text-white active:scale-[0.97]'
            }`}
          >
            {saved ? '✓ Saved' : 'Save Key'}
          </button>

          <div className="mt-4 bg-slate-50 rounded-xl p-3.5">
            <p className="text-xs text-slate-500 leading-relaxed">
              Your API key is stored locally on this device only. It is never sent anywhere except
              directly to OpenAI to analyze your photos. You can get a key at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-airport-blue underline font-medium"
              >
                platform.openai.com/api-keys
              </a>
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mt-4 anim-fade-in-up anim-delay-1">
          <h2 className="text-sm font-bold text-slate-800 mb-3">How Detection Works</h2>
          <div className="space-y-3">
            {[
              ['📷', 'You take a photo of your item'],
              ['🤖', 'GPT-4o-mini Vision analyzes the image'],
              ['✅', 'The item is classified into an airport security category'],
              ['📋', 'Follow-up questions are asked if needed (e.g. battery capacity)'],
              ['🎯', 'You get a clear verdict: allowed or not allowed'],
            ].map(([icon, text], i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{icon}</span>
                <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
