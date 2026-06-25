import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserBaseline, OnboardingState } from './types';
import { useAuth } from '../lib/AuthContext';
import { callOnboardingEvaluator, type OnboardingReport, type EvaluatorInput } from '../lib/evaluatorClient';
import { EvaluationLoadingAnimation } from '../shared/EvaluationLoadingAnimation';
import { OnboardingRadarIntro } from './OnboardingRadarIntro';
import { OnboardingResultTour } from './OnboardingResultTour';

interface Props {
  state: OnboardingState;
  onSave: (baseline: UserBaseline) => Promise<void>;
  saving: boolean;
  saveError: string | null;
}

// Etapas internas desta tela
type ResultStep =
  | 'loading'        // IA processando — sem botão
  | 'ready'          // IA terminou — botão "Ver meu resultado"
  | 'radar'          // teia + textos das atenções
  | 'tour';          // cards de resultado + botão final

export function OnboardingResult({ state, onSave, saving, saveError }: Props) {
  const navigate = useNavigate();
  const { refreshAccess } = useAuth();

  const [step,   setStep]   = useState<ResultStep>('loading');
  const [report, setReport] = useState<OnboardingReport | null>(null);
  const [saved,  setSaved]  = useState(false);

  // ── 1. Chama a IA — não navega, não salva ainda ─────────────────────────
  useEffect(() => {
    if (!state.baseline) return;

    async function evaluate() {
      const timeSecFlex = state.flexibleResult ? state.flexibleResult.totalTimeMs / 1000 : 60;

      const payload: EvaluatorInput = {
        sessionId: 'onboarding-' + Date.now(),
        attentionType: 'onboarding',
        exercicio_1_calibragem: {
          tempo_de_reacao_medio_ms:
            state.motorResult?.reactionTimes?.length
              ? Math.round(state.motorResult.reactionTimes.reduce((a: number, b: number) => a + b, 0) / state.motorResult.reactionTimes.length)
              : 0,
          omissoes_alerta: state.motorResult?.omissions || 0,
        },
        exercicio_2_gonogo: {
          erros_omissao: state.inhibitoryResult?.omissionErrors,
          erros_comissao_impulsividade: state.inhibitoryResult?.commissionErrors,
        },
        exercicio_3_alternancia: {
          tempo_tarefa_simples_segundos: Math.round(timeSecFlex * 0.4),
          tempo_tarefa_alternada_segundos: Math.round(timeSecFlex),
          custo_de_alternancia_segundos: Math.round(timeSecFlex),
        },
        exercicio_4_dupla_tarefa: {
          precisao_apenas_bolhas_porcento: Math.round((state.dividedResult?.precisionBubblesOnly || 0) * 100),
          precisao_bolhas_e_audio_simultaneos_porcento: Math.round((state.dividedResult?.precisionDualTask || 0) * 100),
          custo_de_dupla_tarefa_porcento: Math.round((state.dividedResult?.dualTaskCost || 0) * 100),
        },
      };

      try {
        const result = await callOnboardingEvaluator(payload);
        setReport(
          result?.mensagem_ux && result?.dados_grafico_teia
            ? result
            : generateLocalFallbackReport(payload)
        );
      } catch {
        setReport(generateLocalFallbackReport(payload));
      }

      // IA terminou — libera o botão, mas NÃO navega, NÃO salva ainda
      setStep('ready');
    }

    evaluate();
  }, []); // roda uma única vez

  // ── 2. Salva silenciosamente quando UX avança para 'tour' ───────────────
  useEffect(() => {
    if (step !== 'tour' || saved || !state.baseline) return;
    onSave(state.baseline)
      .then(() => setSaved(true))
      .catch(() => {});
  }, [step]);

  // ── 3. Botão final — navega só por ação do usuário ──────────────────────
  async function handleStart() {
    await refreshAccess(); // atualiza onboardingCompleted no contexto
    navigate('/treinar', { replace: true });
  }

  // ── Renders por etapa ────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        width: '100%',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <EvaluationLoadingAnimation />
        </div>
      </div>
    );
  }

  if (step === 'ready') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', gap: 'var(--space-6)',
        padding: 'var(--space-8)', textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)',
          textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Mapeamento concluído
        </p>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>
          Seu perfil cognitivo está pronto.
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)',
          lineHeight: 1.7, maxWidth: 360 }}>
          Analisamos seu desempenho nos quatro tipos de atenção. Veja onde você está agora.
        </p>
        <button
          onClick={() => setStep('radar')}
          style={{
            marginTop: 'var(--space-4)',
            padding: '14px 40px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: 'white',
            fontSize: 'var(--text-base)', fontWeight: 600,
            border: 'none', cursor: 'pointer',
          }}
        >
          Ver meu resultado →
        </button>
      </div>
    );
  }

  if (step === 'radar' && state.baseline) {
    return (
      <OnboardingRadarIntro
        baseline={state.baseline}
        onAdvance={() => setStep('tour')}
      />
    );
  }

  if (step === 'tour' && report) {
    return (
      <OnboardingResultTour
        report={report}
        saving={saving}
        saved={saved}
        saveError={saveError}
        onStart={handleStart}
      />
    );
  }

  // Fallback de segurança — nunca tela em branco
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      width: '100%',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <EvaluationLoadingAnimation />
      </div>
    </div>
  );
}

