// vigil-evaluator/src/index.ts
// Servidor Express — POST /evaluate
// Protegido por header x-evaluator-secret

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { evaluate } from './evaluate.js';
import type { EvaluatorInput } from './types.js';

const app    = express();
const PORT   = parseInt(process.env.PORT ?? '8080', 10);
const SECRET = process.env.EVALUATOR_SECRET;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://vigil-app.vercel.app',
    'https://vigil-felipedenuzzos-projects.vercel.app',
    'https://vigil-git-main-felipedenuzzos-projects.vercel.app',
    'https://atento-felipedenuzzos-projects.vercel.app',
    'https://atento-git-main-felipedenuzzos-projects.vercel.app',
  ],
  methods: ['POST', 'GET', 'OPTIONS'],
}));
app.use(express.json());

// Health check exigido pelo Cloud Run
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post('/evaluate', async (req: Request, res: Response) => {
  // Valida secret
  if (SECRET && req.headers['x-evaluator-secret'] !== SECRET) {
    res.status(401).json({ error: 'Não autorizado.' });
    return;
  }

  const input = req.body as EvaluatorInput;

  if (!input?.sessionId || typeof input.commissionRate !== 'number') {
    res.status(400).json({ error: 'Payload inválido: sessionId e commissionRate são obrigatórios.' });
    return;
  }

  try {
    const report = await evaluate(input);
    res.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    console.error('[vigil-evaluator] erro:', message);
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`vigil-evaluator rodando na porta ${PORT}`);
});
