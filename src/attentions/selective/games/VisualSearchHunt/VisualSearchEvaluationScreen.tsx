// src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationScreen.tsx
// Atualizado: substitui loading simples pela EvaluationLoadingAnimation em 2 fases.

import { EvaluationReportPanel } from "./EvaluationReportPanel";
import { EvaluationLoadingAnimation } from "./EvaluationLoadingAnimation";
import type { EvaluationReport as GeminiReport } from "../../../../lib/evaluatorClient";
import type { VisualSearchSessionMetricsInput } from "./assessment/visualSearchScale.types";

type Props = {
  sessionLog: VisualSearchSessionMetricsInput;
  geminiReport?: GeminiReport;
  /** false = IA ainda chamando | 'organizing' = IA ok, app montando | true = tudo pronto */
  loaded?: boolean | 'organizing';
  onRepeatTraining: () => void;
  onBackToStart: () => void;
  onContinueTrail?: () => void;
};

const s = {
  container: {
    padding: 16,
    display: "grid",
    gap: 20,
  } as const,
  section: {
    background: "#161820",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    color: "#e8e9f0",
  } as const,
  sectionTitle: {
    marginBottom: 8,
    color: "#e8e9f0",
    fontSize: 16,
    fontWeight: 700,
  } as const,
  errorBox: {
    textAlign: "center" as const,
    padding: "32px 16px",
    color: "#f08080",
    fontSize: 14,
  },
  actions: {
    display: "grid",
    gap: 12,
    marginTop: 8,
  } as const,
  primaryButton: {
    minHeight: 48,
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#6c8ef5",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  } as const,
  secondaryButton: {
    minHeight: 48,
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#1c1f2a",
    color: "#e8e9f0",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  } as const,
  disabledButton: {
    minHeight: 48,
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#1c1f2a",
    color: "#4a4d62",
    fontSize: 16,
    fontWeight: 700,
    cursor: "not-allowed",
    opacity: 0.7,
  } as const,
  helperText: {
    marginTop: 6,
    fontSize: 13,
    color: "#ffffff",
  } as const,
};

function EvaluationBlock({
  geminiReport,
  loaded,
}: {
  geminiReport?: GeminiReport;
  loaded?: boolean | 'organizing';
}) {
  // ✅ Laudo pronto
  if (geminiReport) {
    return <EvaluationReportPanel report={geminiReport} />;
  }

  // ⏳ IA ainda respondendo
  if (loaded === false) {
    return <EvaluationLoadingAnimation organizing={false} />;
  }

  // 🗂 IA respondeu, app está organizando
  if (loaded === 'organizing') {
    return <EvaluationLoadingAnimation organizing={true} />;
  }

  // ❌ loaded === true mas sem relatório — serviço não respondeu
  return (
    <section style={s.section}>
      <div style={s.errorBox}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>&#x26A0;&#xFE0F;</p>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>Não foi possível gerar a avaliação.</p>
        <p style={{ fontSize: 12, color: "#a0a4be" }}>
          O serviço de IA não respondeu a tempo. O laudo será exibido na próxima consulta a esta sessão.
        </p>
      </div>
    </section>
  );
}

export function VisualSearchEvaluationScreen({
  geminiReport,
  loaded,
  onRepeatTraining,
  onBackToStart,
  onContinueTrail,
}: Props) {
  return (
    <div style={s.container}>

      <EvaluationBlock geminiReport={geminiReport} loaded={loaded} />

      {/* Próximos passos */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>Próximos passos</h3>
        <div style={s.actions}>
          <button type="button" onClick={onRepeatTraining} style={s.primaryButton}>
            Repetir o treino
          </button>
          <button type="button" onClick={onBackToStart} style={s.secondaryButton}>
            Voltar ao começo
          </button>
          <button
            type="button"
            onClick={onContinueTrail}
            disabled
            aria-disabled="true"
            title="Continuidade da trilha ainda não disponível"
            style={s.disabledButton}
          >
            Seguir a trilha
          </button>
        </div>
        <p style={s.helperText}>
          O botão "Seguir a trilha" ficará disponível quando a continuidade da trilha for implementada.
        </p>
      </section>

    </div>
  );
}
