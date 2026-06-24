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

  // ── Atenção Seletiva — Visual Search ou Achar o Faltando ─────────────────────
  if (game === 'visual-search' || game === 'achar-o-faltando' || attentionType === 'seletiva') {
    const input = body as any;
    if (!input.severity) {
      res.status(400).json({ error: 'Invalid payload for selective attention: missing severity' });
      return;
    }
    if (game === 'visual-search' && input.commissionRate === undefined) {
      res.status(400).json({ error: 'Invalid payload for visual-search: missing commissionRate' });
      return;
    }

    if (game === 'visual-search') {
      evaluateVisualSearch(input);
    }

    try {
      const uid: string | undefined = typeof body.uid === 'string' ? body.uid : undefined;
      const aiReport = await evaluateWithGemini(input as unknown as EvaluatorInput, uid) as any;
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
    const input = body as any;
    if (!input.severity || input.completedPhases === undefined) {
      res.status(400).json({ error: 'Invalid payload for long-mazes: missing severity or completedPhases' });
      return;
    }

    try {
      const uid: string | undefined = typeof body.uid === 'string' ? body.uid : undefined;
      const aiReport = await evaluateWithGemini(input, uid) as any;
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
      const uid: string | undefined = typeof body.uid === 'string' ? body.uid : undefined;
      const aiReport = await evaluateWithGemini(input, uid) as any;
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

  // ── Atenção Dividida — Cofre Mental ou Escuta Seletiva ───────────────────────
  if (game === 'cofre-mental' || game === 'escuta-seletiva' || attentionType === 'dividida') {
    console.log(`[evaluateRouter] Recebida avaliação de Atenção Dividida. game=${game}, sessionId=${body.sessionId}`);
    const input = body as any;
    if (!input.severity) {
      res.status(400).json({ error: 'Invalid payload for divided attention: missing severity' });
      return;
    }

    try {
      const uid: string | undefined = typeof body.uid === 'string' ? body.uid : undefined;
      const aiReport = await evaluateWithGemini(input, uid) as any;
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
      console.error('Erro ao gerar laudo Gemini (dividida):', error);
      res.status(500).json({ error: 'Gemini evaluation failed' });
    }
    return;
  }

  // ── Onboarding ──────────────────────────────────────────────────────────────
  if (attentionType === 'onboarding') {
    const input = body as any;
    try {
      const uid: string | undefined = typeof body.uid === 'string' ? body.uid : undefined;
      const aiReport = await evaluateWithGemini(input, uid);
      res.json(aiReport); // Retorna direto o JSON de onboarding
    } catch (error) {
      console.error('Erro ao gerar laudo Gemini (onboarding):', error);
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
