// vigil-evaluator/src/index.ts
// Servidor Express — POST /evaluate

import express from 'express';
import type { Request, Response } from 'express';
import { evaluate } from './evaluate.js';
import type { EvaluatorInput } from './types.js';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '8080', 10);

app.use(express.json());

// Health check exigido pelo Cloud Run
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post('/evaluate', async (req: Request, res: Response) => {
  const input = req.body as EvaluatorInput;

  // Validação mínima
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
