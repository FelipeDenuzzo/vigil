import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { storage } from './firebase';
import db from './firebase';
import type { EvaluationReport, EvaluatorInput } from './evaluatorClient';
import { reportToMarkdown } from './reportToMarkdown';

export async function saveReport(
  report: EvaluationReport,
  input: EvaluatorInput
): Promise<string | null> {
  try {
    const md = reportToMarkdown(report, input);
    const storageRef = ref(storage, `laudos/${input.sessionId}.md`);

    console.log('[saveReport] iniciando upload Storage...');
    await uploadString(storageRef, md, 'raw', {
      contentType: 'text/markdown',
    });
    console.log('[saveReport] upload Storage OK');

    const downloadUrl = await getDownloadURL(storageRef);
    console.log('[saveReport] getDownloadURL OK:', downloadUrl);

    console.log('[saveReport] iniciando setDoc Firestore...');
    await setDoc(doc(db, 'sessions', input.sessionId), {
      sessionId: input.sessionId,
      game: input.game,
      attentionType: input.attentionType,
      score: report.score,
      level: report.level,
      reportUrl: downloadUrl,
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log('[saveReport] setDoc Firestore OK');

    return downloadUrl;
  } catch (err) {
    console.error('[saveReport] erro:', err);
    return null;
  }
}
