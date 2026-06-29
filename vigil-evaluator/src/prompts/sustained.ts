import { Type } from '@google/genai';
import type { SustainedEvaluatorInput } from '../types';

export const SUSTAINED_EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Laudo enriquecido de atenção sustentada com camadas lúdica, geral e clínica',
  properties: {
    score: {
      type: Type.NUMBER,
      description: 'Pontuação global de 0 a 100 refletindo a performance geral.',
    },
    level: {
      type: Type.STRING,
      description: 'Classificação clínica coerente com a severidade informada.',
      enum: ['mínimo', 'leve', 'moderado', 'importante'],
    },
    // ─ Camada geral (leigos) ──────────────────────────────────────────
    generalSummary: {
      type: Type.STRING,
      description: 'Resumo em 2–3 frases em linguagem acessível para alguém sem formação em saúde. O que foi observado em consistência e erros.',
    },
    generalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–3 pontos positivos concretos desta sessão, escritos de forma encorajadora.',
    },
    generalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–3 pontos de melhoria desta sessão, descritos sem alarmismo.',
    },
    generalRecommendation: {
      type: Type.STRING,
      description: 'Uma orientação prática e encorajadora para o próximo treino.',
    },
    // ─ Camada clínica (técnica) ──────────────────────────────────────
    clinicalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–4 pontos positivos técnicos (ex: sobre velocidade de processamento ou vigilância).',
    },
    clinicalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–4 pontos de atenção técnicos (ex: omissões, falsos alarmes).',
    },
    clinicalRecommendation: {
      type: Type.STRING,
      description: 'Orientação objetiva baseada nos achados, sem jargões. OBRIGATÓRIO incluir aviso de que não substitui avaliação clínica formal.',
    },
    clinicalNote: {
      type: Type.STRING,
      description: 'Texto clínico corrido (4–6 linhas) interpretando omissões, comissões, declínio de vigilância e variabilidade (SDRT).',
    },
  },
  required: [
    'score', 'level',
    'generalSummary', 'generalStrengths', 'generalWeaknesses', 'generalRecommendation',
    'clinicalStrengths', 'clinicalWeaknesses', 'clinicalRecommendation', 'clinicalNote',
  ],
};

