import type { GameResult, SessionLog } from "./types";

const SESSIONS_KEY = "vigil:sessions";
const RESULTS_KEY = "vigil:results";

function safeRead<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silencioso de propósito
  }
}

export function getAllSessions(): SessionLog[] {
  return safeRead<SessionLog>(SESSIONS_KEY);
}

export function getAllResults(): GameResult[] {
  return safeRead<GameResult>(RESULTS_KEY);
}

export function saveSession(session: SessionLog): void {
  const sessions = getAllSessions();
  const index = sessions.findIndex((s) => s.sessionId === session.sessionId);

  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }

  safeWrite(SESSIONS_KEY, sessions);
}

export function saveResult(result: GameResult): void {
  const results = getAllResults();
  const index = results.findIndex((r) => r.sessionId === result.sessionId);

  if (index >= 0) {
    results[index] = result;
  } else {
    results.push(result);
  }

  safeWrite(RESULTS_KEY, results);
}

export function getResultsByGame(gameId: string): GameResult[] {
  return getAllResults().filter((r) => r.gameId === gameId);
}

export function getSessionsByGame(gameId: string): SessionLog[] {
  return getAllSessions().filter((s) => s.gameId === gameId);
}

export function getSessionById(sessionId: string): SessionLog | null {
  return getAllSessions().find((s) => s.sessionId === sessionId) ?? null;
}

export function getResultBySessionId(sessionId: string): GameResult | null {
  return getAllResults().find((r) => r.sessionId === sessionId) ?? null;
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(RESULTS_KEY);
  } catch {
    // silencioso de propósito
  }
}