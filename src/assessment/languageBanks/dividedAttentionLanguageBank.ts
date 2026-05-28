// src/assessment/languageBanks/dividedAttentionLanguageBank.ts
// Banco de linguagem para avaliação de Atenção Dividida

export const dividedAttentionLanguageBank = {
  definicao:
    "Capacidade de processar múltiplas fontes de informação simultaneamente (ex.: buscar símbolo enquanto monitora som).",

  termosternicos: [
    "Sobrecarga cognitiva",
    "Custo de dupla tarefa",
    "Quebra de organização visuoespacial",
    "Capacidade cognitiva de reserva",
    "Interferência de modalidade cruzada",
    "Efeito de gargalo estrutural",
    "Estratégia de priorização / segurança em primeiro lugar",
  ],

  padroesDeerro: {
    priorizacaoForcada:
      "O usuário foca apenas no áudio e ignora a tela, ou vice-versa.",
    buscaCaotica:
      "Ao tentar fazer as duas coisas, o rastreio visual entra em colapso e o jogador começa a clicar de forma desorganizada e aleatória.",
    cobertorCurto:
      "Mantém precisão nas duas tarefas, mas sacrifica drasticamente a velocidade.",
    tunelingIntermodal:
      "Com dificuldade alta, acerta alvos na tela perfeitamente mas perde 100% dos estímulos auditivos.",
    fadigaDeMultiplosAlvos:
      "Índice de acerto começa excelente, mas cai vertiginosamente após alguns minutos pela exaustão dos recursos executivos.",
  },

  severidade: {
    minimo:
      "Consegue equilibrar os pratos perfeitamente, dividindo o foco com tranquilidade.",
    leve:
      "Um dos focos exigiu um pouco mais de atenção que o outro, mas você conseguiu manter a tarefa sob controle.",
    moderado:
      "A exigência de fazer duas coisas ao mesmo tempo gerou sobrecarga, o que desorganizou a estratégia de busca.",
    importante:
      "A exigência de prestar atenção nas duas coisas esgotou a reserva de atenção, criando um gargalo que forçou o cérebro a priorizar uma das tarefas.",
  },

  frasesDeInterpretacao: [
    "Fazer duas coisas ao mesmo tempo é o maior dos desafios, e você conseguiu manter um ótimo equilíbrio!",
    "O desafio de olhar e ouvir simultaneamente gerou um pequeno congestionamento na sua atenção.",
    "Sua 'Visão de Radar' ficou um pouco instável ao tentar dar conta de dois objetivos de uma vez.",
    "Ouvir a instrução enquanto explorava a tela consumiu quase toda a sua bateria atencional, o que aumentou o seu tempo de resposta.",
    "Quando o desafio ficou muito alto, você tomou uma decisão estratégica inconsciente: focou 100% na visão para garantir os acertos e ignorou os sons temporariamente.",
    "O seu cérebro evitou a sobrecarga aplicando um freio de segurança, garantindo a qualidade da dupla tarefa através de uma execução mais cuidadosa e lenta.",
    "Houve um pequeno gargalo no processamento: a necessidade de fazer as duas coisas ao mesmo tempo desorganizou temporariamente a sua estratégia de radar.",
  ],

  indicadoresPositivos: [
    "Bom gerenciamento multitarefa",
    "Equilíbrio de foco",
    "Visão de radar organizada mesmo sob pressão",
    "Reserva cognitiva robusta",
    "Alocação simultânea eficiente",
    "Baixo custo de dupla tarefa",
    "Coordenação entre canais sensoriais madura",
  ],

  sinaisDeAlerta: {
    paralisiaDeGargalo:
      "Tenta fazer as duas coisas e entra em colapso motor — tempo de reação absurdamente longo ou congelamento sem reagir a nenhum estímulo.",
    negligenciaAbsoluta:
      "Desliga completamente um dos canais sensoriais do início ao fim, sugerindo incapacidade de dividir o foco fora da via sensorial dominante.",
    colapsoDeEstrategia:
      "Índice de organização cai para níveis caóticos críticos ao introduzir o segundo estímulo, indicando falha no planejamento executivo sob estresse da dupla tarefa.",
  },
} as const;
