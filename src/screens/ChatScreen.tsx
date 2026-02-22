/**
 * ChatScreen — Text-based Baggage Assistant
 *
 * Architecture:
 * 1. User types what they have in plain language
 * 2. extractFromText (AI) extracts structured facts ONLY
 * 3. evaluateRules (deterministic) produces the verdict
 * 4. AI never decides whether something is allowed or not
 *
 * If critical data is missing, the chatbot asks a follow-up question.
 * The verdict is always computed by the rules engine.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { extractFromText, type AiExtraction } from '../utils/classifier';
import { evaluateRules } from '../data/rules';
import { extractionToAnswers } from '../utils/extractionToAnswers';
import { getCategoryById } from '../data/categories';
import { getApiKey, hasApiKey } from '../utils/storage';
import type { RuleResult, Verdict } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  verdict?: RuleResult;
  itemName?: string;
  waitingForClarification?: boolean;
  clarificationContext?: {
    extraction: AiExtraction;
  };
}

function VerdictRow({ label, verdict, message, tip }: { label: string; verdict: Verdict; message: string; tip?: string }) {
  const cfg = verdict === 'allowed'
    ? { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: '✓', label: 'Allowed' }
    : verdict === 'conditional'
    ? { color: 'text-amber-700', bg: 'bg-amber-50', icon: '⚠', label: 'Conditions' }
    : { color: 'text-red-700', bg: 'bg-red-50', icon: '✕', label: 'Not Allowed' };

  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-[#666] uppercase tracking-wide">{label}</span>
        <span className={`text-[11px] font-semibold ${cfg.color} ${cfg.bg} px-2 py-0.5 rounded`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <p className="text-[12px] text-[#333] leading-[17px]">{message}</p>
      {tip && (
        <p className="text-[11px] text-[#999] mt-1 leading-4">→ {tip}</p>
      )}
    </div>
  );
}

function MessageBubble({ msg, hbLabel, cbLabel }: { msg: Message; hbLabel: string; cbLabel: string }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] bg-[#171717] text-white rounded-2xl rounded-br-sm px-4 py-2.5">
          <p className="text-[14px] leading-[20px]">{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[90%] flex gap-2">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-[#f2f2f2] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">✈</span>
        </div>
        <div className="flex-1">
          {/* Verdict card */}
          {msg.verdict && msg.itemName && (
            <div className="bg-white border border-[#e5e5e5] rounded-2xl rounded-tl-sm p-3 mb-1">
              <p className="text-[10px] font-bold text-[#999] uppercase tracking-widest mb-2">
                {msg.itemName}
              </p>
              <VerdictRow
                label={hbLabel}
                verdict={msg.verdict.handBaggage.verdict}
                message={msg.verdict.handBaggage.message}
                tip={msg.verdict.handBaggage.tip}
              />
              <div className="h-px bg-[#f2f2f2] my-2" />
              <VerdictRow
                label={cbLabel}
                verdict={msg.verdict.checkedBaggage.verdict}
                message={msg.verdict.checkedBaggage.message}
                tip={msg.verdict.checkedBaggage.tip}
              />
            </div>
          )}
          {/* Text */}
          {msg.text && (
            <div className="bg-[#f2f2f2] rounded-2xl rounded-tl-sm px-4 py-2.5">
              <p className="text-[14px] text-[#0a0a0a] leading-[20px]">{msg.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex gap-2 items-center">
        <div className="w-7 h-7 rounded-full bg-[#f2f2f2] flex items-center justify-center">
          <span className="text-sm">✈</span>
        </div>
        <div className="bg-[#f2f2f2] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#999] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatScreen() {
  const { goTo, resetSession } = useApp();
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingClarificationRef = useRef<AiExtraction | null>(null);

  const apiKeyPresent = hasApiKey();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, thinking, scrollToBottom]);

  const appendMessage = (msg: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  };

  const processExtraction = useCallback((extraction: AiExtraction, _userText: string) => {
    if (!extraction.identified || !extraction.categoryId) {
      appendMessage({
        role: 'assistant',
        text: `I couldn't identify an item from your message. Could you describe it more specifically? For example: "I have a 10,000 mAh power bank" or "Can I bring scissors?".`,
      });
      return;
    }

    const catId = extraction.categoryId;
    const cat = getCategoryById(catId);
    const catName = extraction.itemName || cat?.name || catId;

    // Check if we need more info
    if (extraction.missingCriticalData && (extraction as any).clarificationNeeded) {
      const clarification = (extraction as any).clarificationNeeded as string;
      pendingClarificationRef.current = extraction;
      appendMessage({
        role: 'assistant',
        text: clarification,
        waitingForClarification: true,
        clarificationContext: { extraction },
      });
      return;
    }

    // Convert AI extraction to answers and run deterministic rules
    const answers = extractionToAnswers(catId, extraction);
    const result = evaluateRules(catId, answers);

    appendMessage({
      role: 'assistant',
      text: '',
      verdict: result,
      itemName: catName,
    });

    // Safety footer
    appendMessage({
      role: 'assistant',
      text: t('chatSafetyNote'),
    });
  }, [t]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');

    appendMessage({ role: 'user', text });
    setThinking(true);

    if (!apiKeyPresent) {
      setThinking(false);
      appendMessage({
        role: 'assistant',
        text: 'No OpenAI API key is configured. Please go to Settings and add your API key to enable the chatbot.',
      });
      return;
    }

    const apiKey = getApiKey()!;

    try {
      // If there's a pending clarification, combine the clarification answer with the prior context
      let messageToSend = text;
      if (pendingClarificationRef.current) {
        const prior = pendingClarificationRef.current;
        const category = prior.categoryId || '';
        // Append context to help the AI understand what was already known
        messageToSend = `[Context: item is a ${prior.itemName || category}] Additional info: ${text}`;
        pendingClarificationRef.current = null;
      }

      const extraction = await extractFromText(messageToSend, apiKey);
      setThinking(false);

      if (extraction.error) {
        appendMessage({ role: 'assistant', text: t('chatError') });
        return;
      }

      processExtraction(extraction, text);
    } catch {
      setThinking(false);
      appendMessage({ role: 'assistant', text: t('chatError') });
    }
  }, [input, thinking, apiKeyPresent, processExtraction, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleExample = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const handleNewCheck = () => {
    setMessages([]);
    pendingClarificationRef.current = null;
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-full flex flex-col bg-[#fafafa]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3 bg-white border-b border-[#e5e5e5]">
        <button
          onClick={() => goTo('home')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-[#0a0a0a]">{t('chatTitle')}</p>
          <p className="text-[10px] text-[#999]">Zurich Airport</p>
        </div>
        {messages.length > 0 ? (
          <button
            onClick={handleNewCheck}
            className="text-[11px] font-medium text-[#0070f3] px-1"
          >
            {t('chatNewCheck')}
          </button>
        ) : (
          <button
            onClick={() => { resetSession(); goTo('camera'); }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#f2f2f2]"
            title={t('orUseCamera')}
          >
            <svg className="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
        {isEmpty && (
          <div className="anim-fade-in">
            {/* Welcome */}
            <div className="text-center mb-6 pt-4">
              <div className="w-14 h-14 rounded-2xl bg-[#f2f2f2] flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✈</span>
              </div>
              <h2 className="text-[17px] font-semibold text-[#0a0a0a] mb-1">{t('chatWelcome')}</h2>
              <p className="text-[13px] text-[#666] leading-[18px] max-w-xs mx-auto">{t('chatWelcomeDesc')}</p>
            </div>

            {/* No API key warning */}
            {!apiKeyPresent && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-0.5">API Key Required</p>
                <p className="text-xs text-amber-700 mb-2">Add your OpenAI API key to use the chatbot.</p>
                <button
                  onClick={() => goTo('settings')}
                  className="text-xs font-semibold text-[#0070f3]"
                >
                  Open Settings →
                </button>
              </div>
            )}

            {/* Example prompts */}
            <p className="text-[11px] font-semibold text-[#999] uppercase tracking-widest mb-2 px-1">Try asking</p>
            {[t('chatExample1'), t('chatExample2'), t('chatExample3')].map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExample(ex)}
                className="w-full text-left bg-white border border-[#e5e5e5] rounded-xl px-4 py-3 mb-2 hover:bg-[#f5f5f5] transition-colors"
              >
                <p className="text-[13px] text-[#0a0a0a]">"{ex}"</p>
              </button>
            ))}

            {/* Safety disclaimer */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mt-4">
              <svg className="w-3.5 h-3.5 text-[#0070f3] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-[11px] text-[#0070f3] leading-[15px]">
                Verdicts are computed by a deterministic rules engine based on official ZRH regulations — not by AI guesswork.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            hbLabel={t('handBaggage')}
            cbLabel={t('checkedBaggage')}
          />
        ))}

        {thinking && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-3 bg-white border-t border-[#e5e5e5]">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chatPlaceholder')}
              disabled={thinking || !apiKeyPresent}
              className="w-full bg-[#f2f2f2] rounded-2xl px-4 py-3 text-[14px] text-[#0a0a0a] placeholder:text-[#999] outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || thinking || !apiKeyPresent}
            className="w-10 h-10 rounded-full bg-[#171717] flex items-center justify-center disabled:opacity-30 transition-opacity flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
