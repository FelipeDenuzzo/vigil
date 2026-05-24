// src/attentions/selective/games/VisualSearchHunt/EagleScale.tsx

type EagleScaleProps = {
  score: number;
  positionPercent: number;
  leftLabel?: string;
  rightLabel?: string;
  markerLabel?: string;
};

export function EagleScale({
  score,
  positionPercent,
  leftLabel = "Águia Cega",
  rightLabel = "Super Águia",
  markerLabel
}: EagleScaleProps) {
  const safePosition = Math.max(0, Math.min(100, positionPercent));

  return (
    <div style={{ width: "100%", maxWidth: 760, margin: "0 auto" }}>
      <div
        style={{
          position: "relative",
          width: "100%"
        }}
      >
        <img
          src="/Reguas/olhosdeaguia.png"
          alt="Régua Olho de Águia"
          style={{
            display: "block",
            width: "100%",
            height: "auto"
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${safePosition}%`,
            top: "-8px",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none"
          }}
        >
          <div
            style={{
              fontSize: 28,
              lineHeight: 1,
              color: "#111827",
              textShadow: "0 1px 2px rgba(255,255,255,0.7)"
            }}
          >
            ▼
          </div>

          <div
            style={{
              marginTop: 4,
              padding: "4px 10px",
              borderRadius: 999,
              background: "#111827",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap"
            }}
          >
            {Math.round(score)}/100
          </div>

          {markerLabel ? (
            <div
              style={{
                marginTop: 4,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.92)",
                color: "#111827",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                border: "1px solid rgba(17,24,39,0.12)"
              }}
            >
              {markerLabel}
            </div>
          ) : null}

          <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
            {safePosition}%
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
          fontSize: 14,
          fontWeight: 700,
          color: "#374151"
        }}
      >
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}