/* src/attentions/selective/games/VisualSearchHunt/game/VisualSearchEvaluationScreen.tsx */

import type { VisualSearchScaleResult, VisualSearchTechnicalReport } from '../assessment/visualSearchScale.types';
import { EagleScale } from '../EagleScale';

type Props = {
  scaleResult: VisualSearchScaleResult;
  technicalReport: VisualSearchTechnicalReport;
};

export function VisualSearchEvaluationScreen({
  scaleResult,
  technicalReport,
}: Props): JSX.Element {
  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      {/* Régua Visual */}
      <EagleScale
        score={scaleResult.score}
        positionPercent={scaleResult.positionPercent}
        leftLabel={scaleResult.leftLabel}
        rightLabel={scaleResult.rightLabel}
        markerLabel={scaleResult.markerLabel}
      />

      <hr style={{ margin: '24px 0' }} />

      {/* Leitura Técnica */}
      <div>
        <h3>Leitura Técnica</h3>
        
        <p>
          <strong>Pergunta:</strong> {technicalReport.question}
        </p>
        
        <p>
          <strong>Resposta:</strong> {technicalReport.answer === 'sim' ? 'Sim' : 'Não'}
        </p>
        
        <p>
          <strong>Padrão dominante:</strong> {technicalReport.dominantPattern}
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

        {/* Evidências */}
        <h4 style={{ marginTop: 24 }}>Evidências</h4>
        <ul style={{ fontSize: 14, color: '#666' }}>
          <li>Total de alvos: {technicalReport.evidence.totalTargets}</li>
          <li>Acertos: {technicalReport.evidence.totalHits}</li>
          <li>Erros: {technicalReport.evidence.totalErrors}</li>
          <li>Omissões: {technicalReport.evidence.totalMissedTargets}</li>
          <li>Taxa de omissão: {(technicalReport.evidence.omissionRate * 100).toFixed(1)}%</li>
          <li>Taxa de comissão: {(technicalReport.evidence.commissionRate * 100).toFixed(1)}%</li>
          <li>Acurácia: {(technicalReport.evidence.accuracyRate * 100).toFixed(1)}%</li>
          {technicalReport.evidence.dPrime !== null && (
            <li>d' (Sensibilidade): {technicalReport.evidence.dPrime.toFixed(2)}</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default VisualSearchEvaluationScreen;