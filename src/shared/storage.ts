import type { GameResult, SessionLog } from "./types";

// localStorage é bloqueado em iframes sandboxados (Vercel).
// Usamos Maps em memória como store primário — os dados persistem
// durante toda a sessão do navegador (enquanto a aba estiver aberta).

const sessionsMap = new Map<string, SessionLog>();
const resultsMap = new Map<string, GameResult>();

// Tenta hidratar do localStorage na inicialização (funciona fora de sandbox).
(function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const rawSessions = localStorage.getItem("vigil:sessions");
    if (rawSessions) {
      const parsed: SessionLog[] = JSON.parse(rawSessions);
      if (Array.isArray(parsed)) parsed.forEach((s) => sessionsMap.set(s.sessionId, s));
    }
    const rawResults = localStorage.getItem("vigil:results");
    if (rawResults) {
      const parsed: GameResult[] = JSON.parse(rawResults);
      if (Array.isArray(parsed)) parsed.forEach((r) => resultsMap.set(r.sessionId, r));
    }
  } catch {
    // silencioso — localStorage indisponível no sandbox
  }
})();

function persistSessions() {
  try {
    localStorage.setItem("vigil:sessions", JSON.stringify([...sessionsMap.values()]));
  } catch { /* silencioso */ }
}

function persistResults() {
  try {
    localStorage.setItem("vigil:results", JSON.stringify([...resultsMap.values()]));
  } catch { /* silencioso */ }
}

export function getAllSessions(): SessionLog[] {
  return [...sessionsMap.values()];
}

export function getAllResults(): GameResult[] {
  return [...resultsMap.values()];
}

export function saveSession(session: SessionLog): void {
  sessionsMap.set(session.sessionId, session);
  persistSessions();
}

export function saveResult(result: GameResult): void {
  resultsMap.set(result.sessionId, result);
  persistResults();
}

export function getResultsByGame(gameId: string): GameResult[] {
  return getAllResults().filter((r) => r.gameId === gameId);
}

export function getSessionsByGame(gameId: string): SessionLog[] {
  return getAllSessions().filter((s) => s.gameId === gameId);
}

export function getSessionById(sessionId: string): SessionLog | null {
  return sessionsMap.get(sessionId) ?? null;
}

export function getResultBySessionId(sessionId: string): GameResult | null {
  return resultsMap.get(sessionId) ?? null;
}

export function clearAllData(): void {
  sessionsMap.clear();
  resultsMap.clear();
  try {
    localStorage.removeItem("vigil:sessions");
    localStorage.removeItem("vigil:results");
  } catch { /* silencioso */ }
}
