import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, storage } from './firebase';
import db from './firebase';
import type { EvaluationReport, EvaluatorInput } from './evaluatorClient';
import { reportToMarkdown } from './reportToMarkdown';

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
    const md = reportToMarkdown(report, input);
    // Laudos no Storage isolados por uid (acessíveis apenas pelo profissional via console/admin)
    const storageRef = ref(storage, `laudos/${uid}/${input.sessionId}.md`);

    await uploadString(storageRef, md, 'raw', { contentType: 'text/markdown' });
    const downloadUrl = await getDownloadURL(storageRef);

    await setDoc(doc(db, 'sessions', input.sessionId), {
      uid,                              // ← campo obrigatório para as Security Rules
      sessionId:     input.sessionId,
      game:          input.game,
      attentionType: input.attentionType,
      score:         report.score,
      level:         report.level,
      reportUrl:     downloadUrl,
      createdAt:     serverTimestamp(),
    }, { merge: true });

    return downloadUrl;
  } catch (err) {
    console.error('[saveReport] erro:', err);
    return null;
  }
}
