// src/shared/storage.ts
// localStorage é bloqueado em iframes sandboxados (Vercel).
// Usamos Maps em memória como store primário — os dados persistem
// durante toda a sessão do navegador (enquanto a aba estiver aberta).
//
// Isolação por uid: as chaves do localStorage são prefixadas com o uid
// do usuário autenticado para evitar cross-user data leak em browsers
// compartilhados. clearUserData(uid) limpa ao fazer logout.

import type { GameResult, SessionLog } from './types';

const sessionsMap = new Map<string, SessionLog>();
const resultsMap  = new Map<string, GameResult>();

function sessionKey(uid: string) { return `vigil:sessions:${uid}`; }
function resultKey(uid: string)  { return `vigil:results:${uid}`;  }

// Hidrata do localStorage usando as chaves do uid fornecido.
export function hydrateForUser(uid: string): void {
  if (typeof window === 'undefined') return;
  sessionsMap.clear();
  resultsMap.clear();
  try {
    const rawSessions = localStorage.getItem(sessionKey(uid));
    if (rawSessions) {
      const parsed: SessionLog[] = JSON.parse(rawSessions);
      if (Array.isArray(parsed)) parsed.forEach(s => sessionsMap.set(s.sessionId, s));
    }
    const rawResults = localStorage.getItem(resultKey(uid));
    if (rawResults) {
      const parsed: GameResult[] = JSON.parse(rawResults);
      if (Array.isArray(parsed)) parsed.forEach(r => resultsMap.set(r.sessionId, r));
    }
  } catch { /* silencioso — localStorage indisponível no sandbox */ }
}

function persistSessions(uid?: string) {
  if (!uid) return;
  try { localStorage.setItem(sessionKey(uid), JSON.stringify([...sessionsMap.values()])); } catch { /* silencioso */ }
}

function persistResults(uid?: string) {
  if (!uid) return;
  try { localStorage.setItem(resultKey(uid), JSON.stringify([...resultsMap.values()])); } catch { /* silencioso */ }
}

// Limpa memória e localStorage do usuário ao fazer logout.
export function clearUserData(uid: string): void {
  sessionsMap.clear();
  resultsMap.clear();
  try {
    localStorage.removeItem(sessionKey(uid));
    localStorage.removeItem(resultKey(uid));
  } catch { /* silencioso */ }
}

export function getAllSessions(): SessionLog[] {
  return [...sessionsMap.values()];
}

export function getAllResults(): GameResult[] {
  return [...resultsMap.values()];
}

export function saveSession(session: SessionLog, uid?: string): void {
  sessionsMap.set(session.sessionId, session);
  persistSessions(uid);
}

export function saveResult(result: GameResult, uid?: string): void {
  resultsMap.set(result.sessionId, result);
  persistResults(uid);
}

export function getResultsByGame(gameId: string): GameResult[] {
  return getAllResults().filter(r => r.gameId === gameId);
}

export function getSessionsByGame(gameId: string): SessionLog[] {
  return getAllSessions().filter(s => s.gameId === gameId);
}

export function getSessionById(sessionId: string): SessionLog | null {
  return sessionsMap.get(sessionId) ?? null;
}

export function getResultBySessionId(sessionId: string): GameResult | null {
  return resultsMap.get(sessionId) ?? null;
}

/** @deprecated Use clearUserData(uid) para limpeza isolada por usuário. */
export function clearAllData(): void {
  sessionsMap.clear();
  resultsMap.clear();
  try {
    // Remove chaves legacy sem uid (migração)
    localStorage.removeItem('vigil:sessions');
    localStorage.removeItem('vigil:results');
  } catch { /* silencioso */ }
}
