// src/attentions/divided/games/MentalVault/MentalVaultGame.tsx
import React, { useState, useRef } from 'react';
import { MentalVaultFase, TentativaFase2, RegistroRodada, CondicaoRodada } from './types';
import { EncodingPhase } from './EncodingPhase';
import { ProcessingPhase } from './ProcessingPhase';
import { RecallPhase } from './RecallPhase';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';
import { calculateSessionMetrics } from '../../../../assessment/mentalVault/calculateMentalVaultMetrics';
import MentalVaultSimulation from './MentalVaultSimulation';

interface Props {
  sessionId: string;
  onClose?: () => void;
  onComplete?: (resultado: { nivelMaximo: number; rodadas: RegistroRodada[]; startedAt: string }) => void;
}

const CONSONANTS_POOL = 'BCDFGHJKLMNPQRSTVWXYZ';

function generateConsonants(length: number): string[] {
  const letters: string[] = [];
  const pool = CONSONANTS_POOL.split('');
  for (let i = 0; i < length; i++) {
    if (pool.length === 0) break;
    const randomIndex = Math.floor(Math.random() * pool.length);
    letters.push(pool.splice(randomIndex, 1)[0]);
  }
  return letters;
}

// Configurações desacopladas por nível de dificuldade
interface LevelConfig {
  quantidadeConsoantes: number; // Número de consoantes a memorizar (3 a 6)
  tempoLimiteMs: number;        // Tempo limite de resposta por dígito (ms)
  condicaoPadrao: 'pura' | 'mista';
}

const CONFIG_BY_LEVEL: Record<number, LevelConfig> = {
  1: { quantidadeConsoantes: 3, tempoLimiteMs: 2500, condicaoPadrao: 'pura' },
  2: { quantidadeConsoantes: 4, tempoLimiteMs: 2200, condicaoPadrao: 'pura' },
  3: { quantidadeConsoantes: 4, tempoLimiteMs: 2200, condicaoPadrao: 'mista' },
  4: { quantidadeConsoantes: 5, tempoLimiteMs: 1800, condicaoPadrao: 'mista' },
  5: { quantidadeConsoantes: 6, tempoLimiteMs: 1500, condicaoPadrao: 'mista' },
};

