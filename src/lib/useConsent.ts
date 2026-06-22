// src/lib/useConsent.ts
// Persiste o consentimento LGPD no localStorage (cache local) E no Firestore
// (prova auditável server-side exigida pela LGPD Art. 8º §5).

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from './firebase';

export interface ConsentRecord {
  version:          string;   // versão da política aceita
  acceptedAt:       string;   // ISO 8601
  terms:            boolean;  // aceite dos termos de uso (obrigatório)
  privacyPolicy:    boolean;  // leitura da política de privacidade (obrigatório)
  healthData:       boolean;  // consentimento explícito p/ dados cognitivos/saúde (obrigatório)
  communications:   boolean;  // e-mails de novidades (opcional)
}

const LOCAL_KEY    = 'vigil_consent_v1';
export const POLICY_VERSION = '1.0';

// ── localStorage (cache local) ────────────────────────────────────

export function saveConsent(record: ConsentRecord): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(record));
}

export function loadConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ConsentRecord) : null;
  } catch {
    return null;
  }
}

export function hasValidConsent(): boolean {
  const c = loadConsent();
  return (
    c !== null &&
    c.version       === POLICY_VERSION &&
    c.terms         === true &&
    c.privacyPolicy === true &&
    c.healthData    === true
  );
}

// ── Firestore (prova auditável server-side — LGPD Art. 8º §5) ─────────
// Salvo em /users/{uid}/consent para ficar isolado por usuário e
// acessível em caso de auditoria ou solicitação de exclusão (Art. 18).

export async function saveConsentToFirestore(
  uid: string,
  record: ConsentRecord
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'users', uid, 'consent', 'record'),
      {
        ...record,
        uid,
        savedAt: serverTimestamp(),
        userAgent: navigator.userAgent,   // auxílio forense mínimo
      },
      { merge: false }   // sobrescreve intencionalmente — sempre a versão mais recente
    );
  } catch (err) {
    // Não bloqueia o cadastro, mas registra em DEV para depuração
    if (import.meta.env.DEV) console.warn('[saveConsentToFirestore] erro:', err);
  }
}
