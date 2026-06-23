import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { useProgressData, AttentionType } from '../hooks/useProgressData';

const TABS: { type: AttentionType; label: string; color: string }[] = [
  { type: 'seletiva',   label: '🎯 Seletiva',   color: '#6c8ef5' },
  { type: 'sustentada', label: '⏱ Sustentada',  color: '#6dbf87' },
  { type: 'alternada',  label: '🔀 Alternada',  color: '#f5c070' },
  { type: 'dividida',   label: '⚖️ Dividida',   color: '#c084fc' },
];

const LEVEL_COLOR: Record<string, string> = {
  'mínimo': '#6dbf87', 'minimo': '#6dbf87', 'leve': '#a0b4f8', 'moderado': '#f5c070', 'importante': '#f08080',
};

function formatShortDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const Historico: React.FC = () => {
  const navigate = useNavigate();
  const { byType, streak, loading, error } = useProgressData();
  const [activeTab, setActiveTab] = useState<AttentionType>('seletiva');

  const prog = byType[activeTab];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <Button variant="ghost" onClick={() => navigate('/treinar')} style={{ marginBottom: 'var(--space-8)' }}>
        ← Voltar
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>📊 Histórico de treinos</h1>

        {/* Streak */}
        {!loading && streak.current > 0 && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-5)', textAlign: 'center' }}>
            <span style={{ fontSize: '1.4rem' }}>🔥</span>
            <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{streak.current} dia{streak.current > 1 ? 's' : ''}</p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              sequência atual{streak.best > streak.current ? ` · recorde: ${streak.best}` : ' · recorde!'}
            </p>
          </div>
        )}
      </div>

      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>}
      {error   && <p style={{ color: '#f08080' }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Abas */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
            {TABS.map(({ type, label, color }) => (
              <button key={type} onClick={() => setActiveTab(type)} style={{
                padding: '6px 16px', borderRadius: 99, fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${activeTab === type ? color : 'var(--color-border)'}`,
                background: activeTab === type ? `${color}22` : 'transparent',
                color: activeTab === type ? color : 'var(--color-text-muted)',
                transition: 'all 0.15s',
              }}>
                {label}
              </button>
            ))}
          </div>

          {prog && (
            <>
              {/* Resumo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                {[
                  { label: 'Baseline', value: prog.baseline ? `${prog.baseline.score}pts` : '—' },
                  { label: 'Melhor score', value: prog.bestScore !== null ? `${prog.bestScore}pts` : '—' },
                  { label: 'Delta total', value: prog.deltaFromBaseline !== null ? `${prog.deltaFromBaseline >= 0 ? '+' : ''}${prog.deltaFromBaseline}pts` : '—' },
                  { label: 'Sessões', value: String(prog.sessions.length) },
                ].map(({ label, value }) => (
                  <Card key={label} style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{label}</p>
                    <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 'var(--text-xl)' }}>{value}</p>
                  </Card>
                ))}
              </div>

              {/* Gráfico de linha */}
              {prog.sessions.length >= 2 ? (
                <Card style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  <p style={{ margin: '0 0 var(--space-4)', fontWeight: 600 }}>Evolução do score</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={prog.sessions.map((s) => ({ date: formatShortDate(s.date), score: s.score }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--color-text-muted)' }}
                      />
                      {prog.baseline && (
                        <ReferenceLine y={prog.baseline.score} stroke="rgba(139,143,168,0.5)"
                          strokeDasharray="4 3" label={{ value: 'baseline', fill: 'var(--color-text-muted)', fontSize: 10 }} />
                      )}
                      <Line type="monotone" dataKey="score" stroke={TABS.find((t) => t.type === activeTab)?.color ?? '#6c8ef5'}
                        strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              ) : (
                <Card style={{ textAlign: 'center', padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
                  <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                    Complete pelo menos 2 sessões de {TABS.find((t) => t.type === activeTab)?.label} para ver o gráfico de evolução.
                  </p>
                </Card>
              )}

              {/* Lista de sessões */}
              {[...prog.sessions].reverse().map((s) => (
                <Card key={s.sessionId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', padding: 'var(--space-4) var(--space-5)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    {new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>{s.score}</span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 'var(--text-xs)', fontWeight: 600,
                      background: `${LEVEL_COLOR[s.level] ?? '#8b8fa8'}22`,
                      color: LEVEL_COLOR[s.level] ?? '#8b8fa8',
                      border: `1px solid ${LEVEL_COLOR[s.level] ?? '#8b8fa8'}55`,
                    }}>
                      {s.level}
                    </span>
                  </div>
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};
