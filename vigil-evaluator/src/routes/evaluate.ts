import { Router, Request, Response } from 'express';
import { evaluateVisualSearch, VisualSearchInput } from '../evaluators/visualSearch';
import { evaluateWithGemini } from '../evaluate';
import type { EvaluatorInput, AlternatingEvaluatorInput } from '../types';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body;

  if (!body || !body.sessionId) {
    res.status(400).json({ error: 'Missing required field: sessionId' });
    return;
  }

  const game          = body.game          as string | undefined;
  const attentionType = body.attentionType as string | undefined;

  // ── Atenção Seletiva — Visual Search ───────────────────────────────────────────
  if (game === 'visual-search' || attentionType === 'seletiva') {
    const input = body as VisualSearchInput;
    if (!input.severity || input.commissionRate === undefined) {
      res.status(400).json({ error: 'Invalid payload for visual-search: missing severity or commissionRate' });
      return;
    }

    const result = evaluateVisualSearch(input);

    try {
      const aiReport = await evaluateWithGemini(input as unknown as EvaluatorInput) as any;
      const level = (aiReport.level as string) === 'minimo' ? 'mínimo' : aiReport.level;

      res.json({
        score:    aiReport.score,
        severity: level,
        report: {
          ludic: {
            score: aiReport.score,
            label: levelToLabel(level),
            emoji: levelToEmoji(level),
          },
          general: {
            summary:        aiReport.generalSummary        ?? '',
            strengths:      aiReport.generalStrengths      ?? [],
            weaknesses:     aiReport.generalWeaknesses     ?? [],
            recommendation: aiReport.generalRecommendation ?? '',
          },
          clinical: {
            strengths:      aiReport.clinicalStrengths      ?? [],
            weaknesses:     aiReport.clinicalWeaknesses     ?? [],
            recommendation: aiReport.clinicalRecommendation ?? '',
            clinicalNote:   aiReport.clinicalNote           ?? '',
          },
        },
      });
    } catch (error) {
      console.error('Erro ao gerar laudo Gemini (seletiva):', error);
      res.status(500).json({ error: 'Gemini evaluation failed' });
    }
    return;
  }

  // ── Atenção Sustentada — Long Mazes ──────────────────────────────────────────
  if (game === 'long-mazes' || attentionType === 'sustentada') {
    const input = body as EvaluatorInput;
    if (!input.severity || (input as any).completedPhases === undefined) {
      res.status(400).json({ error: 'Invalid payload for long-mazes: missing severity or completedPhases' });
      return;
    }

    try {
      const aiReport = await evaluateWithGemini(input) as any;
      const level = (aiReport.level as string) === 'minimo' ? 'mínimo' : aiReport.level;

      res.json({
        score:    aiReport.score,
        severity: level,
        report: {
          ludic: {
            score: aiReport.score,
            label: levelToLabel(level),
            emoji: levelToEmoji(level),
          },
          general: {
            summary:        aiReport.clinicalNote   ?? '',
            strengths:      aiReport.strengths      ?? [],
            weaknesses:     aiReport.weaknesses     ?? [],
            recommendation: aiReport.recommendation ?? '',
          },
          clinical: {
            strengths:      aiReport.strengths      ?? [],
            weaknesses:     aiReport.weaknesses     ?? [],
            recommendation: aiReport.recommendation ?? '',
            clinicalNote:   aiReport.clinicalNote   ?? '',
          },
        },
      });
    } catch (error) {
      console.error('Erro ao gerar laudo Gemini (sustentada):', error);
      res.status(500).json({ error: 'Gemini evaluation failed' });
    }
    return;
  }

  // ── Atenção Alternada — Color Shape ─────────────────────────────────────────
  if (game === 'color-shape' || attentionType === 'alternada') {
    const input = body as AlternatingEvaluatorInput;
    if (!input.severity || input.totalTrials === undefined) {
      res.status(400).json({ error: 'Invalid payload for color-shape: missing severity or totalTrials' });
      return;
    }

    try {
      const aiReport = await evaluateWithGemini(input) as any;
      const level = (aiReport.level as string) === 'minimo' ? 'mínimo' : aiReport.level;

      res.json({
        score:    aiReport.score,
        severity: level,
        report: {
          ludic: {
            score: aiReport.score,
            label: levelToLabel(level),
            emoji: levelToEmoji(level),
          },
          general: {
            summary:        aiReport.generalSummary        ?? '',
            strengths:      aiReport.generalStrengths      ?? [],
            weaknesses:     aiReport.generalWeaknesses     ?? [],
            recommendation: aiReport.generalRecommendation ?? '',
          },
          clinical: {
            strengths:      aiReport.clinicalStrengths      ?? [],
            weaknesses:     aiReport.clinicalWeaknesses     ?? [],
            recommendation: aiReport.clinicalRecommendation ?? '',
            clinicalNote:   aiReport.clinicalNote           ?? '',
          },
        },
      });
    } catch (error) {
      console.error('Erro ao gerar laudo Gemini (alternada):', error);
      res.status(500).json({ error: 'Gemini evaluation failed' });
    }
    return;
  }

  // ── Tipo desconhecido ──────────────────────────────────────────────────────────────
  res.status(400).json({ error: `Unknown game/attentionType: game=${game}, attentionType=${attentionType}` });
});

// ── Helpers de label lúdico ─────────────────────────────────────────────────────────

function levelToLabel(level: string): string {
  switch (level) {
    case 'mínimo':    return 'Excelente desempenho';
    case 'leve':      return 'Bom desempenho';
    case 'moderado':  return 'Desempenho regular';
    case 'importante':return 'Precisa de atenção';
    default:          return 'Resultado processado';
  }
}

function levelToEmoji(level: string): string {
  switch (level) {
    case 'mínimo':    return '🌟';
    case 'leve':      return '👍';
    case 'moderado':  return '📊';
    case 'importante':return '🔔';
    default:          return '🧩';
  }
}

export default router;
