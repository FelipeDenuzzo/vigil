import { Type } from '@google/genai';
import type { SustainedEvaluatorInput } from '../types';

// ─── Schema JSON retornado pelo Gemini ───────────────────────────────────────
export const SUSTAINED_EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Laudo enriquecido de atenção sustentada (labirintos prolongados) com camadas lúdica, geral e clínica',
  properties: {
    score: {
      type: Type.NUMBER,
      description: 'Pontuação global de 0 a 100 refletindo a performance geral.',
    },
    level: {
      type: Type.STRING,
      enum: ['mínimo', 'leve', 'moderado', 'importante'],
      description: 'Classificação clínica coerente com a severidade informada.',
    },
    // ─ Camada geral (leigos) ──────────────────────────────────────────
    generalSummary: {
      type: Type.STRING,
      description: 'Resumo em 2–3 frases em linguagem acessível para alguém sem formação em saúde. O que foi observado na performance geral do usuário.',
    },
    generalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–3 pontos positivos concretos desta sessão, escritos de forma encorajadora e sem termos técnicos.',
    },
    generalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–3 pontos de melhoria desta sessão, descritos sem alarmismo e em linguagem simples.',
    },
    generalRecommendation: {
      type: Type.STRING,
      description: 'Uma orientação prática e encorajadora para o próximo treino.',
    },
    // ─ Camada clínica (técnica) ──────────────────────────────────────
    clinicalStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–4 pontos positivos técnicos com citação explícita dos valores numéricos.',
    },
    clinicalWeaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1–4 pontos de atenção técnicos com citação explícita dos valores numéricos.',
    },
    clinicalRecommendation: {
      type: Type.STRING,
      description: 'Orientação objetiva baseada nos achados clínicos, sem jargões e lembrando que é um treino (não diagnóstico).',
    },
    clinicalNote: {
      type: Type.STRING,
      description: 'Texto de 4–6 linhas: (1) visão geral das funções executivas e atenção sustentada, (2) eficiência e perseveração com números, (3) padrão de resposta pós-erro e lapsos, (4) o que o padrão indica sem diagnóstico.',
    },
  },
  required: [
    'score', 'level',
    'generalSummary', 'generalStrengths', 'generalWeaknesses', 'generalRecommendation',
    'clinicalStrengths', 'clinicalWeaknesses', 'clinicalRecommendation', 'clinicalNote',
  ],
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

Gere um laudo em DUAS camadas distintas baseando-se RIGOROSAMENTE nas regras abaixo:

│ CAMADA GERAL — para o próprio usuário, sem formação em saúde.
│ Linguagem simples, encorajadora, sem termos técnicos.
│ Campos: generalSummary, generalStrengths, generalWeaknesses, generalRecommendation.
│
│ CAMADA CLÍNICA — para o avaliador ou equipe de saúde.
│ Linguagem técnica, prudente, embasada nos dados numéricos.
│ Campos: clinicalStrengths, clinicalWeaknesses, clinicalRecommendation, clinicalNote.

Regras obrigatórias:
- PROIBIÇÃO TOTAL de usar as palavras: "comprometimento", "déficit", "patologia", "diagnóstico", "lentificação", "lentificação cognitiva", "flutuação da vigilância", "impulsividade", "imaturidade executiva".
- "generalRecommendation" and "generalSummary" devem ser encorajadoras, lúdicas e fáceis de ler por leigos.
- "clinicalNote" deve mencionar explicitamente os indicadores mais relevantes (eficiência, perseveração, lapsos) e articular o significado clínico com números de forma cautelosa.
- Não repita informações textuais de forma idêntica entre os campos de strengths/weaknesses gerais e clínicos.
- Não feche diagnóstico clínico.
- score coerente com a severidade: mínimo→80–100, leve→60–79, moderado→40–59, importante→0–39.
`;
}
