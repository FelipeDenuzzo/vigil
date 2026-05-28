// src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationScreen.tsx
// Atualizado em: 28/05/2026

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
  label: {
    fontSize: 12,
    color: "#8b8fa8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#e8e9f0",
    marginBottom: 10,
  },
  subsection: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 8,
  } as const,
  subsectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#a0a4be",
    marginBottom: 4,
  } as const,
  subsectionText: {
    fontSize: 13,
    color: "#c8cad8",
    lineHeight: 1.5,
  } as const,
  strongLine: {
    marginTop: 12,
    fontWeight: 700,
    color: "#e8e9f0",
    fontSize: 15,
  } as const,
  tagList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 4,
  } as const,
  tag: {
    background: "rgba(108,142,245,0.15)",
    border: "1px solid rgba(108,142,245,0.3)",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    color: "#a0b4f8",
  } as const,
  redFlagBox: {
    background: "rgba(255,80,80,0.08)",
    border: "1px solid rgba(255,80,80,0.25)",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 8,
    fontSize: 13,
    color: "#f08080",
    lineHeight: 1.5,
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
  const scaleResult = buildVisualSearchScaleResult(sessionLog);
  const report = buildVisualSearchTechnicalReport(sessionLog);

  return (
    <div style={s.container}>

      {/* ── Régua lúdica ── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>
          {scaleResult.emoji} {scaleResult.scaleName}
        </h2>

        <EagleScale
          score={scaleResult.score}
          positionPercent={scaleResult.positionPercent}
          leftLabel={scaleResult.leftLabel}
          rightLabel={scaleResult.rightLabel}
          markerLabel={scaleResult.markerLabel}
        />

        <p style={s.strongLine}>{scaleResult.shortDescription}</p>
        <p style={{ ...s.value, marginTop: 6 }}>{report.interpretation}</p>
      </section>

      {/* ── Análise por subescalas ── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>Como foi seu treino</h3>

        <div style={s.subsection}>
          <p style={s.subsectionTitle}>Atenção seletiva</p>
          <p style={s.subsectionText}>{report.subscalesSummary.selectiveAttention}</p>
        </div>

        <div style={s.subsection}>
          <p style={s.subsectionTitle}>Varredura visual</p>
          <p style={s.subsectionText}>{report.subscalesSummary.visualScanning}</p>
        </div>

        <div style={s.subsection}>
          <p style={s.subsectionTitle}>Distribuição espacial</p>
          <p style={s.subsectionText}>{report.subscalesSummary.spatialAsymmetry}</p>
        </div>

        <div style={s.subsection}>
          <p style={s.subsectionTitle}>Velocidade e ritmo</p>
          <p style={s.subsectionText}>{report.subscalesSummary.speedConsistency}</p>
        </div>
      </section>

      {/* ── Indicadores positivos ── */}
      {report.positiveIndicators.length > 0 && (
        <section style={s.section}>
          <h3 style={s.sectionTitle}>Pontos fortes identificados</h3>
          <div style={s.tagList}>
            {report.positiveIndicators.map((tag) => (
              <span key={tag} style={s.tag}>{tag}</span>
            ))}
          </div>
        </section>
      )}

      {/* ── Sinal de alerta (somente quando presente) ── */}
      {report.redFlag && (
        <section style={s.section}>
          <h3 style={{ ...s.sectionTitle, color: "#f08080" }}>⚠️ Ponto de atenção</h3>
          <div style={s.redFlagBox}>{report.redFlag}</div>
        </section>
      )}

      {/* ── Próximos passos ── */}
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
