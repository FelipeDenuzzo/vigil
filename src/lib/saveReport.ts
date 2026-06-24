import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from './firebase';
import db from './firebase';
import type { EvaluationReport, EvaluatorInput } from './evaluatorClient';

export async function saveReport(
  report: EvaluationReport,
  input: EvaluatorInput
): Promise<string | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    if (import.meta.env.DEV) console.warn('[saveReport] usuário não autenticado');
    return null;
  }

  try {
    await setDoc(doc(db, 'sessions', input.sessionId), {
      uid,                              // ← campo obrigatório para as Security Rules
      sessionId:     input.sessionId,
      game:          input.game,
      attentionType: input.attentionType,
      score:         report.score,
      level:         report.level,
      createdAt:     serverTimestamp(),
    }, { merge: true });

    return "saved";
  } catch (err) {
    if (import.meta.env.DEV) console.error('[saveReport] erro:', err);
    return null;
  }
}