export const MentalVaultGame: React.FC<Props> = ({ sessionId: _sessionId, onClose, onComplete }) => {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<MentalVaultFase>('instrucoes');

  // Estado da sessão (6 rodadas: 3 puras e 3 mistas balanceadas)
  const [sessionConditions, setSessionConditions] = useState<CondicaoRodada[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  // Dados da rodada ativa
  const [targetLetters, setTargetLetters] = useState<string[]>([]);
  const [processingResults, setProcessingResults] = useState<TentativaFase2[]>([]);

  // Histórico de rodadas concluídas
  const roundHistoryRef = useRef<RegistroRodada[]>([]);
  const startedAtRef = useRef<string>('');

  const activeLevelConfig = CONFIG_BY_LEVEL[level] || CONFIG_BY_LEVEL[1];
  const activeCondition = sessionConditions[currentRoundIndex] || activeLevelConfig.condicaoPadrao;

  // Embaralha pseudoaleatoriamente e balanceadamente
  const generateSessionConditions = (): ('pura' | 'mista')[] => {
    const conds: ('pura' | 'mista')[] = ['pura', 'pura', 'pura', 'mista', 'mista', 'mista'];
    for (let i = conds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [conds[i], conds[j]] = [conds[j], conds[i]];
    }
    return conds;
  };

  const handleStartGame = () => {
    const conditions = generateSessionConditions();
    setSessionConditions(conditions);
    setCurrentRoundIndex(0);
    setLevel(1);
    roundHistoryRef.current = [];
    startedAtRef.current = new Date().toISOString();

    startRound(0, 1, conditions[0]);
  };

  const startRound = (_roundIdx: number, currentLevel: number, _cond: 'pura' | 'mista') => {
    const config = CONFIG_BY_LEVEL[currentLevel] || CONFIG_BY_LEVEL[1];
    const letters = generateConsonants(config.quantidadeConsoantes);
    setTargetLetters(letters);
    setProcessingResults([]);
    setPhase('codificacao');
  };

  const handleEncodingComplete = () => {
    setPhase('processamento');
  };

  const handleProcessingComplete = (results: TentativaFase2[]) => {
    setProcessingResults(results);
    setPhase('recall');
  };

  const handleRecallComplete = (answers: string[]) => {
    const roundResult: RegistroRodada = {
      sequenciaAlvo: targetLetters,
      sequenciaDigitada: answers,
      condicaoRodada: activeCondition,
      totalDigitosApresentados: 8, // Cada rodada sempre apresenta 8 estímulos de processamento
      tentativas: processingResults,
    };

    roundHistoryRef.current.push(roundResult);

    // Avança de nível/rodada diretamente sem mostrar resultados parciais intermediários
    const isRecallCorrect = roundResult.sequenciaDigitada.length === roundResult.sequenciaAlvo.length &&
      roundResult.sequenciaDigitada.every((val, idx) => val === roundResult.sequenciaAlvo[idx]);

    const correctProcessingCount = roundResult.tentativas.filter((t) => t.acertou).length;
    const processingAccuracy = (correctProcessingCount / roundResult.totalDigitosApresentados) * 100;

    const success = isRecallCorrect && processingAccuracy >= 80;

    let nextLevel = level;
    if (success) {
      if (level < 5) {
        nextLevel = level + 1;
        setLevel(nextLevel);
      }
    }

    const nextRoundIdx = currentRoundIndex + 1;
    if (nextRoundIdx < 6) {
      setCurrentRoundIndex(nextRoundIdx);
      startRound(nextRoundIdx, nextLevel, sessionConditions[nextRoundIdx]);
    } else {
      // Fim das 6 rodadas: Conclui a sessão completa
      handleFinishSession(nextLevel);
    }
  };

  const handleFinishSession = (finalLevel: number = level) => {
    if (onComplete) {
      onComplete({
        nivelMaximo: finalLevel,
        rodadas: roundHistoryRef.current,
        startedAt: startedAtRef.current,
      });
    }
    setPhase('resumo');
  };

  // Renderizar as telas correspondentes
  const renderContent = () => {
    switch (phase) {
      case 'instrucoes':
        return (
          <Card style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: '420px', margin: '0 auto' }}>
            <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)' }}>
              🔐 Cofre Mental
            </h2>
            <p style={{ color: '#ffffff', marginBottom: 'var(--space-6)', textAlign: 'center', fontSize: '15px', lineHeight: '1.7' }}>
              Guarde uma sequência de letras e classifique os números que aparecem na tela. No final, digite as letras na mesma ordem para abrir o cofre.
            </p>
            <Button
              variant="primary"
              onClick={() => setPhase('simulacao')}
              style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
            >
              Iniciar
            </Button>
          </Card>
        );

      case 'simulacao':
        return (
          <MentalVaultSimulation
            onDone={handleStartGame}
          />
        );

      case 'codificacao':
        return (
          <EncodingPhase
            letters={targetLetters}
            displayDurationMs={1500} // Fixo em 1500ms por consoante
            onComplete={handleEncodingComplete}
          />
        );

      case 'processamento':
        return (
          <ProcessingPhase
            trialsCount={8}
            condition={activeCondition}
            digitDurationMs={activeLevelConfig.tempoLimiteMs}
            onComplete={handleProcessingComplete}
          />
        );

      case 'recall':
        return (
          <RecallPhase
            targetLetters={targetLetters}
            onComplete={handleRecallComplete}
          />
        );

      case 'resumo': {
        const metrics = calculateSessionMetrics(level, roundHistoryRef.current);

        return (
          <Card style={{ padding: 'var(--space-6)', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
              🏁 Resultados do Treino
            </h2>
            <p style={{ color: '#ffffff', marginBottom: 'var(--space-6)', textAlign: 'center', fontSize: '14px' }}>
              Treino do Cofre Mental concluído! Confira o resultado consolidado e o desempenho detalhado por rodada abaixo.
            </p>

            {/* Resultado Consolidado da Sessão */}
            <h3 style={{ color: 'var(--color-text)', fontSize: '15px', fontWeight: 700, marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: '5px' }}>
              📊 Resultado Consolidado da Sessão
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)'
            }}>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Recall de Letras Médio</span>
                <span style={styles.metricValue}>{Math.round(metrics.avgAbsoluteRecall * 100)}%</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Tempo de Reação Médio</span>
                <span style={styles.metricValue}>{(metrics.avgDigitMeanRtMs / 1000).toFixed(3)} s</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Erros de Comissão</span>
                <span style={styles.metricValue}>{metrics.totalCommissionErrors}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Omissões</span>
                <span style={styles.metricValue}>{metrics.totalOmissions}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Eficiência de Dígitos (IES)</span>
                <span style={styles.metricValue}>{metrics.avgDigitIes}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Custo de Atenção (TBRS Cost)</span>
                <span style={{
                  ...styles.metricValue,
                  color: metrics.tbrsCost > 0 ? 'var(--color-selective)' : 'var(--color-sustained)'
                }}>
                  {metrics.tbrsCost > 0 ? `+${metrics.tbrsCost.toFixed(2)}` : metrics.tbrsCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Resultado por Rodada */}
            <h3 style={{ color: 'var(--color-text)', fontSize: '15px', fontWeight: 700, marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: '5px' }}>
              📋 Desempenho por Rodada
            </h3>
            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: 'var(--space-6)', paddingRight: '5px' }}>
              {metrics.rodadas.map((r, index) => {
                const isCorrect = r.absoluteRecall === 1.0;
                return (
                  <div key={index} style={{
                    display: 'flex',
                    flexDirection: 'column' as const,
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255,255,255,0.01)',
                    marginBottom: 'var(--space-2)',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                      <span style={{ color: 'var(--color-text)' }}>Rodada {index + 1} ({r.condicaoRodada === 'pura' ? 'Pura' : 'Mista'})</span>
                      <span style={{ color: isCorrect ? 'var(--color-sustained)' : 'var(--color-selective)' }}>
                        {isCorrect ? '🔓 Cofre Aberto' : '🔒 Cofre Trancado'}
                      </span>
                    </div>
                    <div style={{ color: '#ffffff', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                      <span>Alvo: <strong>{r.sequenciaAlvo.join(' ')}</strong></span>
                      <span>Resposta: <strong>{r.sequenciaDigitada.join(' ') || '-'}</strong></span>
                      <span>Precisão Dígitos: {(r.digitAccuracy * 100).toFixed(0)}%</span>
                      <span>TR Médio: {(r.digitMeanRtMs / 1000).toFixed(3)} s</span>
                      <span>Erros: C: {r.digitCommissionErrors} | O: {r.digitOmissions}</span>
                      <span>IES da Rodada: {r.digitIes}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button variant="primary" onClick={onClose} style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}>
              Voltar ao Hub
            </Button>
          </Card>
        );
      }
    }
  };

  const styles = {
    metricItem: {
      backgroundColor: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3)',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
    },
    metricLabel: {
      fontSize: '11px',
      color: '#ffffff',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
      marginBottom: '4px',
    },
    metricValue: {
      fontSize: '20px',
      fontWeight: 800,
      color: 'var(--color-text)',
    },
  };

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: 'var(--space-4)' }}>
      {phase !== 'instrucoes' && phase !== 'simulacao' && phase !== 'resumo' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: '#ffffff' }}>
          <span>Rodada {currentRoundIndex + 1} de 6 (Nível {level})</span>
          <span>Fase: {
            phase === 'codificacao' ? 'Codificação' :
            phase === 'processamento' ? `Processamento (${activeCondition === 'pura' ? 'Puro' : 'Misto'})` :
            'Recall'
          }</span>
        </div>
      )}
      {renderContent()}
    </div>
  );
};
