import { Type } from '@google/genai';
import type { DividedEvaluatorInput } from '../types';
import { formatMsToSeconds } from './utils';

export const DIVIDED_EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Laudo enriquecido de atenção dividida com camadas lúdica, geral e clínica',
  properties: {
    score: {
      type: Type.NUMBER,
      description: 'Pontuação global de 0 a 100 coerente com severity.',
    },
    level: {
      type: Type.STRING,
      enum: ['mínimo', 'leve', 'moderado', 'importante'],
      description: 'Classificação clínica coerente com a severidade informada.',
    },
    generalSummary: {
      type: Type.STRING,
      description: 'Resumo em 2–3 frases em linguagem acessível para alguém sem formação em saúde. Descreva o que aconteceu na sessão de forma encorajadora.',
    },
    generalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2–3 pontos positivos em linguagem simples e encorajadora. Evite termos técnicos.',
    },
    generalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–2 pontos de melhoria em linguagem simples, sem alarmismo. Foque no que pode melhorar com prática.',
    },
    generalRecommendation: {
      type: Type.STRING,
      description: 'Uma orientação prática e encorajadora para o usuário, sem jargões.',
    },
    clinicalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2–4 aspectos preservados da atenção dividida com citação explícita de valores numéricos.',
    },
    clinicalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2–4 fragilidades no controle executivo, na inibição de distratores ou no custo de carga com citação explícita de valores numéricos.',
    },
    clinicalRecommendation: {
      type: Type.STRING,
      description: 'Orientação objetiva e cautelosa para o avaliador ou equipe clínica. OBRIGATÓRIO: mencionar que é treino, não diagnóstico, e orientar busca por profissional.',
    },
    clinicalNote: {
      type: Type.STRING,
      description: 'Interpretação narrativa técnica articulando a capacidade de focar, custos de carga cognitivos e intrusão em conjunto com citação dos valores numéricos. Sem fechar diagnóstico.',
    },
  },
  required: [
    'score', 'level',
    'generalSummary', 'generalStrengths', 'generalWeaknesses', 'generalRecommendation',
    'clinicalStrengths', 'clinicalWeaknesses', 'clinicalRecommendation', 'clinicalNote',
  ],
};

