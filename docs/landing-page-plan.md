# Integração da Landing Page no VIGIL

O objetivo deste plano é detalhar os passos necessários para transformar o HTML estático fornecido em uma página inicial (Landing Page) totalmente integrada ao aplicativo React/Vite atual do VIGIL. 

O plano foi elaborado para ser executado no futuro, garantindo que todo o código fornecido (HTML, CSS e imagens) seja reaproveitado seguindo as melhores práticas do ecossistema React.

## Questões a definir antes de implementar:

1. **Roteamento:** A landing page deve ser a rota principal (`/`) e o aplicativo atual deve ser movido para `/app` ou `/treinos`? Ou a landing page terá uma rota específica (ex: `/sobre`)?
2. **Autenticação:** O botão "Começar agora" deve direcionar o usuário para a tela de Login/Cadastro ou direto para o catálogo de jogos?
3. **Imagens:** As imagens (`logo-cerebro.jpg`, `estress-1.jpg`, etc.) precisarão ser adicionadas à pasta `public` do projeto quando formos executar.

## Alterações Propostas

Abaixo estão as etapas que seguiremos para implementar o site quando você decidir prosseguir.

---

### 1. Gestão de Assets (Imagens)

As imagens citadas no arquivo HTML precisarão ser disponibilizadas publicamente pelo Vite.

- `public/images/landing/logo-cerebro.jpg`
- `public/images/landing/estress-1.jpg`
- `public/images/landing/estress-2.jpg`
- `public/images/landing/atencao-sustentada.jpg`
- `public/images/landing/atencao-seletiva.jpg`
- `public/images/landing/atencao-alternada.jpg`
- `public/images/landing/atencao-dividida.jpg`

---

### 2. Criação do Componente React

O HTML puro será convertido para um componente funcional do React (JSX). Atributos como `class` serão renomeados para `className`, e tags não fechadas adequadamente (como `<img ...>`) serão ajustadas.

**`src/pages/LandingPage/LandingPage.tsx`**
- Componente que abrigará as tags `<main>` e `<section>` do HTML fornecido.
- O botão "Começar agora" usará o componente `<Link>` do `react-router-dom` para navegação suave (SPA) em vez de um link tradicional (`<a href>`).

**`src/pages/LandingPage/LandingPage.css`**
- Extrairemos todo o conteúdo da tag `<style>` do seu arquivo `index.html` para este arquivo CSS.
- O CSS manterá as variáveis (como `--purple-soft` e `--gradient`) para garantir que a estética "Neon/Dark" se mantenha perfeitamente isolada na landing page sem conflitar com o resto do aplicativo.

---

### 3. Integração de Rotas (React Router)

Precisaremos modificar as rotas do aplicativo para exibir a nova Landing Page antes do usuário entrar na plataforma.

**`src/App.tsx` (ou arquivo de rotas principal)**
- Adição da rota da Landing Page (possivelmente em `/`).
- Ajuste das rotas existentes (Dashboard, Auth, etc.) caso o componente principal atual esteja na rota `/`.

## Plano de Verificação

Quando a implementação for executada, validaremos o sucesso através dos seguintes testes:

1. **Visualização:** Acessar a raiz do projeto no navegador e verificar se o visual está idêntico ao HTML/CSS original.
2. **Carregamento de Imagens:** Confirmar que os JPGs de background e ícones estão renderizando corretamente e que o `mix-blend-mode: screen` está funcionando.
3. **Responsividade:** Testar a quebra do grid (Grid-2, Grid-3, Grid-4) em resoluções móveis (abaixo de 880px) simuladas no navegador.
4. **Navegação (Botão Principal):** Clicar em "Começar agora" e confirmar o redirecionamento adequado para o fluxo de cadastro/login do VIGIL.

---
**Código HTML Original Referência:** (Está armazenado no histórico da Inteligência Artificial quando a implementação for iniciada)
