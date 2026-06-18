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
totalClicks é 0. O usuário não emitiu nenhuma resposta durante a sessão.
Por isso:
- score DEVE ser 0 (zero numérico). Não use null, string ou omita o campo.
- level DEVE ser "importante".
- A ausência de erros NÃO indica bom desempenho — indica ausência de resposta.
- general.strengths e clinical.strengths NÃO devem conter pontos positivos baseados em ausência de erros.
- Descreva a sessão como sem interação suficiente para avaliação.
- clinical.clinicalNote deve mencionar que não houve cliques registrados e que os dados são insuficientes para avaliar qualquer aspecto do desempenho.
`
    : '';

  return `
Você é um especialista em avaliação cognitiva para um aplicativo de treino de atenção.
Receberá métricas de uma sessão de busca visual computadorizada e deve produzir
um laudo em JSON com os campos exatos abaixo.

### MÉTRICAS DA SESSÃO
${JSON.stringify(input, null, 2)}
${noEngagementWarning}

### REGRAS ABSOLUTAS DE LINGUAGEM — LEIA ANTES DE TUDO

**PROIBIÇÃO TOTAL** — jamais use estas palavras ou expressões em qualquer campo, nem de forma indireta, parafraseada ou com hífen:
"comprometimento", "déficit", "patologia", "diagnóstico",
"negligência", "hemi-negligência", "negligência lateral", "negligência espacial", "negligência hemiespacial",
"controle inibitório", "lentificação", "lentificação cognitiva",
"rastreio visual", "sensibilidade atencional", "flutuação da vigilância",
"impulsividade", "varredura caótica", "imaturidade executiva",
"atenção lateralizada", "hemicampo", "perfil atencional difuso".

**TOM OBRIGATÓRIO** — toda a resposta deve ser:
- Escrita como se você estivesse explicando para alguém sem formação em saúde.
- Encorajadora e descritiva, nunca alarmista ou clínica.
- Baseada no que foi observado nesta sessão específica, não em rótulos gerais.
- Quando precisar explicar algo técnico, use frases como: "o ideal seria...", "nesta sessão foi observado...", "isso pode indicar...".

### GUIA DE INTERPRETAÇÃO DAS MÉTRICAS

**Velocidade de resposta (meanReactionTimeMs)**
Mede quanto tempo a pessoa demorou, em média, para clicar nos alvos corretos.
- Abaixo de 800ms: muito rápido, pode ter clicado sem verificar direito
- Entre 800ms e 1500ms: velocidade adequada para este tipo de tarefa
- Entre 1500ms e 2500ms: um pouco mais lento que o ideal
- Acima de 2500ms: resposta notavelmente lenta nesta sessão
A variação entre as respostas (reactionTimeStdDev) indica consistência: valores altos significam que às vezes foi rápido, às vezes muito lento.

**Erros por omissão (omissionRate) e por excesso (commissionRate)**
Omissões: alvos que existiam mas não foram clicados. Acima de 20% indica que muitos alvos passaram despercebidos.
Cliques em excesso: alvos incorretos que foram clicados. Acima de 15% indica que a pessoa clicou em elementos que não deveriam ser selecionados.
Quando ambos são altos ao mesmo tempo, o desempenho geral foi impreciso.

**Organização da busca (meanOrganizationIndex e predominantScanPattern)**
Indica se a pessoa percorreu a tela de forma sistemática (linha por linha, coluna por coluna) ou de forma dispersa.
Valores próximos de 1.0 ou padrões "row-wise"/"column-wise" = busca organizada.
Valores abaixo de 0.4 ou padrão "mixed" = busca pouco organizada nesta sessão.

**Capacidade de distinguir alvos (dPrime)**
Mede o quanto a pessoa conseguiu separar os alvos corretos dos incorretos.
- Acima de 2.0: boa distinção entre alvos e distratores
- Entre 1.0 e 2.0: distinção moderada
- Abaixo de 1.0: dificuldade em identificar quais elementos deveriam ser clicados
Se o valor não estiver disponível, não faça inferências sobre este aspecto.

**Tipos de erro (shapeErrors, colorErrors, doubleErrors)**
Erros de forma: confundiu o formato do alvo.
Erros de cor: confundiu a cor do alvo.
Erros duplos em alta proporção: clicou em muitos elementos errados de forma aleatória.

**Distribuição dos erros na tela (spatialProfile)**
Indica se os erros se concentraram em alguma região específica da tela (esquerda, direita, etc.).
Cite os valores brutos de leftMisses e rightMisses de forma simples e descritiva, sem inferências clínicas.
Exemplo aceitável: "a maioria dos alvos não clicados estava no lado direito da tela".
NÃO insinue causas neurológicas ou lateralização de atenção.

### FORMATO DE SAÍDA

**general.summary**: texto corrido de 2–3 frases descrevendo o que aconteceu na sessão em linguagem simples. O que foi observado em velocidade, acertos e erros.

**general.strengths**: lista de 1–3 pontos positivos concretos desta sessão, escritos de forma encorajadora.

**general.weaknesses**: lista de 1–3 pontos de melhoria desta sessão, descritos sem alarmismo.

**general.recommendation**: uma frase de orientação prática.

**clinical.strengths**: lista de 1–4 pontos positivos. Para cada um, escreva: o que foi avaliado, qual seria o resultado ideal, e como esta sessão se saiu. Exemplo: "Precisão nos cliques: o ideal é clicar apenas nos alvos corretos. Nesta sessão, a taxa de erros foi baixa, o que mostra boa capacidade de identificar os elementos certos."

**clinical.weaknesses**: lista de 1–4 pontos de atenção. Para cada um, escreva: o que foi avaliado, qual seria o resultado ideal, e o que foi observado. Cite os números de forma acessível. Exemplo: "Velocidade de resposta: o ideal é responder em menos de 1,5 segundo. Nesta sessão, a média foi de X segundos."

**clinical.recommendation**: uma orientação prática baseada nos achados, sem jargões.

**clinical.clinicalNote**: texto corrido de 4–6 linhas para o usuário. Estruture assim:
  (1) O que foi observado de forma geral nesta sessão.
  (2) Como foi a velocidade e a precisão — cite os números de forma simples.
  (3) Como foi a forma de percorrer a tela e se houve concentração de erros em alguma região.
  (4) O que esse padrão pode indicar, explicado de forma simples, sem diagnóstico e sem termos clínicos.

**score**: número de 0 a 100 refletindo a performance geral.
**level**: um de "mínimo" | "leve" | "moderado" | "importante".

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
