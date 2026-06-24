import { useEffect, useState } from 'react';

const MESSAGES = [
  { icon: '🧩', text: 'Mapeando seus caminhos...' },
  { icon: '🔍', text: 'Analisando estratégia de navegação...' },
  { icon: '🧠', text: 'Avaliando padrões de atenção...' },
  { icon: '📊', text: 'Calculando eficiência por fase...' },
  { icon: '✨', text: 'Preparando seu relatório...' },
];

const ORGANIZING_MESSAGES = [
  { icon: '📝', text: 'Organizando resultados...' },
  { icon: '🏁', text: 'Quase lá!' },
];

export function LongMazesEvaluationLoadingAnimation({
  phase,
}: {
  phase: 'analyzing' | 'organizing';
}) {
  const list = phase === 'analyzing' ? MESSAGES : ORGANIZING_MESSAGES;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 2200);
    return () => clearInterval(t);
  }, [list.length]);

  const { icon, text } = list[idx];

  return (
    <div style={s.wrap}>
      <div style={s.iconWrap}>
        <span style={s.icon}>{icon}</span>
        <div style={s.ring} />
      </div>
      <p style={s.text}>{text}</p>
      <p style={s.sub}>Isso pode levar alguns segundos</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 16, minHeight: 260,
    padding: 32, textAlign: 'center',
  },
  iconWrap: { position: 'relative', width: 72, height: 72 },
  icon: {
    fontSize: 40, lineHeight: '72px',
    display: 'block', textAlign: 'center',
  },
  ring: {
    position: 'absolute', inset: 0,
    borderRadius: '50%',
    border: '3px solid transparent',
    borderTopColor: '#6c8ef5',
    animation: 'spin 1s linear infinite',
  },
  text: { fontSize: 16, fontWeight: 700, color: '#e8e9f0', margin: 0 },
  sub:  { fontSize: 12, color: '#ffffff', margin: 0 },
};
