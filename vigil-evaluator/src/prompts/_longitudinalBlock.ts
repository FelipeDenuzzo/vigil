import type { ProgressContext } from '../types';

const TREND_PT: Record<string, string> = {
  improving:   'evolução positiva nas últimas sessões',
  stable:      'desempenho estável nas últimas sessões',
  oscillating: 'oscilação sem direção clara nas últimas sessões',
  declining:   'queda de desempenho nas últimas sessões',
};

export function buildLongitudinalBlock(ctx: ProgressContext): string {
  const deltaSign = ctx.deltaFromBaseline >= 0 ? '+' : '';
  const recentLines = ctx.recentSessions
    .map((s, i) => `  Sessão -${i + 1}: score ${s.score} (${s.level}) em ${s.createdAt.slice(0, 10)}`)
    .join('\n');

  return `
─── CONTEXTO LONGITUDINAL ───────────────────────────────────────────────────
INSTRUÇÃO OBRIGATÓRIA:
Você recebe o histórico de performance do usuário APENAS para contextualizar a sessão atual.
Use-o para descrever evolução funcional observável nesta tarefa específica.
NUNCA use a trajetória para inferir, sugerir ou aproximar condições clínicas, transtornos ou diagnósticos.
NUNCA produza frases como "o padrão ao longo do tempo pode indicar [condição]" ou similares.
Frases permitidas: "Em relação ao baseline, o desempenho desta sessão foi [melhor/similar/inferior]."
"A tendência recente mostra [descrição funcional]."

Baseline (rastreamento inicial):
  Score: ${ctx.baseline.score}/100 · Nível: ${ctx.baseline.level} · Data: ${ctx.baseline.doneAt.slice(0, 10)}

Sessões anteriores (${ctx.sessionCount} no total, últimas ${ctx.recentSessions.length} exibidas):
${recentLines || '  Nenhuma sessão anterior neste tipo.'}

Tendência: ${TREND_PT[ctx.trend] ?? ctx.trend}
Delta em relação ao baseline: ${deltaSign}${ctx.deltaFromBaseline} pontos
${ctx.firstSessionAfterBaseline ? 'NOTA: Esta é a primeira sessão após o rastreamento inicial.' : ''}
─────────────────────────────────────────────────────────────────────────────
`.trim();
}
