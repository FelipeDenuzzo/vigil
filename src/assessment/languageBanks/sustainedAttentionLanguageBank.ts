// src/assessment/languageBanks/sustainedAttentionLanguageBank.ts
// Banco de linguagem para avaliação de Atenção Sustentada

export const sustainedAttentionLanguageBank = {
  definicao:
    "Vigilância e fôlego mental necessários para manter o alerta ao longo do tempo.",

  termosternicos: [
    "Fadiga cognitiva",
    "Declínio de vigilância (efeito time-on-task)",
    "Erros de omissão (inatenção)",
    "Variabilidade do tempo de reação (SDRT)",
    "Lapsos de atenção (mind wandering)",
    "Declínio de vigilância progressivo",
    "Automatismo / desengajamento (piloto automático)",
    "Esgotamento de recursos cognitivos",
    "Declínio do índice de sensibilidade ao longo do tempo",
  ],

  padroesDeerro: {
    lapsoDeRitmo:
      "Ora clica muito rápido, ora demora muitos segundos para reagir (tempo de reação flutuante).",
    omissaoPorFadiga:
      "Deixa os alvos passarem e o tempo da rodada acaba sem encontrá-los, especialmente nas rodadas finais.",
    pilotoAutomatico:
      "Entra em ritmo motor contínuo mas começa a errar distratores raros — o corpo responde, mas a mente divagou.",
    cobertorCurtoTardio:
      "Nas rodadas finais, sacrifica drasticamente a velocidade para não errar, ou clica rápido e erroneamente só para terminar.",
    fadigaDeTransicao:
      "Queda de desempenho imediatamente após pequenas pausas, mostrando dificuldade em reaquecer os motores atencionais.",
  },

  severidade: {
    minimo:
      "Ritmo constante e fôlego mental estável da primeira à última rodada.",
    leve:
      "Pequenas oscilações no ritmo, mas com capacidade rápida de recuperar a concentração.",
    moderado:
      "A bateria mental descarregou rápido, resultando em lentidão ou perda de alvos na reta final.",
    importante:
      "A monotonia da tarefa venceu o foco. A atenção desligou em alguns momentos, fazendo o cérebro entrar no piloto automático.",
  },

  frasesDeInterpretacao: [
    "Você manteve a mesma energia e estabilidade durante quase todo o exercício.",
    "O seu ritmo de foco foi como um metrônomo: super estável!",
    "O cansaço venceu nas últimas fases, diminuindo um pouco a sua velocidade de resposta.",
    "O seu 'fôlego mental' é excelente: você processou a última rodada com a mesma qualidade e agilidade da primeira!",
    "Ao longo dos minutos, notamos que o esforço contínuo drenou um pouco da sua energia, fazendo com que alguns alvos passassem despercebidos.",
    "O desafio de manter o foco por tanto tempo fez com que a sua mente divagasse um pouco na segunda metade do treino.",
    "Quando o cansaço bateu, você tomou uma ótima decisão estratégica: reduziu um pouco o seu ritmo para garantir que continuaria acertando os alvos.",
  ],

  indicadoresPositivos: [
    "Fôlego mental resistente",
    "Ritmo de foco consistente",
    "Vigilância contínua",
    "Estabilidade de reação",
    "Alta resistência cognitiva",
    "Resistência à monotonia e ao tédio",
    "Manutenção de desempenho sob fadiga",
    "Alerta basal sustentado",
  ],

  sinaisDeAlerta: {
    abandonoPrecoce:
      "Desiste de buscar antes do tempo esgotar nas últimas fases, indicando esgotamento executivo severo.",
    colapsoAbrupto:
      "Desempenho normal nos primeiros minutos seguido de colapso quase total na segunda metade — incapacidade severa de sustentar o tônus de alerta.",
    hiperreativoMonotono:
      "Cessa a varredura visual e passa a clicar freneticamente sem critério, sugerindo forte esgotamento executivo e perda do objetivo da tarefa.",
  },
} as const;
