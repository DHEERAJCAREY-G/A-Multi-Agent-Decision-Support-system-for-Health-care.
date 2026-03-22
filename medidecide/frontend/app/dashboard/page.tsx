'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, BarChart2, ClipboardList,
  Bell, Settings, LogOut, Activity,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import clsx from 'clsx';
import { getUsername, clearToken, getDashboardStats, getHistory, DashboardStats, HistoryEntry } from '@/lib/api';
import ChatPanel from '@/components/ChatPanel';
import RiskMeter from '@/components/RiskMeter';

type View = 'consultation' | 'dashboard' | 'history';

const NAV = [
  { id: 'consultation', label: 'Consultation', icon: MessageSquare },
  { id: 'dashboard',    label: 'Health Dashboard', icon: BarChart2 },
  { id: 'history',      label: 'Medical History',  icon: ClipboardList },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('consultation');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<number>(0);
  const [groqKey, setGroqKey] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [latestRisk, setLatestRisk] = useState<{ score: number; label: string } | null>(null);

  useEffect(() => {
    const u = getUsername();
    if (!u) { router.replace('/'); return; }
    setUsername(u);
    loadStats();
    loadHistory();
  }, []);

  const loadStats = async () => {
    try { setStats(await getDashboardStats()); } catch { /* not logged in */ }
  };

  const loadHistory = async () => {
    try { setHistory(await getHistory()); } catch { /* */ }
  };

  const logout = () => { clearToken(); router.replace('/'); };

  const handleNewResult = (score: number, label: string) => {
    setLatestRisk({ score, label });
    loadStats(); loadHistory();
  };

  const riskColor = (risk: string) => {
    const r = risk.toLowerCase();
    if (r.includes('critical')) return 'risk-critical';
    if (r.includes('high'))     return 'risk-high';
    if (r.includes('medium'))   return 'risk-medium';
    return 'risk-low';
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-bg-surface border-r border-border flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-lg">🏥</div>
            <div>
              <p className="font-serif text-base text-ink leading-tight">MediDecide</p>
              <p className="text-[10px] text-ink-muted">AI Decision Support</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          <p className="text-[10px] text-ink-subtle uppercase tracking-widest px-2 py-2">Workspace</p>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as View)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                view === id
                  ? 'bg-brand text-white font-medium'
                  : 'text-ink-muted hover:text-ink hover:bg-bg-raised',
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}

          <div className="pt-3">
            <p className="text-[10px] text-ink-subtle uppercase tracking-widest px-2 py-2">System</p>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-bg-raised transition-all">
              <Bell size={15} /> Alerts
              {stats && stats.last_risk?.toLowerCase().includes('high') && (
                <span className="ml-auto text-[10px] bg-risk-high-bg text-risk-high-text border border-risk-high px-1.5 py-0.5 rounded-full">!</span>
              )}
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-bg-raised transition-all">
              <Settings size={15} /> Settings
            </button>
          </div>
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-info-bg flex items-center justify-center text-sm font-semibold text-info-text flex-shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{username}</p>
              <p className="text-[10px] text-ink-muted">Patient</p>
            </div>
            <button onClick={logout} className="text-ink-subtle hover:text-risk-high-text transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center justify-between px-6 py-3.5 bg-bg-surface border-b border-border">
            <h2 className="text-base font-medium text-ink">
              {NAV.find(n => n.id === view)?.label}
            </h2>
            <div className="flex items-center gap-3">
              {latestRisk && (
                <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', riskColor(latestRisk.label))}>
                  Last: {latestRisk.label}
                </span>
              )}
              <span className="text-xs text-ink-muted border border-border rounded-full px-3 py-1">
                5 Agents Active
              </span>
            </div>
          </header>

          {/* Views */}
          <main className="flex-1 overflow-hidden">
            {/* ── Consultation ─────────────────────────── */}
            {view === 'consultation' && (
              <ChatPanel
                username={username}
                age={age}
                groqApiKey={groqKey}
                onNewResult={handleNewResult}
              />
            )}

            {/* ── Dashboard ────────────────────────────── */}
            {view === 'dashboard' && (
              <div className="h-full overflow-y-auto p-6 space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Consultations', value: stats?.total_consultations ?? '—', sub: 'total sessions' },
                    { label: 'Last Risk',     value: stats?.last_risk ?? '—',          sub: 'most recent' },
                    { label: 'Highest Risk',  value: stats?.highest_risk ?? '—',       sub: 'all time' },
                    { label: 'Avg Risk Score',value: stats?.avg_risk_score != null ? `${stats.avg_risk_score}/100` : '—', sub: 'average score' },
                  ].map((s) => (
                    <div key={s.label} className="bg-bg-surface border border-border rounded-card p-4">
                      <p className="text-[11px] text-ink-muted uppercase tracking-wide mb-1">{s.label}</p>
                      <p className="text-2xl font-serif text-ink">{String(s.value)}</p>
                      <p className="text-[11px] text-ink-subtle mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Risk trend chart */}
                <div className="bg-bg-surface border border-border rounded-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={15} className="text-brand" />
                    <h3 className="text-sm font-medium text-ink">Risk Score Trend</h3>
                  </div>
                  {stats?.trend && stats.trend.length > 1 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={stats.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(v) => new Date(v).toLocaleDateString()}
                          tick={{ fontSize: 10, fill: '#8B949E' }}
                          axisLine={{ stroke: '#30363D' }}
                        />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={{ stroke: '#30363D' }} />
                        <Tooltip
                          contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 8, fontSize: 12 }}
                          labelFormatter={(v) => new Date(v).toLocaleString()}
                        />
                        <Line
                          type="monotone"
                          dataKey="risk_score"
                          stroke="#2EA043"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#2EA043' }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-ink-muted text-center py-10">Not enough data yet — start a consultation.</p>
                  )}
                </div>

                {/* Latest risk meter */}
                {latestRisk && (
                  <div className="bg-bg-surface border border-border rounded-card p-5">
                    <h3 className="text-sm font-medium text-ink mb-4">Latest Assessment</h3>
                    <RiskMeter score={latestRisk.score} />
                  </div>
                )}
              </div>
            )}

            {/* ── History ─────────────────────────────── */}
            {view === 'history' && (
              <div className="h-full overflow-y-auto p-6">
                <div className="bg-bg-surface border border-border rounded-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Date & Time', 'Symptoms', 'Risk', 'Score'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-ink-muted uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-10 text-center text-ink-muted text-sm">No history yet. Start a consultation.</td></tr>
                      ) : history.map((entry) => (
                        <tr key={entry.id} className="border-b border-border/50 hover:bg-bg-raised transition-colors">
                          <td className="px-4 py-3 text-ink-muted text-xs whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-ink text-xs max-w-xs truncate">{entry.symptoms}</td>
                          <td className="px-4 py-3">
                            <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', riskColor(entry.risk))}>
                              {entry.risk}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-ink-muted text-xs">{entry.risk_score}/100</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ── Right sidebar — config ──────────────────────────────────────── */}
        {view === 'consultation' && (
          <aside className="w-64 bg-bg-surface border-l border-border flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-border">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Patient Config</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] text-ink-muted uppercase tracking-wide mb-1.5">Age</label>
                <input
                  type="number"
                  min={0} max={120}
                  value={age || ''}
                  onChange={(e) => setAge(Number(e.target.value))}
                  placeholder="Enter age"
                  className="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink-muted uppercase tracking-wide mb-1.5">Groq API Key</label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand"
                />
                <p className="text-[10px] text-ink-subtle mt-1.5">
                  Free key at{' '}
                  <a href="https://console.groq.com" target="_blank" className="text-info-text hover:underline">
                    console.groq.com
                  </a>
                </p>
              </div>

              {stats && (
                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-[11px] text-ink-muted uppercase tracking-wide">Quick Stats</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-bg-raised rounded-lg p-2.5 text-center">
                      <p className="text-lg font-serif text-ink">{stats.total_consultations}</p>
                      <p className="text-[10px] text-ink-subtle">sessions</p>
                    </div>
                    <div className="bg-bg-raised rounded-lg p-2.5 text-center">
                      <p className="text-lg font-serif text-ink">{stats.avg_risk_score ?? '—'}</p>
                      <p className="text-[10px] text-ink-subtle">avg score</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
