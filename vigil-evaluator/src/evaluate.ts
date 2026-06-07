// vigil-evaluator/src/evaluate.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { EvaluatorInput, EvaluationReport, LudicReport } from './types.js';

const API_KEY = process.env.GEMINI_API_KEY!;
const MODEL   = 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: MODEL,
  generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
});

// Calcula o nível lúdico localmente — sem gastar tokens do Gemini
function buildLudic(score: number): LudicReport {
  if (score >= 90) return { score, label: 'Excelente!',      emoji: '🏆' };
  if (score >= 75) return { score, label: 'Muito bom!',      emoji: '⭐' };
  if (score >= 60) return { score, label: 'Bom desempenho!', emoji: '👍' };
  if (score >= 45) return { score, label: 'Em progresso.',   emoji: '💪' };
  return                  { score, label: 'Precisa praticar.', emoji: '🌱' };
}

function buildPrompt(input: EvaluatorInput): string {
  return `
Você é um neuropsicólogo especialista em avaliação da atenção seletiva.
Receberá métricas de uma sessão de busca visual computadorizada e deve produzir
um laudo em JSON com os campos exatos abaixo.

### MÉTRICAS DA SESSÃO
${JSON.stringify(input, null, 2)}

### REGRAS
- Seja objetivo; evite linguagem coloquial.
- general.summary: 1-2 frases acessíveis ao leigo resumindo o desempenho.
- general.strengths / general.weaknesses: pontos observáveis nos dados (mín 1, máx 3 cada).
- general.recommendation: uma frase de orientação acessível.
- clinical.strengths / clinical.weaknesses: análise técnica (mín 1, máx 3 cada).
- clinical.recommendation: encaminhamento clínico formal.
- clinical.clinicalNote: parágrafo técnico de 3-5 linhas integrando os dados.
- score: 0–100 refletindo a performance geral.
- level: um de "mínimo" | "leve" | "moderado" | "importante".

### RESPONDA APENAS com JSON válido, sem markdown, sem texto extra:
{
  "score": number,
  "level": "mínimo" | "leve" | "moderado" | "importante",
  "general": {
    "summary": string,
    "strengths": [string],
    "weaknesses": [string],
    "recommendation": string
  },
  "clinical": {
    "strengths": [string],
    "weaknesses": [string],
    "recommendation": string,
    "clinicalNote": string
  }
}
`.trim();
}

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);
  return raw;
}

export async function evaluate(input: EvaluatorInput): Promise<EvaluationReport> {
  const prompt = buildPrompt(input);
  const result = await model.generateContent(prompt);
  const raw    = result.response.text();
  const clean  = extractJson(raw);

  let parsed: Omit<EvaluationReport, 'ludic'>;
  try {
    parsed = JSON.parse(clean) as Omit<EvaluationReport, 'ludic'>;
  } catch {
    throw new Error(`Gemini retornou JSON inválido: ${raw.slice(0, 300)}`);
  }

  return { ...parsed, ludic: buildLudic(parsed.score) };
}
