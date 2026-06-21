import type { SustainedEvaluatorInput } from '../types';
import type { Schema } from '@google/genai';

// ─── Schema JSON retornado pelo Gemini ───────────────────────────────────────
export const SUSTAINED_EVALUATION_SCHEMA: Schema = {
  type: 'object' as any,
  properties: {
    score:          { type: 'number' as any },
    level:          { type: 'string' as any },
    strengths:      { type: 'array' as any, items: { type: 'string' as any } },
    weaknesses:     { type: 'array' as any, items: { type: 'string' as any } },
    recommendation: { type: 'string' as any },
    clinicalNote:   { type: 'string' as any },
  },
  required: ['score', 'level', 'strengths', 'weaknesses', 'recommendation', 'clinicalNote'],
};

// ─── Builder do prompt ───────────────────────────────────────────────────────
export function buildSustainedPrompt(input: SustainedEvaluatorInput): string {
  const phases = input.phaseDetail ?? [];
  const phaseLines = phases.map((p) => [
    `  Fase ${p.levelId} (${p.success ? 'concluída' : 'não concluída'}):`,
    `    - Eficiência: ${p.efficiencyPct}%`,
    `    - Revisitas (perseveração): ${p.revisits}`,
    `    - Entradas inéditas em becos (impulsividade): ${p.deadEndEntries}`,
    `    - Lapsos de atenção (paradas >3s): ${p.longStops}`,
    `    - Pausa pós-erro média: ${p.postErrorPauseMs}ms`,
    `    - Tempo total: ${p.elapsedSec}s`,
  ].join('\n')).join('\n\n');

  return `
Você é um neuropsicólogo clínico especializado em atenção sustentada, funções executivas e memória de trabalho visuoespacial.

O usuário completou o treino "Labirintos Prolongados" do Vigil, composto por 3 fases progressivas (Fácil, Médio, Difícil). O instrumento avalia:
- **Atenção sustentada**: capacidade de manter foco ao longo de labirintos crescentes
- **Planejamento antecipatório**: medido pela eficiência (quanto o caminho real se distanciou do ideal)
- **Perseveração frontal**: medida por revisitas — repetir caminhos já sabidamente errados
- **Impulsividade**: medida por entradas inéditas em becos sem saída
- **Lapsos de atenção**: paradas > 3 segundos sem movimento
- **Automonitoramento**: medido pela pausa pós-erro — quanto tempo o usuário ficou parado após bater em uma parede

---

## Dados da sessão

- Fases concluídas: ${input.completedPhases} de ${input.totalPhases}
- Eficiência média: ${input.avgEfficiencyPct}%
- Total de revisitas: ${input.totalRevisits}
- Total de entradas em becos: ${input.totalDeadEndEntries}
- Total de lapsos de atenção: ${input.totalLongStops}
- Pausa pós-erro média: ${input.avgPostErrorPauseMs}ms
- Severity calculado: ${input.severity}

### Detalhamento por fase

${phaseLines}

---

## Hierarquia clínica de interpretação

Use esta ordem para definir o level e o clinicalNote:
1. Se completedPhases = 0 → **importante** (colapso executivo)
2. Se totalRevisits > 5 → **importante** (perseveração frontal grave)
3. Se totalRevisits 3-5 → **moderado** (sobrecarga e rigidez cognitiva)
4. Se avgEfficiencyPct >= 85 e totalLongStops <= 1 → **mínimo**
5. Se avgEfficiencyPct 70-84 → **leve** (impulsividade inicial)
6. Se avgEfficiencyPct 50-69 → **moderado**
7. Se avgEfficiencyPct < 50 → **importante**

---

## Sua tarefa

Retorne um JSON válido com exatamente esta estrutura:

{
  "score": <número 0-100 proporcional ao desempenho>,
  "level": <"mínimo" | "leve" | "moderado" | "importante">,
  "strengths": [<lista de 2 a 3 pontos fortes redigidos de forma acessível ao usuário>],
  "weaknesses": [<lista de 2 a 3 pontos a desenvolver, sem linguagem alarmista>],
  "recommendation": <frase curta motivacional e lúdica para o próximo treino>,
  "clinicalNote": <parágrafo técnico para o profissional de saúde, citando os indicadores clínicos observados>
}

Regras obrigatórias:
- "recommendation" deve ser encorajadora, nunca alarmista
- "clinicalNote" deve mencionar explicitamente os indicadores mais relevantes (eficiência, perseveração, lapsos)
- não repita informações entre strengths, weaknesses e clinicalNote
- Responda SOMENTE o JSON, sem texto fora do objeto
`;
}
