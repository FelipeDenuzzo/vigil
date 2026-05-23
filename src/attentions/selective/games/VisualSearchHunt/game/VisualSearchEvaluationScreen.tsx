/* src/attentions/selective/games/VisualSearchHunt/game/VisualSearchEvaluationScreen.tsx */

import type { VisualSearchScaleResult, VisualSearchTechnicalReport } from '../assessment/visualSearchScale.types';

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
      <div style={{ marginBottom: 32, padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
        <h2 style={{ margin: '0 0 16px' }}>{scaleResult.emoji} {scaleResult.scaleName}</h2>
        <p style={{ margin: '8px 0', fontSize: 18, fontWeight: 600 }}>
          {scaleResult.label}
        </p>
        <p style={{ margin: '8px 0', fontSize: 14, color: '#666' }}>
          {scaleResult.shortDescription}
        </p>
        <p style={{ margin: '16px 0 0', fontSize: 14, fontStyle: 'italic' }}>
          <strong>Significado clínico:</strong> {scaleResult.clinicalMeaning}
        </p>
      </div>

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