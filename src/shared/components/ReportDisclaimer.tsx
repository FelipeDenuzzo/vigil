// src/shared/components/ReportDisclaimer.tsx
// Banner fixo de aviso exibido em TODOS os laudos gerados por IA,
// independente da aba ativa. Obrigatório para conformidade com
// ANVISA RDC 40/2015 e LGPD (dados de saúde Art. 5º, II).

const style: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 16px',
  background: 'rgba(240,128,128,0.07)',
  borderBottom: '1px solid rgba(240,128,128,0.18)',
  fontSize: 12,
  color: '#b0b4c8',
  lineHeight: 1.6,
};

const iconStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 14,
  marginTop: 1,
};

export function ReportDisclaimer() {
  return (
    <div style={style} role="note" aria-label="Aviso sobre natureza do resultado">
      <span style={iconStyle}>⚠️</span>
      <span>
        <strong style={{ color: '#e8e9f0' }}>Este resultado é informativo e educativo.</strong>{' '}
        Não constitui diagnóstico clínico e não substitui avaliação por profissional de saúde
        habilitado (neuropsicólogo, psicólogo ou médico). Em caso de dúvidas sobre sua saúde
        cognitiva, consulte um profissional certificado.
      </span>
    </div>
  );
}
