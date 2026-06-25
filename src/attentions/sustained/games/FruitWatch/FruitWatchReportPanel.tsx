// src/attentions/sustained/games/FruitWatch/FruitWatchReportPanel.tsx

import { useState } from 'react';
import { useAuth } from '../../../../lib/AuthContext';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import type { FruitWatchScore } from './types';
import { FIGURES } from './levels';
import { ReportDisclaimer } from '../../../../shared/components/ReportDisclaimer';

type Tab = 'ludic' | 'analysis' | 'phases';

const LEVEL_COLOR: Record<string, string> = {
  'mínimo':    '#6dbf87',
  'leve':      '#f5c070',
  'moderado':  '#f5a060',
  'importante':'#f08080',
};

interface Props {
  report: EvaluationReport;
  metrics: FruitWatchScore;
}

export function FruitWatchReportPanel({ report, metrics }: Props) {
  const { displayName } = useAuth();
  const [tab, setTab] = useState<Tab>('ludic');

  const score = report.ludic?.score ?? report.score;
  const emoji = report.ludic?.emoji ?? '🥷';
  const label = report.ludic?.label ?? 'Resultado processado';
  const level = report.level;

  const strengths = [
    ...(report.general?.strengths ?? []),
    ...(report.clinical?.strengths ?? [])
  ].filter((v, i, a) => a.indexOf(v) === i);

  const weaknesses = [
    ...(report.general?.weaknesses ?? []),
    ...(report.clinical?.weaknesses ?? [])
  ].filter((v, i, a) => a.indexOf(v) === i);

  const clinicalNote = report.clinical?.clinicalNote ?? '';
  const recommendation = report.general?.recommendation ?? '';

  const getPhaseDescription = (phase: number) => {
    switch (phase) {
      case 1: return 'Fase 1: 1 Figura (Semelhança Baixa)';
      case 2: return 'Fase 2: 2 Figuras (Semelhança Baixa)';
      case 3: return 'Fase 3: 2 Figuras (Semelhança Alta)';
      case 4: return 'Fase 4: 3 Figuras (Semelhança Alta)';
      case 5: return 'Fase 5: 3 Figuras + Pergunta Extra Depois';
      case 6: return 'Fase 6: 3 Figuras + Pergunta Extra Antes';
      default: return `Fase ${phase}`;
    }
  };

  return (
    <div className="result-card" style={s.wrapper}>
      {/* Disclaimer de saúde obrigatório */}
      <ReportDisclaimer />

      <div style={s.header}>
        <p style={s.title}>
          🧠 Análise de {displayName ? displayName.split(' ')[0] : 'Sessão'}
          {level && <span style={s.levelBadge(level)}>{level}</span>}
        </p>
        <div style={s.tabRow}>
          {(['ludic', 'analysis', 'phases'] as Tab[]).map((t) => (
            <button key={t} type="button" style={s.tab(tab === t)} onClick={() => setTab(t)}>
              {t === 'ludic' ? '🎯 Régua' : t === 'analysis' ? '📋 Análise' : '📈 Fases'}
            </button>
          ))}
        </div>
      </div>

      <div style={s.body}>
        {tab === 'ludic' && (
          <>
            <p style={s.ludicScore}>{emoji} {score}</p>
            {label && <p style={s.ludicLabel}>{label}</p>}
            
            <div style={s.gaugeWrap}>
              <div style={s.gaugeTrack}>
                <div style={s.gaugeMarker(score)} />
              </div>
              <div style={s.gaugeLegend}>
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>

            {/* Caixa com os três eixos de pontuação calculados */}
            <div style={s.scoresBox}>
              <p style={s.scoresBoxTitle}>Eixos de Atenção Sustentada</p>
              
              <div style={s.scoreItem}>
                <div style={s.scoreLabelRow}>
                  <span>🎯 Foco Contínuo (Vigilância)</span>
                  <span style={{ fontWeight: 700 }}>{metrics.focoContinuo}%</span>
                </div>
                <p style={s.scoreDesc}>Mede a estabilidade do foco e a ausência de omissões (subcontagem) ao longo do tempo.</p>
              </div>

              <div style={s.scoreItem}>
                <div style={s.scoreLabelRow}>
                  <span>⚖️ Controle e Calma (Inibição)</span>
                  <span style={{ fontWeight: 700 }}>{metrics.controleCalma}%</span>
                </div>
                <p style={s.scoreDesc}>Avalia a capacidade de não contar figuras semelhantes distratoras (supercontagem) e a ausência de comissões.</p>
              </div>

              <div style={s.scoreItem}>
                <div style={s.scoreLabelRow}>
                  <span>🔄 Foco Multitarefa (Memória)</span>
                  <span style={{ fontWeight: 700 }}>{metrics.focoMultitarefa}%</span>
                </div>
                <p style={s.scoreDesc}>Calcula o custo cognitivo de reter e gerenciar contagens simultâneas na memória de trabalho.</p>
              </div>

              {metrics.conquistaSecreta && (
                <div style={s.bonusBadge}>
                  🌟 Percepção Periférica Aguçada Detectada!
                </div>
              )}
            </div>

            {recommendation && (
              <p style={s.recommendation}>💡 {recommendation}</p>
            )}
          </>
        )}

        {tab === 'analysis' && (
          <>
            {clinicalNote && <div style={s.analysisBlock}>{clinicalNote}</div>}
            
            {strengths.length > 0 && (
              <>
                <p style={s.sectionTitle}>✅ O que foi bem</p>
                {strengths.map((item, i) => (
                  <div key={i} style={s.listItem}>
                    <span style={s.dot('#6dbf87')} />
                    {item}
                  </div>
                ))}
              </>
            )}

            {weaknesses.length > 0 && (
              <>
                <p style={s.sectionTitle}>⚠️ Pontos de atenção</p>
                {weaknesses.map((item, i) => (
                  <div key={i} style={s.listItem}>
                    <span style={s.dot('#f5c070')} />
                    {item}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'phases' && (
          <>
            <p style={s.sectionTitle}>Detalhamento das Rodadas</p>
            {metrics.rawResults.map((p, i) => {
              const targetDef = FIGURES.find(f => f.id === p.targetFigureId);
              const bonusDef = p.bonusFigureId ? FIGURES.find(f => f.id === p.bonusFigureId) : undefined;
              
              return (
                <div key={i} style={s.phaseCard}>
                  <p style={s.phaseCardTitle}>{getPhaseDescription(p.phase)}</p>
                  
                  <div style={s.phaseRowLayout}>
                    {/* Alvo Principal */}
                    <div style={s.figureStatCol}>
                      <span style={s.figureLabel}>Alvo Principal</span>
                      {targetDef && (
                        <div style={s.figureAvatarBox}>
                          <img src={targetDef.imagePath} alt="" style={s.figureImg} />
                        </div>
                      )}
                      <div style={s.statNumbers}>
                        <span>Viu: <b>{p.userAnswer}</b></span>
                        <span style={s.statReal}>Real: {p.targetCount}</span>
                      </div>
                    </div>

                    {/* Alvo Secundário (Bônus) se existir */}
                    {bonusDef && p.bonusRealCount !== undefined && p.bonusUserAnswer !== undefined && (
                      <div style={s.figureStatCol}>
                        <span style={s.figureLabel}>Item Extra</span>
                        <div style={s.figureAvatarBox}>
                          <img src={bonusDef.imagePath} alt="" style={s.figureImg} />
                        </div>
                        <div style={s.statNumbers}>
                          <span>Viu: <b>{p.bonusUserAnswer}</b></span>
                          <span style={s.statReal}>Real: {p.bonusRealCount}</span>
                        </div>
                      </div>
                    )}

                    {/* Comissões / Erros de Toque */}
                    <div style={s.extraStatCol}>
                      <span style={s.figureLabel}>Controle Motor</span>
                      <div style={s.commissionValue(p.commissionErrors)}>
                        {p.commissionErrors}
                      </div>
                      <span style={s.commissionLabel}>
                        {p.commissionErrors === 0 ? 'Sem toques na tela' : `${p.commissionErrors} toques acidentais`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, any> = {
  wrapper: {
    background: 'rgb(22, 24, 32)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: { padding: '16px 16px 0' },
  title:  { fontSize: 17, fontWeight: 700, color: '#e8e9f0', marginBottom: 12 },
  tabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '10px 4px',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    color: active ? '#6c8ef5' : '#ffffff',
    borderBottom: active ? '2px solid #6c8ef5' : '2px solid transparent',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    transition: 'color 0.18s',
  }),
  body:      { padding: 16, display: 'grid', gap: 12 },
  gaugeWrap: { position: 'relative', marginTop: 8, marginBottom: 4 },
  gaugeTrack: {
    height: 12,
    borderRadius: 99,
    background: 'linear-gradient(to right, #f08080, #f5c070, #6dbf87)',
    position: 'relative',
  },
  gaugeMarker: (pct: number): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    left: `${pct}%`,
    transform: 'translate(-50%, -50%)',
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    border: '3px solid #6c8ef5',
    boxShadow: '0 0 0 3px rgba(108,142,245,0.3)',
  }),
  gaugeLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 6,
    fontSize: 12,
    color: '#ffffff',
  },
  ludicScore: {
    textAlign: 'center',
    fontSize: 49,
    fontWeight: 800,
    color: '#e8e9f0',
    lineHeight: 1,
    marginTop: 16,
  },
  ludicLabel: {
    textAlign: 'center',
    fontSize: 19,
    fontWeight: 600,
    color: '#a0b4f8',
    marginTop: 6,
    marginBottom: 4,
  },
  scoresBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: '16px 20px',
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  scoresBoxTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#6c8ef5',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  scoreLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#e8e9f0',
    fontWeight: 600,
  },
  scoreDesc: {
    fontSize: 12,
    color: '#a0a4be',
    margin: 0,
    lineHeight: 1.4,
  },
  bonusBadge: {
    background: 'rgba(109,191,135,0.12)',
    color: '#6dbf87',
    border: '1px solid rgba(109,191,135,0.25)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 4,
  },
  recommendation: {
    fontSize: 14,
    color: '#c8cad8',
    lineHeight: 1.6,
    padding: '10px 14px',
    background: 'rgba(108,142,245,0.08)',
    borderRadius: 10,
    textAlign: 'center',
  },
  analysisBlock: {
    fontSize: 15,
    color: '#c8cad8',
    lineHeight: 1.7,
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 8,
    marginTop: 2,
  },
  listItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    fontSize: 14,
    color: '#c8cad8',
    lineHeight: 1.55,
    marginBottom: 7,
  },
  dot: (color: string): React.CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: 5,
  }),
  levelBadge: (level: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 700,
    color: LEVEL_COLOR[level] ?? '#e8e9f0',
    border: `1px solid ${LEVEL_COLOR[level] ?? '#e8e9f0'}`,
    marginLeft: 8,
  }),
  phaseCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 8,
  },
  phaseCardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#a0a4be',
    margin: '0 0 12px 0',
  },
  phaseRowLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: 12,
    alignItems: 'center',
  },
  figureStatCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: '8px 4px',
    border: '1px solid rgba(255,255,255,0.02)',
  },
  figureLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  figureAvatarBox: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  figureImg: {
    width: 32,
    height: 32,
    objectFit: 'contain',
  },
  statNumbers: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 13,
    color: '#e8e9f0',
    gap: 2,
  },
  statReal: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  extraStatCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: '8px 4px',
    border: '1px solid rgba(255,255,255,0.02)',
  },
  commissionValue: (errors: number) => ({
    fontSize: 19,
    fontWeight: 800,
    color: errors > 0 ? '#f08080' : '#6dbf87',
    lineHeight: '44px',
    height: 44,
    display: 'block',
    textAlign: 'center',
  }),
  commissionLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
};