// ── Fallback local ────────────────────────────────────────────────────────────
function generateLocalFallbackReport(payload: any): OnboardingReport {
  const rt = payload.exercicio_1_calibragem?.tempo_de_reacao_medio_ms ?? 500;
  let agilidadeMental =
    rt <= 250 ? 100 : rt <= 400 ? 100 - ((rt - 250) / 150) * 20
    : rt <= 600 ? 80 - ((rt - 400) / 200) * 30
    : Math.max(0, 50 - ((rt - 600) / 400) * 50);
  agilidadeMental = Math.max(0, agilidadeMental - (payload.exercicio_1_calibragem?.omissoes_alerta ?? 0) * 10);

  const omissoes = (payload.exercicio_1_calibragem?.omissoes_alerta ?? 0) + (payload.exercicio_2_gonogo?.erros_omissao ?? 0);
  const focoContinuo = Math.max(0, 100 - omissoes * 10);
  const controleCalma = Math.max(0, 100 - (payload.exercicio_2_gonogo?.erros_comissao_impulsividade ?? 0) * 10);

  const flexCost = payload.exercicio_3_alternancia?.custo_de_alternancia_segundos ?? 15;
  const flexibilidadeMental =
    flexCost <= 5 ? 100 - (flexCost / 5) * 10
    : flexCost <= 15 ? 90 - ((flexCost - 5) / 10) * 40
    : Math.max(0, 50 - ((flexCost - 15) / 15) * 50);

  const dtc = payload.exercicio_4_dupla_tarefa?.custo_de_dupla_tarefa_porcento ?? 20;
  const focoMultitarefa =
    dtc <= 5 ? 100 - (dtc / 5) * 10
    : dtc <= 30 ? 90 - ((dtc - 5) / 25) * 40
    : Math.max(0, 50 - ((dtc - 30) / 70) * 50);

  const scores: Record<string, number> = {
    'Agilidade Mental': Math.round(agilidadeMental),
    'Foco Contínuo': Math.round(focoContinuo),
    'Controle e Calma': Math.round(controleCalma),
    'Flexibilidade Mental': Math.round(flexibilidadeMental),
    'Foco Multitarefa': Math.round(focoMultitarefa),
  };

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const highest = entries[0][0];
  const lowest  = entries[entries.length - 1][0];

  const superpoderes: Record<string, string> = {
    'Agilidade Mental': 'Notamos que a Agilidade Mental é o seu superpoder! Você tem ótimos reflexos e processa estímulos visuais muito rapidamente.',
    'Foco Contínuo': 'Notamos que o Foco Contínuo é o seu superpoder! Você consegue manter a concentração por longos períodos sem se distrair.',
    'Controle e Calma': 'Notamos que o Controle e Calma é o seu superpoder! Você possui excelente controle de impulsos e age de forma pensada.',
    'Flexibilidade Mental': 'Notamos que a Flexibilidade Mental é o seu superpoder! Você consegue alternar entre tarefas de forma muito ágil.',
    'Foco Multitarefa': 'Notamos que o Foco Multitarefa é o seu superpoder! Você lida com estímulos simultâneos sem perder eficácia.',
  };

  const focos: Record<string, string> = {
    'Agilidade Mental': 'Nosso treino será focado em exercitar sua Agilidade Mental para refinar seus reflexos.',
    'Foco Contínuo': 'Nosso treino será focado em fortalecer seu Foco Contínuo, ajudando a evitar distrações no dia a dia.',
    'Controle e Calma': 'Nosso treino será focado em calibrar seu Controle e Calma para tomar decisões com mais segurança.',
    'Flexibilidade Mental': 'Nosso treino será focado em aprimorar sua Flexibilidade Mental para você trocar de tarefas sem esforço.',
    'Foco Multitarefa': 'Nosso treino será focado em expandir seu Foco Multitarefa, melhorando seu rendimento sob divisão de atenção.',
  };

  return {
    mensagem_ux: {
      titulo: 'Seu Perfil de Foco',
      paragrafo_boas_vindas: 'Análise concluída! Veja a distribuição das suas habilidades cognitivas.',
      superpoder: superpoderes[highest] ?? superpoderes['Agilidade Mental'],
      foco_de_treino: focos[lowest] ?? focos['Foco Contínuo'],
    },
    dados_grafico_teia: scores,
  };
}
