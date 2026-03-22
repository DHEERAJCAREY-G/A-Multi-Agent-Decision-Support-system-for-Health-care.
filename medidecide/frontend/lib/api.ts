// lib/api.ts  — typed API client for the FastAPI backend

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

export const setToken = (token: string, username: string) => {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
};

export const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

export const getUsername = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('username') : null;

// ── Fetch wrapper ─────────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}


// ── Auth ─────────────────────────────────────────────────────────────────────
export interface TokenResponse { access_token: string; username: string }

export const register = (username: string, password: string) =>
  apiFetch<{ message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const login = async (username: string, password: string): Promise<TokenResponse> => {
  const data = await apiFetch<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.access_token, data.username);
  return data;
};


// ── SSE Consultation ─────────────────────────────────────────────────────────
export interface AgentEvent {
  event: 'agent_start' | 'agent_done' | 'result' | 'error';
  data: Record<string, unknown>;
}

export type SSECallback = (event: AgentEvent) => void;

/**
 * Opens an SSE stream to the /consult/stream endpoint.
 * Calls `onEvent` for each SSE message.
 * Returns a cleanup function to abort the stream.
 */
export function streamConsultation(
  symptoms: string,
  age: number,
  groqApiKey: string,
  onEvent: SSECallback,
  onDone: () => void,
  onError: (err: string) => void,
): () => void {
  const controller = new AbortController();

  (async () => {
    const token = getToken();
    try {
      const res = await fetch(`${BASE_URL}/consult/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ symptoms, age, groq_api_key: groqApiKey }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        onError(err.detail ?? 'Stream failed');
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by double newlines
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const dataLine = part.split('\n').find(l => l.startsWith('data:'));
          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine.slice(5).trim()) as AgentEvent;
            onEvent(parsed);
            if (parsed.event === 'result' || parsed.event === 'error') onDone();
          } catch { /* skip malformed */ }
        }
      }
      onDone();
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        onError((err as Error).message);
      }
    }
  })();

  return () => controller.abort();
}


// ── History & Dashboard ───────────────────────────────────────────────────────
export interface HistoryEntry {
  id: number;
  timestamp: string;
  symptoms: string;
  risk: string;
  risk_score: number;
}

export interface DashboardStats {
  total_consultations: number;
  last_risk: string | null;
  highest_risk: string | null;
  avg_risk_score: number | null;
  trend: { timestamp: string; risk_score: number; risk_label: string }[];
}

export const getHistory = (limit = 20) =>
  apiFetch<HistoryEntry[]>(`/consult/history?limit=${limit}`);

export const getDashboardStats = () =>
  apiFetch<DashboardStats>('/dashboard/stats');

export const deleteRecord = (id: number) =>
  apiFetch<void>(`/dashboard/history/${id}`, { method: 'DELETE' });
