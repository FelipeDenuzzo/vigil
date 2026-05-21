import React from "react";
import { useVisualSearchEvaluation } from "./useVisualSearchEvaluation";

interface VisualSearchEvaluationScreenProps {
  sessionId: string;
  onClose?: () => void;
}

const card: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "var(--radius-xl)",
  padding: "var(--space-6)",
};

const mutedText: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
  color: "#71717a",
};

const title: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--text-xl)",
  fontWeight: 700,
  color: "#0f1117",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--text-base)",
  fontWeight: 700,
  color: "#0f1117",
  marginBottom: "var(--space-2)",
};

const primaryButton: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-3) var(--space-4)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-selective)",
  color: "#0f1117",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: "var(--text-base)",
  cursor: "pointer",
  border: "none",
};

function formatTrend(
  trend: "improved" | "stable" | "declined" | "first_session"
): string {
  if (trend === "improved") return "Melhor que sua média";
  if (trend === "declined") return "Abaixo da sua média";
  if (trend === "stable") return "Desempenho estável";
  return "Primeira sessão registrada";
}

function trendColor(
  trend: "improved" | "stable" | "declined" | "first_session"
): string {
  if (trend === "improved") return "#16a34a";
  if (trend === "declined") return "#dc2626";
  if (trend === "stable") return "#2563eb";
  return "#71717a";
}

export const VisualSearchEvaluationScreen: React.FC<
  VisualSearchEvaluationScreenProps
> = ({ sessionId, onClose }) => {
  const report = useVisualSearchEvaluation(sessionId);

  if (!report) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
        }}
      >
        <div style={card}>
          <h3 style={title}>Avaliação do treino</h3>
          <p style={{ ...mutedText, marginTop: "var(--space-2)" }}>
            Não foi possível encontrar os dados desta sessão.
          </p>
        </div>

        {onClose && (
          <button style={primaryButton} onClick={onClose}>
            Fechar
          </button>
        )}
      </div>
    );
  }

  const { current, history, trend, deltaScorePct } = report;
  const averageHistoricScore =
    history.length > 0
      ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        marginTop: "var(--space-4)",
      }}
    >
      <div style={{ ...card, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div>
          <h3 style={title}>Avaliação do treino</h3>
          <p style={{ ...mutedText, marginTop: "var(--space-2)" }}>
            Resultado calculado a partir do seu desempenho nesta sessão.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-3)",
          }}
        >
          <div
            style={{
              padding: "var(--space-4)",
              borderRadius: "var(--radius-lg)",
              background: "#fafafa",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <p style={mutedText}>Pontuação</p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 800,
                color: "#0f1117",
              }}
            >
              {current.score}
            </p>
          </div>

          <div
            style={{
              padding: "var(--space-4)",
              borderRadius: "var(--radius-lg)",
              background: "#fafafa",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <p style={mutedText}>Tendência</p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: trendColor(trend),
              }}
            >
              {formatTrend(trend)}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(0,0,0,0.06)",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <p style={sectionTitle}>Leitura da sessão</p>

          <p style={mutedText}>
            IES ponderado da sessão: {current.weightedIES.toFixed(1)}
          </p>

          <p style={mutedText}>
            Histórico considerado: {history.length} sessão{history.length === 1 ? "" : "ões"}
          </p>

          {averageHistoricScore !== null && deltaScorePct !== null && (
            <p style={mutedText}>
              Média histórica: {averageHistoricScore} pontos · variação atual:{" "}
              {deltaScorePct >= 0 ? "+" : ""}
              {deltaScorePct.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      <div style={{ ...card, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <p style={sectionTitle}>Desempenho por fase</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {current.rounds.map((round) => (
            <div
              key={round.roundIndex}
              style={{
                padding: "var(--space-4)",
                borderRadius: "var(--radius-lg)",
                background: "#fafafa",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "var(--text-sm)",
                  color: "#0f1117",
                }}
              >
                Fase {round.roundIndex} · Nível {round.level}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-2)",
                  ...mutedText,
                }}
              >
                <span>Alvos: {round.totalTargets}</span>
                <span>Acertos: {round.hits}</span>
                <span>Erros: {round.errors}</span>
                <span>Não marcados: {round.missed}</span>
                <span>Precisão: {(round.precision * 100).toFixed(0)}%</span>
                <span>Tempo médio: {round.avgReactionMs.toFixed(0)} ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {onClose && (
        <button style={primaryButton} onClick={onClose}>
          Fechar
        </button>
      )}
    </div>
  );
};

export default VisualSearchEvaluationScreen;