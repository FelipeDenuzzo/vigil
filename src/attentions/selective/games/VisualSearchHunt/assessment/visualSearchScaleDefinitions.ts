// src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchScaleDefinitions.ts
// Atualizado em: 24/05/2026 às 15:25 (BRT)

import type { VisualSearchScaleDefinition } from "./visualSearchScale.types";

export const VISUAL_SEARCH_SCALE_NAME = "Olho de Águia" as const;
export const VISUAL_SEARCH_CLINICAL_NAME =
  "Controle Inibitório e Atenção Seletiva" as const;

export const visualSearchScaleDefinitions: VisualSearchScaleDefinition[] = [
  {
    level: 1,
    id: "muito-bom-filtro",
    label: "Muito bom filtro",
    emoji: "🦅",
    colorToken: "success",
    shortDescription: "Boa discriminação entre alvo e distratores.",
    clinicalMeaning:
      "Indica atenção seletiva preservada, com boa capacidade de focar no alvo e inibir respostas impulsivas."
  },
  {
    level: 2,
    id: "leve-instabilidade",
    label: "Leve instabilidade",
    emoji: "👀",
    colorToken: "info",
    shortDescription: "Pequenas oscilações na filtragem visual.",
    clinicalMeaning:
      "Sugere atenção seletiva funcional, com momentos leves de distração ou perda pontual do foco."
  },
  {
    level: 3,
    id: "instabilidade-moderada",
    label: "Instabilidade moderada",
    emoji: "⚠️",
    colorToken: "warning",
    shortDescription: "Oscilações relevantes entre alvo e distratores.",
    clinicalMeaning:
      "Sugere dificuldade moderada para manter o filtro atencional ativo ao longo da tarefa."
  },
  {
    level: 4,
    id: "dificuldade-importante",
    label: "Dificuldade importante",
    emoji: "🚨",
    colorToken: "danger",
    shortDescription: "Quedas importantes na filtragem de estímulos.",
    clinicalMeaning:
      "Indica prejuízo relevante no controle inibitório e na seleção de estímulos visuais relevantes."
  }
];

export function getVisualSearchScaleDefinition(level: 1 | 2 | 3 | 4) {
  return visualSearchScaleDefinitions.find((item) => item.level === level)!;
}
