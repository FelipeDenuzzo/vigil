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

function buildLudic(score: number): LudicReport {
  if (score >= 90) return { score, label: 'Excelente!',        emoji: '🏆' };
  if (score >= 75) return { score, label: 'Muito bom!',        emoji: '⭐' };
  if (score >= 60) return { score, label: 'Bom desempenho!',   emoji: '👍' };
  if (score >= 45) return { score, label: 'Em progresso.',     emoji: '💪' };
  return                  { score, label: 'Precisa praticar.', emoji: '🌱' };
}

function buildPrompt(input: EvaluatorInput): string {
  const noEngagementWarning = input.totalClicks === 0
    ? `
ATENÇÃO — SESSÃO SEM ENGAJAMENTO MOTOR:
totalClicks é 0. O usuário não emitiu nenhuma resposta motora durante a sessão.
Por isso:
- score DEVE ser 0 (zero numérico). Não use null, string ou omita o campo.
- level DEVE ser "importante".
- A taxa de comissão de 0% NÃO indica controle inibitório preservado.
- A ausência de negligência espacial NÃO pode ser confirmada sem coordenadas de clique.
- general.strengths e clinical.strengths NÃO devem conter itens baseados em
  ausência de erros de comissão ou ausência de negligência espacial.
- Descreva a sessão como sem engajamento motor suficiente para avaliação.
- clinical.clinicalNote deve mencionar explicitamente que os dados são insuficientes
  para inferir pontos preservados ou alterados nos domínios dependentes de resposta motora.
`
    : '';

  return `
Você é um neuropsicólogo especialista em avaliação da atenção seletiva.
Rececerá métricas de uma sessão de busca visual computadorizada e deve produzir
um laudo em JSON com os campos exatos abaixo.

### MÉTRICAS DA SESSÃO
${JSON.stringify(input, null, 2)}
${noEngagementWarning}
### REGRAS
- Seja objetivo; evite linguagem coloquial.
- general.summary: 1-2 frases acessíveis ao leigo resumindo o desempenho.
- general.strengths / general.weaknesses: pontos observáveis nos dados (mín 1, máx 3 cada).
- general.recommendation: uma frase de orientação acessível.
- clinical.strengths / clinical.weaknesses: análise técnica (mín 1, máx 3 cada).
- clinical.recommendation: encaminhamento clínico formal.
- clinical.clinicalNote: parágrafo técnico de 3-5 linhas integrando os dados.
- score: 0–100 refletindo a performance geral. score=0 é válido para sessões sem interação.
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

function sanitizeJsonStrings(jsonText: string): string {
  return jsonText.replace(
    /:\s*"([\s\S]*?)(?<!\\)"/g,
    (_match, inner: string) => {
      const escaped = inner
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `: "${escaped}"`;
    }
  );
}

function validateResponse(parsed: unknown): Omit<EvaluationReport, 'ludic'> {
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.score !== 'number' || obj.score < 0 || obj.score > 100) {
    throw new Error('score é obrigatório e deve ser um número entre 0 e 100');
  }
  if (!obj.level || !['mínimo', 'leve', 'moderado', 'importante'].includes(String(obj.level))) {
    throw new Error('level inválido: deve ser mínimo, leve, moderado ou importante');
  }
  if (!obj.general || typeof obj.general !== 'object') {
    throw new Error('general é obrigatório e deve ser um objeto');
  }
  if (!obj.clinical || typeof obj.clinical !== 'object') {
    throw new Error('clinical é obrigatório e deve ser um objeto');
  }

  const general = obj.general as Record<string, unknown>;
  if (!general.summary || !Array.isArray(general.strengths) || !Array.isArray(general.weaknesses)) {
    throw new Error('general deve ter summary, strengths e weaknesses');
  }

  const clinical = obj.clinical as Record<string, unknown>;
  if (!Array.isArray(clinical.strengths) || !Array.isArray(clinical.weaknesses)) {
    throw new Error('clinical deve ter strengths, weaknesses, recommendation e clinicalNote');
  }

  return obj as Omit<EvaluationReport, 'ludic'>;
}

export async function evaluate(input: EvaluatorInput): Promise<EvaluationReport> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  const prompt = buildPrompt(input);
  const result = await model.generateContent(prompt);

  if (!result.response) {
    throw new Error('Resposta vazia do Gemini (sem response)');
  }

  const raw = result.response.text();
  if (!raw || raw.trim().length === 0) {
    throw new Error('Resposta vazia do Gemini (text vazio)');
  }

  const clean = extractJson(raw);
  if (!clean || clean.trim().length === 0) {
    throw new Error(`Nenhum JSON encontrado na resposta: ${raw.slice(0, 200)}`);
  }

  const safeJson = sanitizeJsonStrings(clean);

  let parsed: unknown;
  try {
    parsed = JSON.parse(safeJson);
  } catch (e) {
    throw new Error(`JSON parse falhou: ${clean.slice(0, 400)} | Erro: ${String(e)}`);
  }

  const validated = validateResponse(parsed);
  return { ...validated, ludic: buildLudic(validated.score) };
}
