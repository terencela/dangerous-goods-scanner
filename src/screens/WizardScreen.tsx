import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryById } from '../data/categories';
import { getQuestionsForCategory } from '../data/questions';
import ProgressBar from '../components/ProgressBar';

export default function WizardScreen() {
  const { goTo, session, setAnswers, computeResult } = useApp();
  const [step, setStep] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string | number | boolean>>(
    () => ({ ...session.answers })
  );

  const category = useMemo(
    () => getCategoryById(session.categoryId || ''),
    [session.categoryId]
  );
  const allQuestions = useMemo(
    () => getQuestionsForCategory(session.categoryId || ''),
    [session.categoryId]
  );

  const question = allQuestions[step];
  const currentValue = question ? localAnswers[question.id] : undefined;
  const isLastStep = step === allQuestions.length - 1;

  const computedWh = useMemo(() => {
    if (session.categoryId !== 'batteries') return null;
    const mah = Number(localAnswers['battery-mah']) || 0;
    const v = Number(localAnswers['battery-voltage']) || 0;
    if (mah > 0 && v > 0) return (mah * v) / 1000;
    return null;
  }, [localAnswers, session.categoryId]);

  const handleNumberChange = useCallback(
    (id: string, raw: string) => {
      const val = raw === '' ? '' : Number(raw);
      setLocalAnswers((prev) => ({ ...prev, [id]: val }));
    },
    []
  );

  const handleSelectChange = useCallback(
    (id: string, val: string) => {
      setLocalAnswers((prev) => ({ ...prev, [id]: val }));
    },
    []
  );

  const canProceed = currentValue !== undefined && currentValue !== '';

  const next = () => {
    if (!canProceed) return;
    if (isLastStep) {
      setAnswers(localAnswers);
      setTimeout(() => {
        computeResult();
        goTo('result');
      }, 0);
    } else {
      setStep((s) => s + 1);
    }
  };

  const back = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      goTo('identify');
    }
  };

  if (!category || !question) {
    return (
      <div className="min-h-full flex items-center justify-center bg-airport-light">
        <p className="text-slate-400">No questions for this category.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={back} className="text-sm font-medium text-slate-500 hover:text-slate-700">
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{category.name}</span>
            </div>
          </div>
          <ProgressBar current={step} total={allQuestions.length} />
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        {session.photoUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={session.photoUrl}
              alt="Your item"
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-800 text-center mb-8">{question.text}</h2>

        {question.type === 'number' && (
          <div className="max-w-xs mx-auto">
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={currentValue === undefined ? '' : String(currentValue)}
                onChange={(e) => handleNumberChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                className="w-full text-center text-2xl font-bold py-4 px-4 bg-white rounded-2xl border-2 border-slate-200 focus:border-airport-blue focus:outline-none transition-colors text-slate-800"
                autoFocus
              />
              {question.unit && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  {question.unit}
                </span>
              )}
            </div>

            {computedWh !== null && question.id === 'battery-voltage' && (
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500">
                  Computed energy:{' '}
                  <span className="font-bold text-airport-blue text-lg">{computedWh.toFixed(1)} Wh</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Wh = mAh × V ÷ 1000</p>
              </div>
            )}
          </div>
        )}

        {question.type === 'select' && question.options && (
          <div className="space-y-3 max-w-sm mx-auto">
            {question.options.map((opt) => {
              const selected = currentValue === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelectChange(question.id, opt.value)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    selected
                      ? 'border-airport-blue bg-airport-blue/5 text-airport-blue font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? 'border-airport-blue' : 'border-slate-300'
                      }`}
                    >
                      {selected && <span className="w-2.5 h-2.5 rounded-full bg-airport-blue" />}
                    </span>
                    <span className="text-sm">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom action */}
      <div className="px-4 pb-10 pt-4 bg-airport-light">
        <div className="max-w-lg mx-auto">
          <button
            onClick={next}
            disabled={!canProceed}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              canProceed
                ? 'bg-airport-blue text-white shadow-lg active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLastStep ? 'Check Verdict' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
