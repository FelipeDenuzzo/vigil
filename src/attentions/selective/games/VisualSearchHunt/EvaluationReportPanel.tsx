import { GameResultUX } from '../../../../shared/components/GameResultUX';

export function EvaluationReportPanel(props: any) {
  const { scaleResult, scale, metrics, score, level, loaded, onRepeat, onBack, onClose } = props;

  let finalScore = score ?? scaleResult?.score ?? scale?.score ?? metrics?.ludicScore ?? metrics?.score ?? 0;
  let finalLevel = level ?? scaleResult?.level ?? scale?.level ?? metrics?.level ?? '';
  let isLoaded = loaded !== undefined ? loaded : true;
  let handleRepeat = onRepeat || (() => {});
  let handleBack = onBack || onClose || (() => {});

  // Determine attention type
  let attentionType: 'seletiva' | 'sustentada' | 'alternada' | 'dividida' = 'seletiva';
  const path = "src/attentions/selective/games/VisualSearchHunt/EvaluationReportPanel.tsx";
  if (path.includes('sustained')) attentionType = 'sustentada';
  if (path.includes('alternated') || path.includes('alternating')) attentionType = 'alternada';
  if (path.includes('divided')) attentionType = 'dividida';

  return (
    <GameResultUX
      score={finalScore}
      level={finalLevel}
      loaded={isLoaded}
      attentionType={attentionType}
      onRepeat={handleRepeat}
      onBack={handleBack}
    />
  );
}

export default EvaluationReportPanel;
