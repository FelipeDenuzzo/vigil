import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import evaluateRouter from './routes/evaluate';

const app = express();

// CORS — permite requisições do frontend Vercel e localhost
const ALLOWED_ORIGINS = [
  'https://vigil-rouge.vercel.app',
  'https://vigil.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-evaluator-secret'],
  maxAge: 86400
}));

app.use(express.json({ limit: '64kb' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(
    JSON.stringify({
      severity: 'INFO',
      message: `${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
    })
  );
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/evaluate', evaluateRouter);

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  console.log(
    JSON.stringify({
      severity: 'INFO',
      message: `vigil-evaluator iniciado`,
      port,
      project: process.env.GCP_PROJECT_ID ?? '(não definido)',
      region: process.env.GCP_REGION ?? 'us-central1',
    })
  );
});
