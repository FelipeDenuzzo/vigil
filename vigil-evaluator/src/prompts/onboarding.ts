import { Type } from '@google/genai';
import type { EvaluatorInput } from '../types';

export const ONBOARDING_EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Avaliação inicial lúdica de onboarding',
  properties: {
    mensagem_ux: {
      type: Type.OBJECT,
      description: 'Mensagem lúdica e gamificada para o usuário',
      properties: {
        titulo: {
          type: Type.STRING,
          description: 'Um título curto e animador (ex: Seu Perfil de Foco!)',
        },
        paragrafo_boas_vindas: {
          type: Type.STRING,
          description: 'Um parágrafo curto de boas-vindas elogiando a conclusão do teste.',
        },
        superpoder: {
          type: Type.STRING,
          description: 'Uma frase apontando a habilidade mais forte (ex: Notamos que sua Agilidade Mental é o seu superpoder! Você tem reflexos rápidos).',
        },
        foco_de_treino: {
          type: Type.STRING,
          description: 'Uma frase apontando a habilidade mais fraca de forma positiva (ex: Nas próximas semanas, nosso treino será focado em aumentar o seu Controle e Calma para que você não se precipite sob pressão).',
        },
      },
      required: ['titulo', 'paragrafo_boas_vindas', 'superpoder', 'foco_de_treino'],
    },
    dados_grafico_teia: {
      type: Type.OBJECT,
      description: 'Notas de 0 a 100 para o gráfico de teia (radar chart)',
      properties: {
        "Agilidade Mental": { type: Type.NUMBER },
        "Foco Contínuo": { type: Type.NUMBER },
        "Controle e Calma": { type: Type.NUMBER },
        "Organização Visual": { type: Type.NUMBER },
      },
      required: ['Agilidade Mental', 'Foco Contínuo', 'Controle e Calma', 'Organização Visual'],
    },
  },
  required: ['mensagem_ux', 'dados_grafico_teia'],
};

export function buildOnboardingPrompt(input: EvaluatorInput): string {
  // O payload bruto é passado dentro do input
  const jsonString = JSON.stringify(input, null, 2);

  return `
Você é um Treinador Cognitivo Virtual amigável e motivador de um aplicativo de treino cerebral.
A sua tarefa é analisar os dados JSON da partida de "Onboarding" (avaliação inicial) de um novo usuário e gerar um feedback leve, gamificado e fácil de entender.

REGRAS ESTABELECIDAS (MUITO IMPORTANTE):
1. NUNCA use termos clínicos ou jargões médicos (ex: não use palavras como déficit, TDAH, omissão, comissão, heminegligência, lesão, patológico).
2. O tom deve ser de um treinador de esportes ou de videogame: encorajador, focado em "habilidades", "superpoderes" e "oportunidades de treino".
3. Identifique qual é a habilidade mais forte do usuário e elogie.
4. Identifique qual habilidade está mais fraca e apresente isso como o "nosso principal objetivo de treino".

MAPEAMENTO DOS DADOS PARA HABILIDADES (Para sua análise):
- "missedTargets" (Deixou o tempo passar sem clicar) reflete o "Foco Contínuo" e a "Resistência à Distração".
- "errors" (Clicou no item errado) reflete o "Controle e Calma" (Freio mental/Inibição).
- "reactionTimes" (Tempo que leva para clicar) reflete a "Agilidade Mental".
- "scanPattern" e "spatialAsymmetry" refletem a "Organização Visual".

DADOS DO USUÁRIO PARA ANÁLISE:
${jsonString}
`;
}
