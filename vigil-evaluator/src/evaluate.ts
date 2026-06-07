// vigil-evaluator/src/evaluate.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { EvaluatorInput, EvaluationReport } from './types.js';

const API_KEY = process.env.GEMINI_API_KEY!;
const MODEL   = 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: MODEL,
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
  },
});

function buildPrompt(input: EvaluatorInput): string {
  return `
Você é um neuropsicólogo especialista em avaliação da atenção seletiva.
Receberá métricas de uma sessão de busca visual computadorizada e deve produzir
um laudo clínico enriquecido em JSON com os campos exatos abaixo.

### MÉTRICAS DA SESSÃO
${JSON.stringify(input, null, 2)}

### REGRAS
- Seja objetivo e clínico; evite linguagem coloquial.
- strengths: liste pontos positivos observáveis nos dados (mínimo 1, máximo 3).
- weaknesses: liste dificuldades observáveis nos dados (mínimo 1, máximo 3).
- recommendation: uma frase de encaminhamento ou orientação clínica.
- clinicalNote: parágrafo interpretativo de 3 a 5 linhas integrando os dados.
- score: 0–100 refletindo a performance geral inferida.
- level: um de "mínimo" | "leve" | "moderado" | "importante".

### RESPONDA APENAS com JSON válido, sem markdown, sem texto extra:
{
  "score": number,
  "level": "mínimo" | "leve" | "moderado" | "importante",
  "strengths": [string],
  "weaknesses": [string],
  "recommendation": string,
  "clinicalNote": string
}
`.trim();
}

export async function evaluate(input: EvaluatorInput): Promise<EvaluationReport> {
  const prompt = buildPrompt(input);
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  let parsed: EvaluationReport;
  try {
    parsed = JSON.parse(raw) as EvaluationReport;
  } catch {
    throw new Error(`Gemini retornou JSON inválido: ${raw.slice(0, 200)}`);
  }

  return parsed;
}
