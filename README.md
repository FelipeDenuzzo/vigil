<!-- VIGIL — README -->
<div align="center">

# 🧠 Vigil

**Programa digital de treino e avaliação cognitiva focado em atenção.**  
Exercícios modulares de atenção seletiva, sustentada, alternada e dividida — com geração automatizada de laudos neuropsicológicos via IA.

[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vigil.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Rodando Localmente](#rodando-localmente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Avaliação Neuropsicológica](#avaliação-neuropsicológica)
- [Contribuindo](#contribuindo)
- [Segurança](#segurança)
- [Licença](#licença)

---

## Sobre o Projeto

O **Vigil** é uma plataforma web de treino cognitivo e avaliação neuropsicológica assistida por IA. Cada jogo foi desenhado com base em paradigmas validados pela literatura científica (Teste d2, T.O.V.A., TAP, CPT, SART), capturando métricas como tempo de reação (RT), variabilidade do RT (SDRT), índice d' e padrões de erro por fase.

O backend de avaliação usa o **Google Gemini** para gerar laudos técnicos automatizados, calibrados com tabelas de referência de adultos saudáveis da literatura.

---

## Funcionalidades

| Módulo | Tipo de Atenção | Status |
|---|---|---|
| Achar o Faltando | Seletiva | ✅ Ativo |
| Atenção Sustentada | Sustentada | 🚧 Em desenvolvimento |
| Atenção Alternada | Alternada | 🚧 Em desenvolvimento |
| Atenção Dividida | Dividida | 🚧 Em desenvolvimento |

**Avaliação por fase:** cada sessão gera métricas por fase (RT médio, SDRT, d', omissões vs. comissões, Post-error Slowing) e um laudo com 4 flags clínicas: Impulsividade, Lentificação Cognitiva, Switch Cost e Fadiga Atencional.

---

## Stack Tecnológica

- **Frontend:** React 18 + TypeScript + Vite
- **Roteamento:** React Router v6
- **Backend / BaaS:** Firebase (Auth, Firestore, Storage)
- **IA / Laudo:** Google Gemini via `vigil-evaluator` (Cloud Function)
- **Deploy:** Vercel
- **Testes:** Vitest

---

## Pré-requisitos

- Node.js ≥ 18
- npm ≥ 9
- Conta Firebase (projeto criado)
- Chave de API do Google Gemini

---

## Instalação

```bash
git clone https://github.com/FelipeDenuzzo/vigil.git
cd vigil
npm install
```

---

## Configuração de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

As variáveis necessárias estão documentadas em [`.env.example`](.env.example).

> ⚠️ **Nunca comite o arquivo `.env`**. Ele está listado no `.gitignore`.

---

## Rodando Localmente

```bash
npm run dev
```

Acesse `http://localhost:5173`.

```bash
# Testes
npm run test

# Build de produção
npm run build
```

---

## Estrutura do Projeto

```
vigil/
├── src/
│   ├── attentions/          # Módulos de jogos por tipo de atenção
│   │   └── selective/
│   │       └── games/
│   │           └── AcharOFaltando/
│   ├── assessment/          # Pipeline de avaliação neuropsicológica
│   │   └── acharOFaltando/
│   ├── lib/                 # Firebase, Gemini client, utilitários
│   └── shared/              # Storage de sessão, componentes compartilhados
├── vigil-evaluator/         # Cloud Function — proxy Gemini
├── .github/
│   ├── workflows/           # CI/CD
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── ARCHITECTURE.md          # Decisões de arquitetura detalhadas
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── SECURITY.md
```

Para a arquitetura detalhada, consulte [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Avaliação Neuropsicológica

O pipeline de avaliação segue o fluxo:

```
Rounds capturados → adaptSession → calculateMetrics → buildScaleResult → buildTechnicalReport → Gemini → Laudo
```

As métricas são calculadas **fase a fase** (10 fases, 20s cada), comparadas com tabelas de referência baseadas no Teste d2, TAP e paradigmas de Task-Switching. Veja a especificação completa em [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Contribuindo

Contribuições são muito bem-vindas! Leia o [CONTRIBUTING.md](CONTRIBUTING.md) para o guia completo.

---

## Segurança

Para reportar vulnerabilidades, leia [SECURITY.md](SECURITY.md).

---

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.
