// src/assessment/mentalVault/types.ts

import { CondicaoRodada } from '../../attentions/divided/games/MentalVault/types';

export interface MentalVaultRoundMetrics {
  sequenciaAlvo: string[];
  sequenciaDigitada: string[];
  condicaoRodada: CondicaoRodada;
  absoluteRecall: number;          // Proporção de letras corretas na posição exata (0 a 1)
  digitAccuracy: number;           // Acertos / total de dígitos apresentados (0 a 1)
  digitCommissionErrors: number;   // Total de erros de comissão
  digitOmissions: number;          // Total de omissões
  digitMeanRtMs: number;           // Média do tempo de reação apenas das respostas válidas (não omitidas)
  digitPrecisionRate: number;      // Acertos / (total de dígitos apresentados + erros de comissão)
  digitIes: number;                // Tempo médio de reação / taxa de precisão (Digit_IES)
}

export interface MentalVaultSessionMetrics {
  totalRodadas: number;
  rodadasPuras: number;
  rodadasMistas: number;
  nivelMaximo: number;
  
  // Médias globais de recall e custo TBRS
  avgAbsoluteRecall: number;       // Média geral do recall absoluto
  avgAbsoluteRecallPuras: number;  // Média do recall absoluto nas rodadas puras
  avgAbsoluteRecallMistas: number; // Média do recall absoluto nas rodadas mistas
  tbrsCost: number;                // Custo TBRS: média puras - média mistas

  // Métricas acumuladas e médias de processamento de dígitos
  avgDigitAccuracy: number;        // Média geral da acurácia de dígitos
  totalCommissionErrors: number;   // Total de erros de comissão acumulados
  totalOmissions: number;          // Total de omissões acumuladas
  avgDigitMeanRtMs: number;        // Média do tempo de reação (respostas válidas)
  avgDigitIes: number;             // Média do IES de dígitos
  
  // Lista com as métricas calculadas de cada rodada
  rodadas: MentalVaultRoundMetrics[];
}

export interface MentalVaultTechnicalReport {
  sessionId: string;
  startedAt: string;
  attentionType: 'dividida';
  game: 'cofre-mental';
  metrics: MentalVaultSessionMetrics;
}
