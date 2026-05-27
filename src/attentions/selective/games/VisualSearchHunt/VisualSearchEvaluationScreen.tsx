// src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationScreen.tsx

import { EagleScale } from "./EagleScale";
import { buildVisualSearchScaleResult } from "./assessment/buildVisualSearchScaleResult";
import { buildVisualSearchTechnicalReport as buildTechnicalReportCentral } from "../../../../assessment/visualSearch/buildVisualSearchTechnicalReport";
import { adaptSessionToRoundClicks } from "../../../../assessment/visualSearch/adaptSessionToRoundClicks";
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
    background: "#161820",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    color: "#e8e9f0",
  } as const,
  sectionTitle: {
    marginBottom: 8,
    color: "#e8e9f0",
  } as const,
  strongLine: {
    marginTop: 12,
    fontWeight: 700,
    color: "#e8e9f0",
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
    color: "#8b8fa8",
  } as const,
};

export function VisualSearchEvaluationScreen({
  sessionLog,
  onRepeatTraining,
  onBackToStart,
  onContinueTrail,
}: Props) {
  // Nível lúdico — builder do módulo do jogo (score, régua, shortDescription)
  const scaleResult = buildVisualSearchScaleResult(sessionLog);

  // Parecer técnico — camada central (dominantErrorAttribute, problemRegion, spatialNeglect)
  const roundClicks = adaptSessionToRoundClicks(sessionLog);
  const technicalReport = buildTechnicalReportCentral(roundClicks);

  return (
    <div style={styles.container}>
      {/* Nível 1: Régua lúdica */}
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

      {/* Nível 2: Parecer técnico — camada central */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Leitura técnica</h3>
        <p>
          <strong>Resposta:</strong> {technicalReport.answer}
        </p>
        <p>
          <strong>Atributo dominante:</strong> {technicalReport.dominantErrorAttribute}
        </p>
        <p>
          <strong>Região de dificuldade:</strong> {technicalReport.problemRegion}
        </p>
        <p>
          <strong>Negligência espacial:</strong> {technicalReport.spatialNeglect ? 'sim' : 'não'}
        </p>
        <p>
          <strong>Gravidade:</strong> {technicalReport.severity}
        </p>
        <p>
          <strong>Interpretação:</strong> {technicalReport.interpretation}
        </p>
      </section>

      {/* Nível 3: Próximos passos */}
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
          O botão "Seguir a trilha" ficará disponível quando a continuidade da
          trilha for implementada.
        </p>
      </section>
    </div>
  );
}
