import type { Verdict } from '../types';

interface VerdictCardProps {
  title: string;
  verdict: Verdict;
  message: string;
  tip?: string;
  delay?: number;
}

const cfg: Record<Verdict, { bg: string; border: string; badge: string; label: string; icon: string }> = {
  allowed: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-600',
    label: 'Allowed',
    icon: '✓',
  },
  conditional: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-500',
    label: 'Conditions Apply',
    icon: '⚠',
  },
  not_allowed: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-600',
    label: 'Not Allowed',
    icon: '✕',
  },
};

export default function VerdictCard({ title, verdict, message, tip, delay = 0 }: VerdictCardProps) {
  const c = cfg[verdict];
  const delayClass = delay === 1 ? 'anim-delay-2' : delay === 2 ? 'anim-delay-4' : '';

  return (
    <div className={`anim-fade-in-up ${delayClass} rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}>
      {/* Color bar */}
      <div className={`h-1.5 ${c.badge}`} />

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h3>
          <span
            className={`${c.badge} text-white text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5`}
          >
            <span className="text-xs">{c.icon}</span>
            {c.label}
          </span>
        </div>

        <p className="text-[15px] text-slate-700 leading-relaxed">{message}</p>

        {tip && (
          <div className="mt-3 bg-white/70 rounded-xl p-3.5 flex gap-3 items-start">
            <span className="text-base mt-0.5">💡</span>
            <p className="text-[13px] text-slate-500 leading-relaxed">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
