// vigil-evaluator/src/evaluate.ts
// Monta o prompt e chama o Gemini via Vertex AI SDK.
// Retorna EvaluationReport com campos fixos (JSON forçado pelo prompt).

import { VertexAI } from '@google-cloud/vertexai';
import type { EvaluatorInput, EvaluationReport } from './types.js';

const PROJECT  = process.env.GCP_PROJECT_ID!;
const LOCATION = process.env.GCP_REGION ?? 'us-central1';
const MODEL    = 'gemini-2.0-flash-001';

const vertex = new VertexAI({ project: PROJECT, location: LOCATION });
const model  = vertex.getGenerativeModel({ model: MODEL });

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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  });

  const raw = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  let parsed: EvaluationReport;
  try {
    parsed = JSON.parse(raw) as EvaluationReport;
  } catch {
    throw new Error(`Gemini retornou JSON inválido: ${raw.slice(0, 200)}`);
  }

  return parsed;
}