export function buildSustainedPrompt(input: any): string {
  const displaySeverity = input.severity === 'minimo' ? 'mínimo' : (input.severity ?? 'indeterminado');
  const game = input.game || 'SalaDeVigilia';

  if (game === 'SalaDeVigilia') {
    return `
Você é um avaliador especializado em neuropsicologia cognitiva do sistema Vigil.
Receberá um log estruturado de uma sessão do treino "Sala de Vigília", baseado no paradigma clínico de Vigilância Pura (equivalente funcional ao CPT e ao Relógio de Mackworth).
Deve gerar um laudo em DUAS camadas distintas (geral e clínica) baseando-se RIGOROSAMENTE nas regras abaixo e no schema JSON fornecido.

REGRAS ABSOLUTAS:
1. Proibido fechar ou sugerir diagnósticos clínicos (TDAH, TEA, ansiedade, etc.).
2. Todo texto é descritivo-funcional: descreve desempenho na tarefa, não o indivíduo.
3. O campo clinicalRecommendation DEVE incluir: "As informações deste laudo são resultado de um treino cognitivo virtual e não substituem avaliação clínica formal."
4. O Gemini não calcula métricas — todos os valores numéricos já estão calculados.
5. Nunca cite autores ou anos no formato acadêmico (ex: "Parasuraman, 1979" ou "Smallwood & Schooler, 2006"). Para referenciar a ciência, use frases como: "Estudos da neurociência mostram que..." ou "Cientistas chamam isso de Divagação Mental..." mantendo o tom lúdico e acessível.

INSTRUÇÕES POR CAMPO:

[CAMADA LÚDICA / GERAL — para o usuário leigo]
• generalSummary: 2-3 frases acessíveis. Mencione o esforço de manter o foco durante uma tarefa calma e repetitiva. Não use termos clínicos (omissões, comissões, RT).
• generalStrengths / generalWeaknesses: Se vigilanceDecrement > 0.15 ou rtDecrement > 0.08, mencione levemente nas fraquezas/recomendações que manter o foco até o final é um desafio que melhora com prática. 
• generalRecommendation: Dica prática para manter a atenção em tarefas monótonas.

[CAMADA CLÍNICA — para o profissional]
Use o campo "clinicalNote" e "clinicalWeaknesses/Strengths" para abordar os 5 pontos abaixo:
1. Omissões (omissions / omissionSeverity): Correlacione com quebra de vigilância e mind-wandering conforme literatura CPT/T.O.V.A. Valores acima do esperado indicam lapsos de atenção sustentada.
2. Comissões (commissions / commissionSeverity): Correlacione com impulsividade reativa (cérebro entediado gera resposta sem estímulo). Diferencie impulsividade de baixa discriminabilidade.
3. Declínio de Vigilância (vigilanceDecrement / rtDecrement): O decremento de vigilância é o marcador primário do esgotamento de recursos atencionais em tarefas longas (Parasuraman, 1979). Se vigilanceDecrement <= 0, o desempenho foi estável ou com efeito de prática.
4. Variabilidade (sdRT / rtVariabilitySeverity): Alta variabilidade = padrão "in-zone / out-of-zone" (Smallwood & Schooler, 2006). Diferencie RT lento-consistente (letargia/fadiga) de RT inconsistente (divagação).
5. Velocidade (meanRT): Referência normativa orientadora: RT esperado entre 0.4s – 0.7s em adultos jovens em paradigma CPT com baixa densidade de alvos.

─── DADOS DA SESSÃO ──────────────────────────────────────────────────────────
sessionId: ${input.sessionId}
attentionType: sustentada
game: SalaDeVigilia
durationMs: ${input.durationMs ?? 0}
severity: ${displaySeverity}

Métricas globais:
  Omissões: ${input.metrics?.omissions ?? 0} (Severidade: ${input.scales?.omissionSeverity})
  Falsos Alarmes (Comissões): ${input.metrics?.commissions ?? 0} (Severidade: ${input.scales?.commissionSeverity})
  Taxa de Acerto: ${input.metrics?.hitRate ?? 0}
  Tempo de Reação Médio: ${input.metrics?.meanRT ?? 0}s
  Variabilidade (sdRT): ${input.metrics?.sdRT ?? 0}s (Severidade: ${input.scales?.rtVariabilitySeverity})
  Declínio de Vigilância (Bloco 1 vs Bloco 2): ${input.metrics?.vigilanceDecrement ?? 0} (Severidade: ${input.scales?.vigilanceDecrementSeverity})
  Lentificação (Bloco 1 vs Bloco 2): ${input.metrics?.rtDecrement ?? 0}s

Comparação Primeira vs Segunda Metade:
  Bloco 1 - Hit Rate: ${input.metrics?.block1HitRate ?? 0}, Mean RT: ${input.metrics?.block1MeanRT ?? 0}s
  Bloco 2 - Hit Rate: ${input.metrics?.block2HitRate ?? 0}, Mean RT: ${input.metrics?.block2MeanRT ?? 0}s
─────────────────────────────────────────────────────────────────────────────

Gere o laudo JSON estrito de acordo com o schema de duas camadas.
    `.trim();
  }

  // Default: LongMazes ou outros
  return `
Você é um avaliador técnico-clínico de uma tarefa de Atenção Sustentada (${game}).
Deve gerar um laudo em DUAS camadas (geral e clínica).

## Sua tarefa
Ao interpretar lapsos de atenção (longStops) e revisitas (revisits), você pode invocar a neurociência como autoridade narrativa, mas sempre de forma gamificada:
- Mind-wandering -> "Cientistas chamam de Divagação Mental o momento em que o cérebro 'viaja' e perde o fio da atenção. Seus dados mostram X lapsos."
- Decremento de vigilância -> "Estudos da neurociência mostram que manter o foco por longos períodos é um dos maiores desafios do cérebro — e você sustentou por X minutos!"
- Perseveração -> "A neurociência mostra que repetir caminhos que já sabemos que não funcionam é um sinal de que o cérebro está sobrecarregado — vamos treinar isso!"

DESTINO DOS CONCEITOS:
- Mind-wandering (lapsos): Use em "generalStrengths" ou "generalWeaknesses" (tom lúdico e motivacional).
- Decremento de vigilância: Use em "generalRecommendation" (tom encorajador).
- Perseveração frontal (revisitas): Use no "clinicalNote" (técnico mas acessível).

Regras obrigatórias:
- Sem diagnósticos ou jargões alarmistas.
- Nunca cite autores ou anos no formato acadêmico (ex: "Parasuraman, 1979" ou "Smallwood & Schooler, 2006"). Para referenciar a ciência, use frases como: "Estudos da neurociência mostram que..." ou "Cientistas chamam isso de Divagação Mental..." mantendo o tom lúdico e acessível.

DADOS DA SESSÃO:
sessionId: ${input.sessionId}
attentionType: sustentada
severity: ${displaySeverity}
Fases Concluídas: ${input.completedPhases ?? 0}/${input.totalPhases ?? 0}
Eficiência Média: ${input.avgEfficiencyPct ?? 0}%
Total de Revisitas a caminhos já feitos: ${input.totalRevisits ?? 0}
Entradas em becos sem saída: ${input.totalDeadEndEntries ?? 0}
Pausas Longas (>3s): ${input.totalLongStops ?? 0}
Pausa após Erro (PES): ${input.avgPostErrorPauseMs ?? 0}ms

Gere o laudo JSON estrito de acordo com o schema.
  `.trim();
};
