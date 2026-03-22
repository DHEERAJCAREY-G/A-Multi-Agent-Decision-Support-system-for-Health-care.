'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import clsx from 'clsx';
import { streamConsultation, AgentEvent } from '@/lib/api';
import AgentPipeline, { AgentState, DEFAULT_AGENTS } from './AgentPipeline';
import RiskMeter from './RiskMeter';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  pipeline?: AgentState[];
  result?: {
    risk_level: string;
    risk_score: number;
    recommendation: string;
    reasoning: string;
    escalate: boolean;
  };
}

interface Props {
  username: string;
  age: number;
  groqApiKey: string;
  onNewResult?: (riskScore: number, riskLevel: string) => void;
}

export default function ChatPanel({ username, age, groqApiKey, onNewResult }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${username}! I'm Raj, your AI consultation assistant. I'll coordinate 5 specialist agents to analyse your symptoms in real time. What are you experiencing today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (!groqApiKey) { alert('Please enter your Groq API key in the sidebar.'); return; }
    if (!age) { alert('Please enter your age in the sidebar.'); return; }

    setInput('');

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    // Placeholder assistant message with live pipeline
    const placeholderIdx = messages.length + 1;
    const initialAgents: AgentState[] = DEFAULT_AGENTS.map((a) => ({ ...a }));

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', pipeline: initialAgents },
    ]);

    setStreaming(true);

    const updateMessage = (updater: (msg: Message) => Message) => {
      setMessages((prev) =>
        prev.map((m, i) => (i === placeholderIdx ? updater(m) : m)),
      );
    };

    const cleanup = streamConsultation(
      text, age, groqApiKey,
      (event: AgentEvent) => {
        if (event.event === 'agent_start' || event.event === 'agent_done') {
          const agentId = event.data.agent as string;
          const status = event.event === 'agent_start' ? 'running' : 'done';
          const msg = event.data.message as string;

          updateMessage((m) => ({
            ...m,
            pipeline: m.pipeline?.map((a) =>
              a.id === agentId ? { ...a, status, message: msg } : a
            ),
          }));
        }

        if (event.event === 'result') {
          const d = event.data as Message['result'] & Record<string, unknown>;
          updateMessage((m) => ({
            ...m,
            content: d.recommendation as string,
            result: {
              risk_level: d.risk_level as string,
              risk_score: d.risk_score as number,
              recommendation: d.recommendation as string,
              reasoning: d.reasoning as string,
              escalate: d.escalate as boolean,
            },
          }));
          onNewResult?.(d.risk_score as number, d.risk_level as string);
        }

        if (event.event === 'error') {
          updateMessage((m) => ({
            ...m,
            content: `⚠️ Error: ${event.data.message}`,
          }));
        }
      },
      () => setStreaming(false),
      (err) => {
        setStreaming(false);
        updateMessage((m) => ({ ...m, content: `⚠️ ${err}` }));
      },
    );

    abortRef.current = cleanup;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3 items-start animate-slide-up', msg.role === 'user' && 'flex-row-reverse')}>
            {/* Avatar */}
            <div className={clsx(
              'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
              msg.role === 'assistant' ? 'bg-brand text-white' : 'bg-info text-white',
            )}>
              {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            </div>

            {/* Bubble */}
            <div className={clsx('max-w-[82%] space-y-2', msg.role === 'user' && 'items-end flex flex-col')}>
              <div className={clsx(
                'px-4 py-2.5 rounded-xl text-sm leading-relaxed',
                msg.role === 'assistant'
                  ? 'bg-bg-raised border border-border text-ink rounded-tl-sm'
                  : 'bg-info text-white rounded-tr-sm',
              )}>
                {msg.content || (streaming && i === messages.length - 1 ? (
                  <span className="text-ink-muted italic text-xs">Agents working…</span>
                ) : '')}
              </div>

              {/* Live agent pipeline */}
              {msg.pipeline && (
                <div className="w-full bg-bg border border-border rounded-xl p-3">
                  <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-2">Agent Pipeline</p>
                  <AgentPipeline agents={msg.pipeline} />
                </div>
              )}

              {/* Result card */}
              {msg.result && (
                <div className="w-full bg-bg border border-border rounded-xl p-4 space-y-3">
                  <RiskMeter score={msg.result.risk_score} />
                  <details className="group">
                    <summary className="text-xs text-ink-muted cursor-pointer hover:text-ink transition-colors list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform inline-block">›</span>
                      View full medical reasoning
                    </summary>
                    <div className="mt-2 text-xs text-ink-muted leading-relaxed whitespace-pre-wrap border-t border-border pt-2">
                      {msg.result.reasoning}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={streaming}
            placeholder={streaming ? 'Agents working…' : 'Describe your symptoms…'}
            className="flex-1 bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-ink placeholder-ink-subtle focus:outline-none focus:border-brand transition-colors disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="bg-brand hover:bg-brand-hover disabled:opacity-40 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
