// vigil-evaluator/src/index.ts
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { evaluate } from './evaluate.js';
import type { EvaluatorInput, EvaluationJob } from './types.js';

if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;
  initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : undefined);
}

const db = getFirestore();
const JOBS = 'evaluation_jobs';

const app    = express();
const PORT   = parseInt(process.env.PORT ?? '8080', 10);
const SECRET = process.env.EVALUATOR_SECRET;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://vigil-app.vercel.app',
    'https://vigil-rouge.vercel.app',
    'https://vigil-felipedenuzzos-projects.vercel.app',
    'https://vigil-git-main-felipedenuzzos-projects.vercel.app',
    'https://atento-felipedenuzzos-projects.vercel.app',
    'https://atento-git-main-felipedenuzzos-projects.vercel.app',
  ],
  methods: ['POST', 'GET', 'OPTIONS'],
}));
app.use(express.json());

function authGuard(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers['x-evaluator-secret'];
  const incoming = Array.isArray(raw) ? raw[0] : raw;
  if (SECRET && incoming !== SECRET) {
    res.status(401).json({ error: 'Não autorizado.' });
    return;
  }
  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post('/evaluate', authGuard, async (req: Request, res: Response) => {
  const input = req.body as EvaluatorInput;
  if (!input?.sessionId || typeof input.commissionRate !== 'number') {
    res.status(400).json({ error: 'Payload inválido.' });
    return;
  }
  const jobId = randomUUID();
  const now   = Date.now();
  const job: EvaluationJob = {
    jobId,
    sessionId: input.sessionId,
    status: 'pending',
    payload: input,
    result: null,
    error: null,
    createdAt: now,
    finishedAt: null,
  };
  await db.collection(JOBS).doc(jobId).set(job);
  res.json({ jobId });
  processJob(jobId, input).catch((err) => {
    console.error(`[vigil-evaluator] erro fatal no job ${jobId}:`, err);
  });
});

app.get('/evaluate/status/:jobId', authGuard, async (req: Request, res: Response) => {
  const jobId = String(req.params.jobId);
  const snap = await db.collection(JOBS).doc(jobId).get();
  if (!snap.exists) {
    res.status(404).json({ error: 'Job não encontrado.' });
    return;
  }
  const job = snap.data() as EvaluationJob;
  res.json({
    jobId:      job.jobId,
    sessionId:  job.sessionId,
    status:     job.status,
    result:     job.result,
    error:      job.error,
    createdAt:  job.createdAt,
    finishedAt: job.finishedAt,
  });
});

async function processJob(jobId: string, input: EvaluatorInput): Promise<void> {
  try {
    const result = await evaluate(input);
    await db.collection(JOBS).doc(jobId).update({ status: 'done', result, finishedAt: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.collection(JOBS).doc(jobId).update({ status: 'error', error: message, finishedAt: Date.now() });
  }
}

app.listen(PORT, () => {
  console.log(`vigil-evaluator rodando na porta ${PORT}`);
});
