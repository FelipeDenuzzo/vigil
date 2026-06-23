import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { UserBaseline, OnboardingState } from './types';
import { useAuth } from '../lib/AuthContext';
import { callOnboardingEvaluator, OnboardingReport, EvaluatorInput } from '../lib/evaluatorClient';
import { EvaluationLoadingAnimation } from '../shared/EvaluationLoadingAnimation';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

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
      
      const payload: EvaluatorInput = {
        sessionId: 'onboarding-' + Date.now(),
        attentionType: 'onboarding',
        motorResult: state.motorResult,
        inhibitoryResult: state.inhibitoryResult,
        flexibleResult: state.flexibleResult,
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
      <EvaluationLoadingAnimation 
        label="Avaliando seu perfil cognitivo..." 
        isLongAnalysis={false}
      />
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

  // Prepara dados para o RadarChart
  const radarData = [
    { subject: 'Agilidade Mental', A: report.dados_grafico_teia['Agilidade Mental'] || 0, fullMark: 100 },
    { subject: 'Foco Contínuo', A: report.dados_grafico_teia['Foco Contínuo'] || 0, fullMark: 100 },
    { subject: 'Controle e Calma', A: report.dados_grafico_teia['Controle e Calma'] || 0, fullMark: 100 },
    { subject: 'Organização Visual', A: report.dados_grafico_teia['Organização Visual'] || 0, fullMark: 100 },
  ];

  const { mensagem_ux } = report;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', maxWidth: '600px', paddingBottom: 'var(--space-8)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>
        {mensagem_ux.titulo}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        {mensagem_ux.paragrafo_boas_vindas}
      </p>

      {/* Gráfico de Teia */}
      <div style={{ 
        width: '100%', 
        height: 300, 
        background: 'var(--color-surface)', 
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-6)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="var(--color-border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Habilidades" dataKey="A" stroke="var(--color-selective)" fill="var(--color-selective)" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

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
  );
};
