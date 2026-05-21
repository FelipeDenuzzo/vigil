import type { GameResult, SessionLog } from "./types";

const SESSIONS_KEY = "vigil:sessions";
const RESULTS_KEY = "vigil:results";

export function getAllSessions(): SessionLog[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAllResults(): GameResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: SessionLog): void {
  const sessions = getAllSessions();
  const index = sessions.findIndex((s) => s.sessionId === session.sessionId);

  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function saveResult(result: GameResult): void {
  const results = getAllResults();
  const index = results.findIndex((r) => r.sessionId === result.sessionId);

  if (index >= 0) {
    results[index] = result;
  } else {
    results.push(result);
  }

  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

export function getResultsByGame(gameId: string): GameResult[] {
  return getAllResults().filter((r) => r.gameId === gameId);
}

export function clearAllData(): void {
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(RESULTS_KEY);
}