/* src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchAssessment.config.ts */

import type { VisualSearchAssessmentConfig } from './visualSearchAssessment.types';

export const visualSearchAssessmentConfig: VisualSearchAssessmentConfig = {
  version: 1,
  questionTitle: 'O paciente tem dificuldade em filtrar distratores?',
  thresholds: {
    commissionBiasRatio: 1.5,
    omissionBiasRatio: 1.5,
    mildRate: 0.1,
    moderateRate: 0.25,
    highRate: 0.4,
  },
};