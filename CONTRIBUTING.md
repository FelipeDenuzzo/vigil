# Guia de Contribuição — Vigil

Obrigado pelo interesse em contribuir com o Vigil! 🎉  
Este guia cobre tudo o que você precisa saber para colaborar de forma eficiente.

---

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Reportar Bugs](#como-reportar-bugs)
- [Como Sugerir Funcionalidades](#como-sugerir-funcionalidades)
- [Configurando o Ambiente](#configurando-o-ambiente)
- [Fluxo de Trabalho Git](#fluxo-de-trabalho-git)
- [Convenções de Código](#convenções-de-código)
- [Convenções de Commit](#convenções-de-commit)
- [Pull Requests](#pull-requests)
- [Testes](#testes)

---

## Código de Conduta

Este projeto adota o [Contributor Covenant](CODE_OF_CONDUCT.md). Ao participar, você concorda em respeitar o código.

---

## Como Reportar Bugs

1. Verifique se o bug já foi reportado nas [Issues](https://github.com/FelipeDenuzzo/vigil/issues)
2. Abra uma nova issue usando o template **Bug Report**
3. Inclua:
   - Passos para reproduzir
   - Comportamento esperado vs. atual
   - Screenshots se aplicável
   - Ambiente (OS, browser, versão do Node)

---

## Como Sugerir Funcionalidades

1. Abra uma issue usando o template **Feature Request**
2. Descreva o problema que a feature resolve
3. Proponha a solução e alternativas consideradas
4. Aguarde discussão antes de iniciar a implementação

---

## Configurando o Ambiente

```bash
git clone https://github.com/FelipeDenuzzo/vigil.git
cd vigil
npm install
cp .env.example .env
# Preencha .env com suas credenciais Firebase e Gemini
npm run dev
```

---

## Fluxo de Trabalho Git

```
main          ← branch estável, deploy automático na Vercel
  └── feat/nome-da-feature   ← sua branch de trabalho
  └── fix/nome-do-bug
  └── docs/o-que-muda
  └── refactor/escopo
```

1. **Fork** o repositório (para contribuidores externos)
2. Crie sua branch a partir de `main`:
   ```bash
   git checkout -b feat/minha-feature
   ```
3. Faça commits pequenos e descritivos (ver [Convenções de Commit](#convenções-de-commit))
4. Abra um Pull Request para `main`

---

## Convenções de Código

- **TypeScript estrito** — sem `any` explícito sem justificativa
- **Componentes React** em PascalCase; hooks com prefixo `use`
- **Arquivos de assessment** seguem o padrão: `calculate*`, `build*`, `adapt*`
- **Lógica pura** separada da UI — nada de lógica de negócio dentro de `.tsx`
- Sempre que adicionar uma nova fase ou métrica, **atualizar os tipos em `types.ts` primeiro**

---

## Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     nova funcionalidade
fix:      correção de bug
docs:     alteração apenas em documentação
refactor: refatoração sem mudança de comportamento
test:     adição ou correção de testes
chore:    atualização de deps, configs, CI
perf:     melhoria de performance
```

Exemplos:
```
feat(assessment): add SDRT calculation per phase
fix(AcharOFaltando): correct phase 10 replacement pool
docs: update CONTRIBUTING with commit conventions
```

---

## Pull Requests

- Título no formato Conventional Commits
- Preencha **todo** o template do PR (sem deletar seções)
- Adicione screenshots para mudanças visuais
- PRs sem testes para lógica nova podem ser recusados
- Aguarde pelo menos 1 review antes do merge

---

## Testes

```bash
npm run test          # roda todos os testes
npm run test -- --watch  # modo watch
```

- Testes ficam em `tests/`
- Para funções de assessment (`calculate*`, `build*`), testes unitários são **obrigatórios**
- Cubra os casos extremos: sessão vazia, 100% omissões, RT = 0
