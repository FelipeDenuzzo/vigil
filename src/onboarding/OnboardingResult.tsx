import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { UserBaseline, OnboardingState } from './types';
import { useAuth } from '../lib/AuthContext';
import { callOnboardingEvaluator, OnboardingReport, EvaluatorInput } from '../lib/evaluatorClient';
import { EvaluationLoadingAnimation } from '../shared/EvaluationLoadingAnimation';
import { OnboardingRadar } from './OnboardingRadar';

interface Props {
  state: OnboardingState;
  onSave: (baseline: UserBaseline) => Promise<void>;
  saving: boolean;
  saveError: string | null;
}

export const OnboardingResult: React.FC<Props> = ({ state, onSave, saving, saveError }) => {
  const navigate = useNavigate();
  const { refreshAccess } = useAuth();
  
  const [report, setReport] = useState<OnboardingReport | null>(null);
  const [evaluating, setEvaluating] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 1. Inicia a avaliação do Gemini
    async function evaluate() {
      if (!state.baseline) return;
      
        const timeSecFlex = state.flexibleResult ? state.flexibleResult.totalTimeMs / 1000 : 60;
        const flexCost = timeSecFlex; // Considerando o tempo total como custo

        const payload: EvaluatorInput = {
          sessionId: 'onboarding-' + Date.now(),
          attentionType: 'onboarding',
          exercicio_1_calibragem: {
            tempo_de_reacao_medio_ms: (state.motorResult?.reactionTimes && state.motorResult.reactionTimes.length > 0)
              ? Math.round(state.motorResult.reactionTimes.reduce((a, b) => a + b, 0) / state.motorResult.reactionTimes.length)
              : 0,
            omissoes_alerta: state.motorResult?.omissions || 0,
          },
          exercicio_2_gonogo: {
            erros_omissao: state.inhibitoryResult?.omissionErrors,
            erros_comissao_impulsividade: state.inhibitoryResult?.commissionErrors,
          },
          exercicio_3_alternancia: {
            tempo_tarefa_simples_segundos: Math.round(timeSecFlex * 0.4), // Estimativa de base
            tempo_tarefa_alternada_segundos: Math.round(timeSecFlex),
            custo_de_alternancia_segundos: Math.round(flexCost),
          },
          exercicio_4_dupla_tarefa: {
            precisao_apenas_bolhas_porcento: Math.round((state.dividedResult?.precisionBubblesOnly || 0) * 100),
            precisao_bolhas_e_audio_simultaneos_porcento: Math.round((state.dividedResult?.precisionDualTask || 0) * 100),
            custo_de_dupla_tarefa_porcento: Math.round((state.dividedResult?.dualTaskCost || 0) * 100),
          }
        };

      try {
        const result = await callOnboardingEvaluator(payload);
        if (result) {
          setReport(result);
        }
      } catch (err) {
        console.warn('Erro ao avaliar onboarding:', err);
      } finally {
        setEvaluating(false);
      }
    }

    evaluate();
  }, [state]);

  useEffect(() => {
    // 2. Salva o baseline (silencioso)
    if (saved || !state.baseline) return;
    onSave(state.baseline)
      .then(() => refreshAccess())
      .then(() => setSaved(true))
      .catch(() => {}); // erro exibido via saveError
  }, [state.baseline, onSave, refreshAccess, saved]);

  if (evaluating) {
    return (
      <EvaluationLoadingAnimation />
    );
  }

  // Fallback caso a IA falhe
  if (!report) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-12)', maxWidth: '600px' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
          Perfil Salvo!
        </h1>
        <p style={{ color: '#ffffff', marginBottom: 'var(--space-8)' }}>
          Tudo pronto para iniciarmos o seu treinamento.
        </p>
        <Button variant="primary" onClick={() => navigate('/treinar', { replace: true })} style={{ width: '100%' }}>
          Ir para o treino
        </Button>
      </div>
    );
  }

  const [radarComplete, setRadarComplete] = useState(false);

  if (saved && !saving && radarComplete) {
    // If it's already completely saved and they passed the radar, just show the final button state
  }

  const { mensagem_ux } = report;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', maxWidth: '600px', paddingBottom: 'var(--space-8)' }}>
      {!radarComplete ? (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>
            {mensagem_ux.titulo}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', textAlign: 'center' }}>
            {mensagem_ux.paragrafo_boas_vindas}
          </p>
          <OnboardingRadar 
            scores={report.dados_grafico_teia} 
            onComplete={() => setRadarComplete(true)} 
          />
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-8)', textAlign: 'center' }}>
            A sua Análise Clínica
          </h1>
          
          {/* Gráfico Estático (apenas ilustrativo) - removido, vamos direto para os textos agora que ele já viu o Radar animado */}


      {/* Superpoder */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        borderLeft: '4px solid var(--color-sustained)',
      }}>
        <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-1)', color: 'var(--color-sustained)' }}>
          Seu Superpoder ⚡
        </h3>
        <p style={{ color: '#ffffff', fontSize: 'var(--text-sm)' }}>
          {mensagem_ux.superpoder}
        </p>
      </div>

      {/* Foco de Treino */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
        borderLeft: '4px solid var(--color-alternating)',
      }}>
        <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-1)', color: 'var(--color-alternating)' }}>
          Nosso Foco de Treino 🎯
        </h3>
        <p style={{ color: '#ffffff', fontSize: 'var(--text-sm)' }}>
          {mensagem_ux.foco_de_treino}
        </p>
      </div>

      {saveError && (
        <p style={{ color: 'var(--color-error, red)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
          {saveError}
        </p>
      )}

      <Button
        variant="primary"
        onClick={() => navigate('/treinar', { replace: true })}
        disabled={saving || !saved}
        style={{ width: '100%' }}
      >
        {saving ? 'Finalizando...' : 'Começar a Treinar!'}
      </Button>
      </div>
      )}
    </div>
  );
};
