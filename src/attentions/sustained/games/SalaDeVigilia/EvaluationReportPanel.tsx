import React from 'react';
import { ReguaLudica } from '../../../../shared/components/ReguaLudica';

interface EvaluationReportPanelProps {
  report: any;
  isEvaluating: boolean;
  error: Error | null;
  onClose: () => void;
  onRepeat: () => void;
}

export const EvaluationReportPanel: React.FC<EvaluationReportPanelProps> = ({
  report,
  isEvaluating,
  error,
  onClose,
  onRepeat
}) => {
  if (isEvaluating) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>Analisando desempenho cognitivo...</div>
        {/* Placeholder for spinner */}
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#f87171' }}>
        <h2>Erro na Avaliação</h2>
        <p>{error.message}</p>
        <button onClick={onClose} style={{ marginTop: '1rem', padding: '8px 16px', background: 'white', color: 'black', border: 'none', borderRadius: '4px' }}>Voltar</button>
      </div>
    );
  }

  if (!report) return null;

  const { metrics, scaleResult, geminiReport } = report;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '800px', width: '100%', backgroundColor: '#1e1e2f', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
          <h1 style={{ color: 'var(--color-sustained, #2563eb)', margin: '0 0 0.5rem 0' }}>Laudo: Sala de Vigília</h1>
          <ReguaLudica score={scaleResult.score} level={scaleResult.level} />
        </header>

        {/* Camada Lúdica / Geral */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>Feedback Geral</h2>
          <div style={{ backgroundColor: '#252538', padding: '1.5rem', borderRadius: '8px', color: '#d1d5db', fontSize: '1.1rem', lineHeight: '1.6' }}>
            <p><strong>Resumo:</strong> {geminiReport?.general?.summary || "Excelente esforço! Você concluiu a tarefa focada na manutenção da atenção em ambiente monótono."}</p>
            {geminiReport?.general?.recommendation && (
              <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#9ca3af' }}>Dica: {geminiReport.general.recommendation}</p>
            )}
          </div>
        </section>

        {/* Métricas Raw */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>Métricas Locais</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <MetricCard label="Omissões" value={metrics.omissions} severity={scaleResult.omissionSeverity} />
            <MetricCard label="Comissões (Falso Alarme)" value={metrics.commissions} severity={scaleResult.commissionSeverity} />
            <MetricCard label="Tempo Médio (RT)" value={`${Math.round(metrics.meanRT)} ms`} />
            <MetricCard label="Desvio (RT)" value={`${Math.round(metrics.sdRT)} ms`} severity={scaleResult.rtVariabilitySeverity} />
            <MetricCard label="Queda de Vigilância" value={`${(metrics.vigilanceDecrement * 100).toFixed(1)}%`} severity={scaleResult.vigilanceDecrementSeverity} />
          </div>
        </section>

        {/* Camada Clínica (se o gemini retornar) */}
        {geminiReport && geminiReport.clinical && (
          <section style={{ marginBottom: '2rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>Nota Clínica (Profissional)</h2>
            <div style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p><strong>Análise:</strong> {geminiReport.clinical.clinicalNote}</p>
              
              {geminiReport.clinical.weaknesses && geminiReport.clinical.weaknesses.length > 0 && (
                <div>
                  <strong>Pontos de Atenção:</strong>
                  <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                    {geminiReport.clinical.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: '4px solid #fbbf24', color: '#fbbf24' }}>
                <strong>Recomendação Clínica:</strong> {geminiReport.clinical.recommendation}
              </div>
            </div>
          </section>
        )}

        {/* Ações */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button onClick={onRepeat} style={{ padding: '12px 24px', background: '#374151', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>
            Repetir Treino
          </button>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'var(--color-sustained, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
            Voltar ao Menu
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper 
const MetricCard = ({ label, value, severity }: { label: string, value: string | number, severity?: string }) => {
  const getColor = () => {
    switch(severity) {
      case 'normal': case 'low': case 'none': return '#4ade80'; // green
      case 'mild': return '#facc15'; // yellow
      case 'moderate': return '#fb923c'; // orange
      case 'severe': case 'high': return '#f87171'; // red
      default: return 'white';
    }
  };

  return (
    <div style={{ backgroundColor: '#252538', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
      <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ color: getColor(), fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
};
