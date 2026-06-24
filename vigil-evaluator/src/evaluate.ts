import { GoogleGenAI } from '@google/genai';
import type { EvaluatorInput, EvaluationReport } from './types';
import { buildSelectivePrompt,   SELECTIVE_EVALUATION_SCHEMA   } from './prompts/selective';
import { buildSustainedPrompt,   SUSTAINED_EVALUATION_SCHEMA   } from './prompts/sustained';
import { buildAlternatingPrompt, ALTERNATING_EVALUATION_SCHEMA } from './prompts/alternating';
import { buildDividedPrompt,     DIVIDED_EVALUATION_SCHEMA     } from './prompts/divided';
import { buildOnboardingPrompt,  ONBOARDING_EVALUATION_SCHEMA  } from './prompts/onboarding';
import { buildProgressContext } from './assessment/buildProgressContext';
import { buildLongitudinalBlock } from './prompts/_longitudinalBlock';

// ── Cliente Vertex AI ───────────────────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID!,
  location: process.env.GCP_REGION ?? 'us-central1',
});

// ── Validação mínima do retorno ─────────────────────────────────────────────────────
function validate(parsed: unknown, isOnboarding = false): any {
  if (isOnboarding) {
    // Para onboarding, o schema já obriga `mensagem_ux` e `dados_grafico_teia`. 
    // Aceitamos o que o Gemini devolver como válido caso o parser tenha funcionado.
    return parsed;
  }

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

// ── Funções de Cálculo do Onboarding (0 a 100) ──────────────────────────────────
function calculateOnboardingScores(input: any) {
  // 1. Agilidade Mental: Baseado no tempo de reação médio (250ms-400ms = alto, >600 = baixo)
  let agilidadeMental = 100;
  const rt = input.exercicio_1_calibragem?.tempo_de_reacao_medio_ms ?? 500;
  if (rt <= 250) agilidadeMental = 100;
  else if (rt <= 400) agilidadeMental = 100 - ((rt - 250) / 150) * 20; // 80 a 100
  else if (rt <= 600) agilidadeMental = 80 - ((rt - 400) / 200) * 30; // 50 a 80
  else agilidadeMental = Math.max(0, 50 - ((rt - 600) / 400) * 50); // cai para 0

  // 2 e 3. Foco Contínuo e Controle e Calma: Subtrai 10 pontos por erro de omissão/comissão
  const omissoes = input.exercicio_2_gonogo?.erros_omissao ?? 0;
  const comissoes = input.exercicio_2_gonogo?.erros_comissao_impulsividade ?? 0;
  const focoContinuo = Math.max(0, 100 - (omissoes * 10));
  const controleCalma = Math.max(0, 100 - (comissoes * 10));

  // 4. Flexibilidade Mental: Custo de alternância
  let flexibilidadeMental = 100;
  const flexCost = input.exercicio_3_alternancia?.custo_de_alternancia_segundos ?? 15;
  if (flexCost <= 5) flexibilidadeMental = 100 - (flexCost / 5) * 10; // 90 a 100
  else if (flexCost <= 15) flexibilidadeMental = 90 - ((flexCost - 5) / 10) * 40; // 50 a 90
  else flexibilidadeMental = Math.max(0, 50 - ((flexCost - 15) / 15) * 50); // cai para 0

  // 5. Foco Multitarefa: Custo de Dupla-Tarefa
  let focoMultitarefa = 100;
  const dtc = input.exercicio_4_dupla_tarefa?.custo_de_dupla_tarefa_porcento ?? 20;
  // Se custo for menor que 5%, nota próxima a 100
  if (dtc <= 5) focoMultitarefa = 100 - (dtc / 5) * 10;
  else if (dtc <= 30) focoMultitarefa = 90 - ((dtc - 5) / 25) * 40;
  else focoMultitarefa = Math.max(0, 50 - ((dtc - 30) / 70) * 50);

  return {
    "notas_finais_0_a_100": {
      "Agilidade Mental": Math.round(agilidadeMental),
      "Foco Contínuo": Math.round(focoContinuo),
      "Controle e Calma": Math.round(controleCalma),
      "Flexibilidade Mental": Math.round(flexibilidadeMental),
      "Foco Multitarefa": Math.round(focoMultitarefa)
    }
  };
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
      return { prompt: buildDividedPrompt(input),     schema: DIVIDED_EVALUATION_SCHEMA     };
    case 'onboarding':
      const notas = calculateOnboardingScores(input);
      return { prompt: buildOnboardingPrompt(JSON.stringify(notas)),  schema: ONBOARDING_EVALUATION_SCHEMA as any };
    default:
      return { prompt: buildSelectivePrompt(input as any), schema: SELECTIVE_EVALUATION_SCHEMA };
  }
}

// ── Função principal ───────────────────────────────────────────────────────────────────────────
export async function evaluateWithGemini(
  input: EvaluatorInput,
  uid?: string
): Promise<EvaluationReport> {
  const { prompt: basePrompt, schema } = resolvePromptAndSchema(input);

  let finalPrompt = basePrompt;
  if (uid) {
    try {
      const severityScoreMap: Record<string, number> = {
        minimo: 85, leve: 65, moderado: 45, importante: 25,
      };
      const estimatedScore = severityScoreMap[(input as any).severity ?? 'moderado'] ?? 55;
      const ctx = await buildProgressContext(uid, input.attentionType, estimatedScore);
      if (ctx) finalPrompt = buildLongitudinalBlock(ctx) + '\n\n' + basePrompt;
    } catch (err) {
      console.warn('[vigil-evaluator] contexto longitudinal indisponível:', err);
    }
  }

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: finalPrompt,
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

  return validate(parsed, input.attentionType === 'onboarding');
}
