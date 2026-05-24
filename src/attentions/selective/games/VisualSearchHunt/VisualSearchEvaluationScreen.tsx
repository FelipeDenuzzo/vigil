// src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationScreen.tsx

import { EagleScale } from "./EagleScale";
import { buildVisualSearchScaleResult } from "./assessment/buildVisualSearchScaleResult";
import { buildVisualSearchTechnicalReport } from "./assessment/buildVisualSearchTechnicalReport";
import type { VisualSearchSessionMetricsInput } from "./assessment/visualSearchScale.types";

type Props = {
  sessionLog: VisualSearchSessionMetricsInput;
  onRepeatTraining: () => void;
  onBackToStart: () => void;
  onContinueTrail?: () => void;
};

const styles = {
  container: {
    padding: 16,
    display: "grid",
    gap: 20,
  } as const,
  section: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
  } as const,
  sectionTitle: {
    marginBottom: 8,
  } as const,
  strongLine: {
    marginTop: 12,
    fontWeight: 700,
  } as const,
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
    background: "#0f766e",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  } as const,
  secondaryButton: {
    minHeight: 48,
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  } as const,
  disabledButton: {
    minHeight: 48,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#f1f5f9",
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: 700,
    cursor: "not-allowed",
    opacity: 0.8,
  } as const,
  helperText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
  } as const,
};

export function VisualSearchEvaluationScreen({
  sessionLog,
  onRepeatTraining,
  onBackToStart,
  onContinueTrail,
}: Props) {
  console.debug('Rendering VisualSearchEvaluationScreen (new) sessionId=', sessionLog?.sessionId);
  const scaleResult = buildVisualSearchScaleResult(sessionLog);
  const technicalReport = buildVisualSearchTechnicalReport(sessionLog);

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          {scaleResult.emoji} {scaleResult.scaleName}
        </h2>

        <EagleScale
          score={scaleResult.score}
          positionPercent={scaleResult.positionPercent}
          leftLabel={scaleResult.leftLabel}
          rightLabel={scaleResult.rightLabel}
          markerLabel={scaleResult.markerLabel}
        />

        <p style={styles.strongLine}>{scaleResult.shortDescription}</p>
        <p>{scaleResult.clinicalMeaning}</p>
        <p>{scaleResult.summary}</p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Leitura técnica</h3>
        <p>
          <strong>Resposta:</strong> {technicalReport.answer}
        </p>
        <p>
          <strong>Perfil:</strong> {technicalReport.dominantPattern}
        </p>
        <p>
          <strong>Gravidade:</strong> {technicalReport.severity}
        </p>
        <p>
          <strong>Resumo:</strong> {technicalReport.summary}
        </p>
        <p>
          <strong>Interpretação:</strong> {technicalReport.interpretation}
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Próximos passos</h3>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onRepeatTraining}
            style={styles.primaryButton}
          >
            Repetir o treino
          </button>

          <button
            type="button"
            onClick={onBackToStart}
            style={styles.secondaryButton}
          >
            Voltar ao começo
          </button>

          <button
            type="button"
            onClick={onContinueTrail}
            disabled
            aria-disabled="true"
            title="Continuidade da trilha ainda não disponível"
            style={styles.disabledButton}
          >
            Seguir a trilha
          </button>
        </div>

        <p style={styles.helperText}>
          O botão “Seguir a trilha” ficará disponível quando a continuidade da
          trilha for implementada.
        </p>
      </section>
    </div>
  );
}