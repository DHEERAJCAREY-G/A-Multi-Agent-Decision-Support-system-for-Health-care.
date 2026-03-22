'use client';

import clsx from 'clsx';

interface Props {
  score: number;      // 0–100
  label?: string;
  showDetails?: boolean;
}

function getRiskTier(score: number) {
  if (score >= 90) return { label: 'Critical', color: 'text-risk-critical-text', bg: 'bg-risk-critical-bg', border: 'border-risk-critical' };
  if (score >= 65) return { label: 'High',     color: 'text-risk-high-text',     bg: 'bg-risk-high-bg',     border: 'border-risk-high' };
  if (score >= 35) return { label: 'Medium',   color: 'text-risk-medium-text',   bg: 'bg-risk-medium-bg',   border: 'border-risk-medium' };
  return              { label: 'Low',      color: 'text-risk-low-text',      bg: 'bg-risk-low-bg',      border: 'border-risk-low' };
}

export default function RiskMeter({ score, label, showDetails = true }: Props) {
  const tier = getRiskTier(score);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-ink-muted font-medium">{label ?? 'Overall Risk Level'}</span>
        <span className={clsx('text-sm font-semibold', tier.color)}>
          {tier.label} ({score}/100)
        </span>
      </div>

      {/* Gradient track */}
      <div className="h-2 bg-bg-raised rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${score}%`,
            background: 'linear-gradient(90deg, #2EA043, #D29922, #DA3633)',
          }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-ink-subtle">
        <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
      </div>

      {showDetails && score >= 65 && (
        <div className={clsx('mt-3 border rounded-lg px-3 py-2.5 text-xs', tier.bg, tier.border)}>
          <p className={clsx('font-semibold mb-0.5', tier.color)}>
            {score >= 90 ? 'CRITICAL — Call emergency services now' : 'HIGH — Seek immediate medical attention'}
          </p>
          <p className="text-ink-muted">
            {score >= 90
              ? 'Your symptoms indicate a life-threatening emergency. Do not delay.'
              : 'The Escalation Agent recommends visiting an emergency department within 30 minutes.'}
          </p>
        </div>
      )}
    </div>
  );
}
