'use client';

import { CheckCircle, Circle, Loader } from 'lucide-react';
import clsx from 'clsx';

export interface AgentState {
  id: string;
  label: string;
  icon: string;
  status: 'idle' | 'running' | 'done' | 'error';
  message: string;
}

const DEFAULT_AGENTS: AgentState[] = [
  { id: 'interaction', label: 'Interaction Agent', icon: '🤖', status: 'idle', message: 'Symptom parsing' },
  { id: 'reasoning',   label: 'Medical Reasoning', icon: '🩺', status: 'idle', message: 'Groq LLM analysis' },
  { id: 'risk',        label: 'Risk Assessment',   icon: '⚠️', status: 'idle', message: 'Severity evaluation' },
  { id: 'monitoring',  label: 'Monitoring Agent',  icon: '📈', status: 'idle', message: 'History tracking' },
  { id: 'escalation',  label: 'Escalation Agent',  icon: '🚨', status: 'idle', message: 'Final decision' },
];

export { DEFAULT_AGENTS };

interface Props { agents: AgentState[] }

export default function AgentPipeline({ agents }: Props) {
  return (
    <div className="space-y-1">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-300',
            agent.status === 'running' && 'bg-risk-medium-bg border-yellow-800/40',
            agent.status === 'done'    && 'bg-risk-low-bg border-green-800/40',
            agent.status === 'error'   && 'bg-risk-high-bg border-red-800/40',
            agent.status === 'idle'    && 'bg-bg-raised border-border',
          )}
        >
          {/* Status icon */}
          <div className="flex-shrink-0 w-5 flex items-center justify-center">
            {agent.status === 'done'    && <CheckCircle size={14} className="text-risk-low-text" />}
            {agent.status === 'running' && <Loader size={14} className="text-risk-medium-text animate-spin" />}
            {agent.status === 'error'   && <Circle size={14} className="text-risk-high-text" />}
            {agent.status === 'idle'    && <Circle size={14} className="text-ink-subtle" />}
          </div>

          {/* Agent icon */}
          <span className="text-sm">{agent.icon}</span>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className={clsx(
              'text-xs font-medium truncate',
              agent.status === 'done'    && 'text-risk-low-text',
              agent.status === 'running' && 'text-risk-medium-text',
              agent.status === 'error'   && 'text-risk-high-text',
              agent.status === 'idle'    && 'text-ink-muted',
            )}>
              {agent.label}
            </p>
            <p className="text-[11px] text-ink-subtle truncate">{agent.message}</p>
          </div>

          {/* Status badge */}
          <span className={clsx(
            'flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium',
            agent.status === 'done'    && 'risk-low',
            agent.status === 'running' && 'risk-medium',
            agent.status === 'error'   && 'risk-high',
            agent.status === 'idle'    && 'text-ink-subtle bg-bg',
          )}>
            {agent.status === 'idle' ? 'Queued' : agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
