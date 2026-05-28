// src/assessment/languageBanks/alternatingAttentionLanguageBank.ts
// Banco de linguagem para avaliação de Atenção Alternada

export const alternatingAttentionLanguageBank = {
  definicao:
    "Flexibilidade cognitiva para mudar o foco entre tarefas com demandas diferentes.",

  termosternicos: [
    "Custo de mudança (switch cost)",
    "Perseveração de regra",
    "Rigidez cognitiva",
    "Custo de mistura (mixing cost)",
    "Inércia do set de tarefas",
    "Efeito de bivalência",
    "Mudança perceptual vs. baseada em regras",
  ],

  padroesDeerro: {
    perseveracao:
      "O jogo muda a regra, mas o usuário continua respondendo conforme a regra anterior.",
    custoDeTrocaAlto:
      "Acerta a nova regra, mas fica excessivamente lento logo após a transição.",
    ansiedadeDeTroca:
      "Fica lento em todo o bloco apenas por saber que a instrução pode variar a qualquer momento.",
    paralisacaoAmbigua:
      "Diante de alvo com duplo sentido, gera lentidão extrema que persiste mesmo após o alvo passar.",
    inerciaDeRetorno:
      "Troca facilmente de A para B, mas ao retornar de B para A a inércia da tarefa secundária impede a recuperação.",
  },

  severidade: {
    minimo:
      "Muda de direção mental facilmente, adaptando-se rápido às novas regras do jogo.",
    leve:
      "Uma breve hesitação ao trocar de regra, mas logo engata no novo ritmo.",
    moderado:
      "Ficou um pouco preso à regra anterior, com dificuldade para virar a chave da atenção rapidamente.",
    importante:
      "A exigência de virar a chave entre tarefas consumiu bastante energia, fazendo o cérebro levar vários segundos a mais para desapegar da regra antiga.",
  },

  frasesDeInterpretacao: [
    "Você demonstrou grande agilidade mental e flexibilidade ao trocar de tarefa.",
    "A mudança de regra exigiu um tempo extra de processamento, o que é normal e um ótimo ponto para treinarmos.",
    "Percebemos que o seu cérebro tentou usar a instrução antiga mesmo na fase nova.",
    "Você demonstrou excelente flexibilidade: conseguiu arquivar a regra antiga e adotar a nova em frações de segundo.",
    "Saber que o alvo podia mudar a qualquer instante ativou o seu radar de cautela, o que diminuiu sua velocidade, mas protegeu a sua precisão.",
    "Notamos que, diante de alvos que podiam ter duplo sentido, o seu tempo de decisão aumentou significativamente.",
    "O esforço constante de manter duas regras vivas na memória causou uma inércia que diminuiu seu ritmo de jogo.",
  ],

  indicadoresPositivos: [
    "Mente flexível",
    "Adaptação rápida",
    "Agilidade na virada de chave",
    "Recuperação veloz após troca",
    "Baixo custo de transição",
    "Excelente monitoramento de contexto",
    "Resistência à inércia",
    "Reconfiguração mental imediata",
  ],

  sinaisDeAlerta: {
    perseveracaoExtrema:
      "Fica preso na mesma regra errada repetidas vezes sem conseguir se corrigir, mesmo com feedback do jogo.",
    colapsoDeMemoria:
      "Esquece completamente os comandos e passa a clicar de forma randômica ou desiste — memória de trabalho insuficiente para manter duas instruções simultaneamente.",
    contaminacaoDeLentidao:
      "Após erro em troca difícil, adota ritmo absurdamente lento para todas as respostas subsequentes — sistema executivo incapaz de recuperar a fluidez.",
  },
} as const;
