// src/lib/useConsent.ts
// Persiste o consentimento LGPD no localStorage após aceite no cadastro.
// Cada campo corresponde a uma base legal da Lei 13.709/2018.

export interface ConsentRecord {
  version:          string;   // versão da política aceita
  acceptedAt:       string;   // ISO 8601
  terms:            boolean;  // aceite dos termos de uso (obrigatório)
  privacyPolicy:    boolean;  // leitura da política de privacidade (obrigatório)
  healthData:       boolean;  // consentimento explícito p/ dados cognitivos/saúde (obrigatório)
  communications:   boolean;  // e-mails de novidades (opcional)
}

const KEY     = 'vigil_consent_v1';
export const POLICY_VERSION = '1.0';

export function saveConsent(record: ConsentRecord): void {
  localStorage.setItem(KEY, JSON.stringify(record));
}

export function loadConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
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
