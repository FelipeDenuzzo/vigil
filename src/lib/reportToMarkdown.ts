import type { EvaluationReport } from './evaluatorClient';
import type { EvaluatorInput } from './evaluatorClient';

export function reportToMarkdown(
  report: EvaluationReport,
  input: EvaluatorInput
): string {
  const now = new Date().toISOString();
  return `# Relatório VIGIL — ${input.sessionId}
**Data:** ${now}
**Jogo:** ${input.game}
**Nível de atenção:** ${input.attentionType}
**Score total:** ${report.score}
**Severidade:** ${report.level}

---

## 🎮 Resultado Lúdico
- **Score:** ${report.ludic.score}
- **Label:** ${report.ludic.label} ${report.ludic.emoji}

---

## 📋 Relatório Geral
**Resumo:** ${report.general.summary}

**Pontos fortes:**
${report.general.strengths.map(s => `- ${s}`).join('\n')}

**Pontos de atenção:**
${report.general.weaknesses.map(w => `- ${w}`).join('\n')}

**Recomendação:** ${report.general.recommendation}

---

## 🏥 Nota Clínica
**Pontos fortes:**
${report.clinical.strengths.map(s => `- ${s}`).join('\n')}

**Pontos de atenção:**
${report.clinical.weaknesses.map(w => `- ${w}`).join('\n')}

**Recomendação clínica:** ${report.clinical.recommendation}

> ${report.clinical.clinicalNote}
`;
}
