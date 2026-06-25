// vigil-evaluator/src/prompts/fruitwatch.ts

import type { FruitWatchEvaluatorInput } from '../types';

export function buildFruitWatchPrompt(input: FruitWatchEvaluatorInput): string {
  const results = input.rawResults ?? [];
  const phaseLines = results.map((r) => [
    `  Fase ${r.phase}:`,
    `    - Alvo: ${r.targetFigureId}`,
    `    - Resposta do usuário: ${r.userAnswer} (Real: ${r.targetCount})`,
    r.bonusFigureId ? `    - Item extra: ${r.bonusFigureId}` : '',
    r.bonusFigureId ? `    - Resposta do extra: ${r.bonusUserAnswer} (Real: ${r.bonusRealCount})` : '',
    `    - Toques acidentais (comissão motora): ${r.commissionErrors}`,
  ].filter(Boolean).join('\n')).join('\n\n');

  return `
Você é um neuropsicólogo clínico especializado em atenção sustentada, vigilância cognitiva, memória de trabalho e controle inibitório.

O usuário completou o treino "Foco Ninja" (Contagem Mental Silenciosa) do VIGIL, composto por 6 fases progressivas de 60 segundos cada. 

Este treino avalia:
- **Atenção Sustentada e Vigilância**: capacidade de manter o foco contínuo e a contagem precisa ao longo do tempo.
- **Controle Inibitório e Resistência à Distração**: capacidade de não contar figuras semelhantes (falsos positivos) nas fases de alta semelhança.
- **Memória de Trabalho Visuoespacial (Multitarefa)**: capacidade de monitorar duas contagens simultaneamente.

---

## Resultados Brutos do Usuário

- Foco Contínuo (Vigilância): ${input.focoContinuo}% (Baseado em omissões nas fases 1 e 2)
- Controle e Calma (Inibição): ${input.controleCalma}% (Baseado em falsos positivos nas fases 3 e 4, e comissões motoras)
- Foco Multitarefa (Memória de Trabalho): ${input.focoMultitarefa}% (Baseado no custo de dupla tarefa nas fases 5 e 6)
- Conquista Secreta (Atenção Periférica): ${input.conquistaSecreta ? 'Sim (acertou contagem bônus da Fase 5)' : 'Não'}
- Severidade Calculada: ${input.severity}

### Detalhe das 6 fases:

${phaseLines}

---

## Regras Clínicas de Interpretação e Tom

1. **Tom Geral**: O laudo deve ser encorajador, focado em desenvolvimento de habilidades e no treino cognitivo.
2. **Proibição Absoluta**: Jamais use as palavras: "comprometimento", "déficit", "patologia", "diagnóstico", "lentificação", "lentificação cognitiva", "flutuação da vigilância", "impulsividade", "imaturidade executiva".
3. **Se conquistaSecreta = true**: Inclua no resumo ou na recomendação uma menção especial celebrando a excelente percepção periférica do usuário, em tom de descoberta leve e animadora.
4. **Alinhamento do score e level**:
   - score: deve refletir a pontuação geral (use o Foco Contínuo como base principal: ${input.focoContinuo}).
   - level: deve ser coerente com a severidade informada (${input.severity}). Mapeie:
     - minimo -> mínimo (Excelente desempenho)
     - leve -> leve (Bom desempenho)
     - moderado -> moderado (Desempenho regular)
     - importante -> importante (Precisa de atenção)

---

## Sua tarefa

Gere o laudo estruturado rigorosamente em DUAS camadas conforme o schema JSON:

│ CAMADA GERAL (generalSummary, generalStrengths, generalWeaknesses, generalRecommendation)
│ - Linguagem simples, acessível para leigos, sem termos técnicos.
│
│ CAMADA CLÍNICA (clinicalStrengths, clinicalWeaknesses, clinicalRecommendation, clinicalNote)
│ - Linguagem técnica, quantitativa, referenciando explicitamente as pontuações dos eixos (Foco Contínuo, Controle e Calma, Foco Multitarefa) de forma científica porém cautelosa.

Responda APENAS o JSON de laudo, sem repetir os dados brutos e sem descrever fórmulas matemáticas.
`;
}
