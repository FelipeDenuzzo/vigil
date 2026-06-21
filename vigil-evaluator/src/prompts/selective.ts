import { Type } from '@google/genai';
import type { SelectiveEvaluatorInput } from '../types';

// ─── Schema de resposta forçado via Structured Output ───────────────────────
export const SELECTIVE_EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Laudo clínico enriquecido de atenção visual',
  properties: {
    score: {
      type: Type.NUMBER,
      description: 'Pontuação global de desempenho, de 0 (muito prejudicado) a 100 (sem alterações).',
    },
    level: {
      type: Type.STRING,
      enum: ['mínimo', 'leve', 'moderado', 'importante'],
      description: 'Classificação clínica de comprometimento, coerente com a severidade informada.',
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Aspectos preservados observados (pode ser vazio se não houver engajamento).',
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Fragilidades identificadas no padrão de desempenho (2–4 itens).',
    },
    recommendation: {
      type: Type.STRING,
      description: 'Orientação objetiva e cautelosa para o avaliador ou equipe clínica.',
    },
    clinicalNote: {
      type: Type.STRING,
      description: 'Interpretação narrativa técnica. Não fechar diagnóstico. Sem inferências além dos dados.',
    },
  },
  required: ['score', 'level', 'strengths', 'weaknesses', 'recommendation', 'clinicalNote'],
};

// ─── Prompt clínico — Atenção Seletiva ──────────────────────────────────────
export function buildSelectivePrompt(input: SelectiveEvaluatorInput): string {
  const spatialProfile  = input.spatialProfile;
  const errorProfile    = input.errorProfile;
  const commissionRate  = input.commissionRate ?? 0;
  const totalClicks     = input.totalClicks    ?? 0;

  const neglectInfo = input.spatialNeglect
    ? `Negligência espacial detectada no lado: ${spatialProfile?.spatialNeglectSide ?? 'indeterminado'}.`
    : 'Sem indicadores de negligência espacial.';

  const quadrantLines = Object.entries(spatialProfile?.byQuadrant ?? {})
    .map(
      ([q, v]) =>
        `  ${q}: ${v.hits} acertos, ${v.errors} erros (taxa ${(v.errorRate * 100).toFixed(1)}%)`
    )
    .join('\n');

  const noEngagementWarning = totalClicks === 0
    ? `
ATENÇÃO — SESSÃO SEM ENGAJAMENTO MOTOR:
totalClicks é 0. O usuário não emitiu nenhuma resposta motora durante a sessão.
Por isso:
- A taxa de comissão de 0% NÃO indica controle inibitório preservado. Ausência de cliques
  impede qualquer inferência sobre inibição de resposta.
- A ausência de negligência espacial NÃO pode ser confirmada, pois não há coordenadas
  de clique para analisar.
- O campo strengths NÃO deve conter itens baseados em ausência de erros de comissão
  ou ausência de negligência quando totalClicks = 0.
- É PERMITIDO (e esperado) que a lista de 'strengths' fique vazia nesta situação.
- A sessão deve ser descrita como sem engajamento motor suficiente para avaliação.
- clinicalNote deve mencionar explicitamente que os dados são insuficientes para
  inferir pontos preservados ou alterados nos domínios dependentes de resposta motora.
`
    : '';

  const displaySeverity = input.severity === 'minimo' ? 'mínimo' : (input.severity ?? 'indeterminado');

  const lengthRules = totalClicks === 0
    ? '- strengths pode ter 0 itens. weaknesses: 2 a 4 itens.'
    : '- strengths e weaknesses: 2 a 4 itens cada. Tente sempre justificar cada item com os valores fornecidos.';

  return `
Você é um avaliador técnico-clínico especializado em neuropsicologia da atenção.
Receba as métricas já calculadas de uma tarefa de busca visual e gere uma
interpretação clínica enriquecida. Siga rigorosamente estas diretrizes:

REGRAS:
- Não recalcule métricas — elas já foram processadas pelo sistema local.
- Não feche diagnóstico clínico (ex: TDAH, AVC, TCE).
- Use linguagem técnica, prudente e embasada.
- FUNDAMENTAÇÃO NOS DADOS: Na 'clinicalNote', 'recommendation', 'strengths' e 'weaknesses', você DEVE citar explicitamente os números e métricas da sessão (ex: % de erros de comissão, quantidades de erros por formato/cor, taxa de omissões espaciais) para justificar suas inferências. Nunca faça afirmações genéricas; mostre os dados que sustentam a análise.
- CONSTRUÇÃO NARRATIVA: A 'clinicalNote' deve ser um texto clínico rico e bem articulado, contando a "história" do desempenho do paciente ao cruzar a severidade com o perfil de erros (formas, cores, distribuição espacial).
- O laudo é complementar; o sistema determinístico local já determinou a severidade e o tipo de erro dominante. Assuma isso como verdade absoluta para redigir o laudo.
- AVISO OBRIGATÓRIO: Na 'recommendation', informe explicitamente que os dados são provenientes de um treino (não é diagnóstico) e oriente a busca por um profissional de saúde mental certificado pelos conselhos regionais e federais para aprofundamento ou tirar dúvidas.
${lengthRules}
- score deve ser coerente com severity (mínimo→80–100, leve→60–79,
  moderado→40–59, importante→0–39).
- score=0 é válido e deve ser retornado quando o desempenho é severamente prejudicado.
${noEngagementWarning}
─── DADOS DA SESSÃO ──────────────────────────────────────────────────────────
sessionId: ${input.sessionId}
attentionType: ${input.attentionType}
rounds: ${input.roundCount ?? 0}
totalClicks: ${totalClicks}
commissionRate: ${(commissionRate * 100).toFixed(1)}%
severity (calculada localmente): ${displaySeverity}
dominantErrorAttribute: ${input.dominantErrorAttribute ?? 'indeterminado'}
problemRegion: ${input.problemRegion ?? 'indeterminado'}
${neglectInfo}

Perfil de erros:
  formas: ${errorProfile?.shapeErrors ?? 0} (${((errorProfile?.shapeErrorRate ?? 0) * 100).toFixed(1)}%)
  cores:  ${errorProfile?.colorErrors ?? 0} (${((errorProfile?.colorErrorRate ?? 0) * 100).toFixed(1)}%)
  duplos: ${errorProfile?.doubleErrors ?? 0} (${((errorProfile?.doubleErrorRate ?? 0) * 100).toFixed(1)}%)

Perfil espacial por quadrante:
${quadrantLines}
  misses esquerda: ${spatialProfile?.leftMisses ?? 0}
  misses direita:  ${spatialProfile?.rightMisses ?? 0}
─────────────────────────────────────────────────────────────────────────────

Gere o laudo enriquecido conforme o schema solicitado.
`.trim();
}