export function buildDividedPrompt(input: DividedEvaluatorInput): string {
  const displaySeverity = input.severity === 'minimo' ? 'mínimo' : (input.severity ?? 'indeterminado');
  const game = (input.game as string) || 'cofre-mental';

  if (game === 'escuta-seletiva') {
    const totalRounds = (input.totalRounds as number) ?? 0;
    const noEngagementWarning = totalRounds === 0
      ? `
ATENÇÃO — SESSÃO SEM ENGAJAMENTO:
totalRounds é 0. Nenhuma tentativa foi registrada.
- Não faça inferências sobre atenção dividida ou filtragem de ruído.
- generalStrengths e clinicalStrengths devem ficar vazios.
- generalSummary e clinicalNote devem mencionar que os dados são insuficientes.
`
      : '';

    return `
Você é um avaliador especializado em neuropsicologia cognitiva da atenção e processamento auditivo.
Deve gerar um laudo em DUAS camadas distintas:

│ CAMADA GERAL — para o próprio usuário, sem formação em saúde.
│ Linguagem simples, encorajadora, sem termos técnicos.
│ Campos: generalSummary, generalStrengths, generalWeaknesses, generalRecommendation.
│
│ CAMADA CLÍNICA — para o avaliador ou equipe de saúde.
│ Linguagem técnica, prudente, embasada nos dados numéricos.
│ Campos: clinicalStrengths, clinicalWeaknesses, clinicalRecommendation, clinicalNote.

O usuário completou o treino "Escuta Seletiva" (Atenção Dividida) do Vigil — uma tarefa de escuta dicótica/concorrente,
onde deve ignorar uma voz distratora (masculina ou feminina) e lembrar dos dígitos falados na voz-alvo.

O instrumento avalia as seguintes dimensões neuropsicológicas:
1. **Precisão Serial (Ordem Exata)**: Capacidade de reter tanto a identidade quanto a ordem sequencial dos estímulos sob interferência.
2. **Precisão de Itens**: Memória de curto prazo geral (retenção livre de ordem).
3. **Intrusão do Distrator**: Foco atencional e capacidade de filtragem do canal de interferência concorrente (intrusões da outra voz).
4. **Custo de Carga Cognitiva (Load Cost)**: O declínio de performance ao aumentar o comprimento da sequência de 3 para 4 ou 5 dígitos, refletindo os limites da memória de trabalho/trabalho sob divisão de recursos.
5. **Latência de Resposta**: Tempo necessário para recuperar/iniciar a resposta.

REGRAS GERAIS:
- Não recalcule métricas — já processadas pelo sistema local.
- Não feche diagnóstico clínico.
- FUNDAMENTAÇÃO: na camada clínica, cite explicitamente os valores numéricos.
- NARRATIVA: clinicalNote articula as dimensões em conjunto (ex. alta precisão de item mas alta intrusão indica boa capacidade de memória mas falha no filtro atencional periférico).
- severity e notas de custo são verdade absoluta.
- clinicalRecommendation DEVE alertar que os dados vêm de treino (não diagnóstico) e orientar busca por profissional certificado.
- score coerente com severity: mínimo→80–100, leve→60–79, moderado→40–59, importante→0–39.
${noEngagementWarning}
─── DADOS DA SESSÃO ──────────────────────────────────────────────────────────────────
sessionId:     ${input.sessionId}
attentionType: dividida
jogo:          escuta-seletiva
severity (calculada localmente): ${displaySeverity}

Métricas globais:
  Total de rodadas:     ${totalRounds}
  Precisão Serial:      ${((input.serialAccuracy as number) ?? 0) * 100}% (${input.accuracyNote ?? 'sem nota'})
  Precisão de Itens:    ${((input.itemAccuracy as number) ?? 0) * 100}%
  Omissões (Silêncio):  ${input.omissions ?? 0}
  Tempo Médio de Resp:  ${formatMsToSeconds(input.meanResponseTimeMs as number)}
  Taxa de Intrusão:     ${((input.distractorIntrusionRate as number) ?? 0) * 100}% (${input.intrusionNote ?? 'sem nota'})
  Custo de Carga:       ${((input.loadCost as number) ?? 0) * 100}%
  Média Repetições:     ${input.avgReplayCount ?? 0}
───────────────────────────────────────────────────────────────────────────

Gere o laudo com os dois campos de cada camada completamente preenchidos.
`.trim();
  }

  // Jogo default: Cofre Mental
  const totalRodadas = (input.totalRodadas as number) ?? 0;
  const noEngagementWarning = totalRodadas === 0
    ? `
ATENÇÃO — SESSÃO SEM ENGAJAMENTO:
totalRodadas é 0. Nenhuma tentativa foi registrada.
- Não faça inferências sobre atenção dividida ou processamento concorrente.
- generalStrengths e clinicalStrengths devem ficar vazios.
- generalSummary e clinicalNote devem mencionar que os dados são insuficientes.
`
    : '';

  return `
Você é um avaliador especializado em neuropsicologia cognitiva da atenção e funções executivas.
Deve gerar um laudo em DUAS camadas distintas:

│ CAMADA GERAL — para o próprio usuário, sem formação em saúde.
│ Linguagem simples, encorajadora, sem termos técnicos.
│ Campos: generalSummary, generalStrengths, generalWeaknesses, generalRecommendation.
│
│ CAMADA CLÍNICA — para o avaliador ou equipe de saúde.
│ Linguagem técnica, prudente, embasada nos dados numéricos.
│ Campos: clinicalStrengths, clinicalWeaknesses, clinicalRecommendation, clinicalNote.

O usuário completou o treino "Cofre Mental" (Atenção Dividida) do Vigil — uma tarefa inspirada no paradigma de compartilhamento de tempo e recursos (TBRS),
onde deve memorizar letras enquanto realiza classificação par/ímpar ou maior/menor de dígitos numéricos intercalados de forma concorrente.

O instrumento avalia as seguintes dimensões neuropsicológicas:
1. **Nível de Carga/Capacidade de Armazenamento**: O nível/tamanho máximo da sequência de letras retida com sucesso.
2. **Custo TBRS (Time-Based Resource Sharing)**: Diferença de precisão na recordação de letras quando há a tarefa concorrente (rodadas mistas) vs. quando há apenas memorização pura.
3. **Precisão na Tarefa Concorrente (Dígitos)**: Acurácia ao responder os dígitos intercalados, indicando se houve negligência da tarefa secundária para focar apenas nas letras.
4. **Eficiência de Processamento**: Tempo de reação médio e erros de comissão nas decisões dos dígitos.

REGRAS GERAIS:
- Não recalcule métricas — já processadas pelo sistema local.
- Não feche diagnóstico clínico.
- FUNDAMENTAÇÃO: na camada clínica, cite explicitamente os valores numéricos.
- NARRATIVA: clinicalNote articula as dimensões em conjunto (ex. alto custo TBRS com boa precisão de dígitos indica divisão desigual de recursos).
- severity e notas são verdade absoluta.
- clinicalRecommendation DEVE alertar que os dados vêm de treino (não diagnóstico) e orientar busca por profissional certificado.
- score coerente com severity: mínimo→80–100, leve→60–79, moderado→40–59, importante→0–39.
${noEngagementWarning}
─── DADOS DA SESSÃO ──────────────────────────────────────────────────────────────────
sessionId:     ${input.sessionId}
attentionType: dividida
jogo:          cofre-mental
severity (calculada localmente): ${displaySeverity}

Métricas globais:
  Nível máximo alcançado:   ${input.nivelMaximo ?? 0}
  Total de rodadas:         ${totalRodadas}
  Rodadas puras:            ${input.rodadasPuras ?? 0}
  Rodadas mistas:           ${input.rodadasMistas ?? 0}
  Média de recordação (geral): ${((input.avgAbsoluteRecall as number) ?? 0) * 100}%
  Média em rodadas puras:   ${((input.avgAbsoluteRecallPuras as number) ?? 0) * 100}%
  Média em rodadas mistas:  ${((input.avgAbsoluteRecallMistas as number) ?? 0) * 100}%
  Custo TBRS:               ${((input.tbrsCost as number) ?? 0) * 100}%
  Precisão nos dígitos:     ${((input.avgDigitAccuracy as number) ?? 0) * 100}%
  Erros de comissão dígitos: ${input.totalCommissionErrors ?? 0}
  Omissões dígitos:         ${input.totalOmissions ?? 0}
  Tempo reação dígitos:     ${formatMsToSeconds(input.avgDigitMeanRtMs as number)}
  Índice Eficiência (IES):  ${formatMsToSeconds(input.avgDigitIes as number)}
───────────────────────────────────────────────────────────────────────────

Gere o laudo com os dois campos de cada camada completamente preenchidos.
`.trim();
}
