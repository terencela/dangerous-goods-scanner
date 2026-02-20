import type { Verdict } from '../types';

interface VerdictCardProps {
  title: string;
  verdict: Verdict;
  message: string;
  tip?: string;
}

const verdictConfig: Record<Verdict, { bg: string; border: string; badge: string; badgeText: string; icon: string }> = {
  allowed: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    badge: 'bg-green-600',
    badgeText: 'Allowed',
    icon: '✓',
  },
  conditional: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-500',
    badgeText: 'Conditions Apply',
    icon: '⚠',
  },
  not_allowed: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-600',
    badgeText: 'Not Allowed',
    icon: '✕',
  },
};

export default function VerdictCard({ title, verdict, message, tip }: VerdictCardProps) {
  const config = verdictConfig[verdict];

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-5 transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h3>
        <span className={`${config.badge} text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
          <span>{config.icon}</span>
          {config.badgeText}
        </span>
      </div>
      <p className="text-slate-800 text-sm leading-relaxed">{message}</p>
      {tip && (
        <div className="mt-3 flex gap-2 items-start bg-white/60 rounded-lg p-3">
          <span className="text-lg leading-none mt-0.5">💡</span>
          <p className="text-xs text-slate-600 leading-relaxed">{tip}</p>
        </div>
      )}
    </div>
  );
}
