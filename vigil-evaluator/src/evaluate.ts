import { GoogleGenAI } from '@google/genai';
import type { EvaluatorInput, EvaluationReport } from './types';
import { buildSelectivePrompt,   SELECTIVE_EVALUATION_SCHEMA   } from './prompts/selective';
import { buildSustainedPrompt,   SUSTAINED_EVALUATION_SCHEMA   } from './prompts/sustained';
import { buildAlternatingPrompt, ALTERNATING_EVALUATION_SCHEMA } from './prompts/alternating';

// ── Cliente Vertex AI ───────────────────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID!,
  location: process.env.GCP_REGION ?? 'us-central1',
});

// ── Validação mínima do retorno ─────────────────────────────────────────────────────
function validate(parsed: unknown): EvaluationReport {
  const r = parsed as EvaluationReport;
  const validLevels = ['mínimo', 'minimo', 'leve', 'moderado', 'importante'];

  if (typeof r.score !== 'number' || r.score < 0 || r.score > 100) {
    throw new Error('EvaluationReport inválido: score ausente ou fora do range.');
  }
  if (!validLevels.includes(r.level)) {
    throw new Error(`EvaluationReport inválido: level "${r.level}" não reconhecido.`);
  }
  if ((r.level as string) === 'minimo') r.level = 'mínimo';

  // Valida campos flat general/clinical do novo schema de duas camadas
  if (typeof r.generalSummary !== 'string' || typeof r.clinicalNote !== 'string') {
    throw new Error('EvaluationReport inválido: generalSummary ou clinicalNote ausentes ou inválidos.');
  }
  if (!Array.isArray(r.generalStrengths) || !Array.isArray(r.generalWeaknesses)) {
    throw new Error('EvaluationReport inválido: generalStrengths ou generalWeaknesses ausentes.');
  }
  if (!Array.isArray(r.clinicalStrengths) || !Array.isArray(r.clinicalWeaknesses)) {
    throw new Error('EvaluationReport inválido: clinicalStrengths ou clinicalWeaknesses ausentes.');
  }
  if (typeof r.generalRecommendation !== 'string' || typeof r.clinicalRecommendation !== 'string') {
    throw new Error('EvaluationReport inválido: generalRecommendation ou clinicalRecommendation ausentes.');
  }

  return r;
}

// ── Seleção de prompt e schema por tipo de atenção ─────────────────────────────────
function resolvePromptAndSchema(input: EvaluatorInput) {
  switch (input.attentionType) {
    case 'seletiva':
      return { prompt: buildSelectivePrompt(input),   schema: SELECTIVE_EVALUATION_SCHEMA   };
    case 'sustentada':
      return { prompt: buildSustainedPrompt(input),   schema: SUSTAINED_EVALUATION_SCHEMA   };
    case 'alternada':
      return { prompt: buildAlternatingPrompt(input), schema: ALTERNATING_EVALUATION_SCHEMA };
    case 'dividida':
      return { prompt: buildAlternatingPrompt(input as any), schema: ALTERNATING_EVALUATION_SCHEMA };
    default:
      return { prompt: buildSelectivePrompt(input as any), schema: SELECTIVE_EVALUATION_SCHEMA };
  }
}

// ── Função principal ───────────────────────────────────────────────────────────────────────────
export async function evaluateWithGemini(
  input: EvaluatorInput
): Promise<EvaluationReport> {
  const { prompt, schema } = resolvePromptAndSchema(input);

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  });

  const raw = response.text ?? '';
  if (!raw) throw new Error('Resposta vazia do Gemini.');

  // Com responseMimeType: 'application/json' o Gemini garante JSON válido direto.
  // Não aplicamos sanitização manual que pode corromper strings com pontuação.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    // Fallback: tenta extrair objeto JSON caso haja texto extra na borda
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(`Não foi possível localizar JSON na resposta: ${raw.slice(0, 300)}`);
    }
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch (err) {
      throw new Error(`JSON parse falhou após extrução: ${raw.slice(start, start + 400)} | Erro: ${err}`);
    }
  }

  return validate(parsed);
}
