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
        } else {
          console.warn('API de avaliação retornou nulo. Usando fallback local.');
          setReport(generateLocalFallbackReport(payload));
        }
      } catch (err) {
        console.warn('Erro ao avaliar onboarding, usando fallback local:', err);
        setReport(generateLocalFallbackReport(payload));
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

  // Fallback caso a IA falhe completamente e não tenha fallback (já prevenido pelo local fallback)
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

// ── Fallback local caso a chamada do back-end retorne nulo ──────────────────────
function generateLocalFallbackReport(payload: any): OnboardingReport {
  let agilidadeMental = 100;
  const rt = payload.exercicio_1_calibragem?.tempo_de_reacao_medio_ms ?? 500;
  if (rt === 0) agilidadeMental = 0;
  else if (rt <= 250) agilidadeMental = 100;
  else if (rt <= 400) agilidadeMental = 100 - ((rt - 250) / 150) * 20;
  else if (rt <= 600) agilidadeMental = 80 - ((rt - 400) / 200) * 30;
  else agilidadeMental = Math.max(0, 50 - ((rt - 600) / 400) * 50);

  const omissoesAlerta = payload.exercicio_1_calibragem?.omissoes_alerta ?? 0;
  if (omissoesAlerta > 0) {
    agilidadeMental = Math.max(0, agilidadeMental - (omissoesAlerta * 10));
  }

  const omissoesGoNoGo = payload.exercicio_2_gonogo?.erros_omissao ?? 0;
  const totalOmissoes = omissoesAlerta + omissoesGoNoGo;
  const focoContinuo = Math.max(0, 100 - (totalOmissoes * 10));

  const comissoes = payload.exercicio_2_gonogo?.erros_comissao_impulsividade ?? 0;
  const controleCalma = Math.max(0, 100 - (comissoes * 10));

  let flexibilidadeMental = 100;
  const flexCost = payload.exercicio_3_alternancia?.custo_de_alternancia_segundos ?? 15;
  if (flexCost <= 5) flexibilidadeMental = 100 - (flexCost / 5) * 10;
  else if (flexCost <= 15) flexibilidadeMental = 90 - ((flexCost - 5) / 10) * 40;
  else flexibilidadeMental = Math.max(0, 50 - ((flexCost - 15) / 15) * 50);

  let focoMultitarefa = 100;
  const dtc = payload.exercicio_4_dupla_tarefa?.custo_de_dupla_tarefa_porcento ?? 20;
  if (dtc <= 5) focoMultitarefa = 100 - (dtc / 5) * 10;
  else if (dtc <= 30) focoMultitarefa = 90 - ((dtc - 5) / 25) * 40;
  else focoMultitarefa = Math.max(0, 50 - ((dtc - 30) / 70) * 50);

  const finalScores = {
    "Agilidade Mental": Math.round(agilidadeMental),
    "Foco Contínuo": Math.round(focoContinuo),
    "Controle e Calma": Math.round(controleCalma),
    "Flexibilidade Mental": Math.round(flexibilidadeMental),
    "Foco Multitarefa": Math.round(focoMultitarefa),
  };

  const entries = Object.entries(finalScores);
  entries.sort((a, b) => b[1] - a[1]);
  const highest = entries[0][0];
  const lowest = entries[entries.length - 1][0];

  const superpoderes: Record<string, string> = {
    "Agilidade Mental": "Notamos que a Agilidade Mental é o seu superpoder! Você tem ótimos reflexos e processa estímulos visuais muito rapidamente.",
    "Foco Contínuo": "Notamos que o Foco Contínuo é o seu superpoder! Você consegue manter a concentração por longos períodos sem se distrair.",
    "Controle e Calma": "Notamos que o Controle e Calma é o seu superpoder! Você possui excelente controle de impulsos e age de forma pensada.",
    "Flexibilidade Mental": "Notamos que a Flexibilidade Mental é o seu superpoder! Você consegue alternar entre diferentes tarefas de forma muito ágil.",
    "Foco Multitarefa": "Notamos que o Foco Multitarefa é o seu superpoder! Você lida com estímulos simultâneos sem perder a eficácia.",
  };

  const focos: Record<string, string> = {
    "Agilidade Mental": "Nas próximas semanas, nosso treino será focado em exercitar sua Agilidade Mental para refinar seus reflexos.",
    "Foco Contínuo": "Nas próximas semanas, nosso treino será focado em fortalecer seu Foco Contínuo, ajudando a evitar distrações no dia a dia.",
    "Controle e Calma": "Nas próximas semanas, nosso treino será focado em calibrar seu Controle e Calma para tomar decisões com mais segurança.",
    "Flexibilidade Mental": "Nas próximas semanas, nosso treino será focado em aprimorar sua Flexibilidade Mental para você trocar de tarefas sem esforço.",
    "Foco Multitarefa": "Nas próximas semanas, nosso treino será focado em expandir seu Foco Multitarefa, melhorando seu rendimento sob divisão de atenção.",
  };

  return {
    mensagem_ux: {
      titulo: "Seu Perfil de Foco",
      paragrafo_boas_vindas: "Análise concluída com sucesso! Veja a distribuição das suas habilidades cognitivas no gráfico abaixo.",
      superpoder: superpoderes[highest] || superpoderes["Agilidade Mental"],
      foco_de_treino: focos[lowest] || focos["Foco Contínuo"],
    },
    dados_grafico_teia: finalScores,
  };
}
