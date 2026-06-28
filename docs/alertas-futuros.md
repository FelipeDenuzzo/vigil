# Alertas e Observações Técnicas para o Futuro

Este documento centraliza comportamentos inesperados, possíveis falhas de UX e pontos de atenção técnica que não exigem correção imediata, mas devem ser monitorados caso haja volume de reclamações dos usuários ou para futuras manutenções da plataforma.

---

## 1. Bloqueio de Conexão do Firestore por AdBlockers
**Erro no Console:** `net::ERR_BLOCKED_BY_CLIENT` em chamadas para `firestore.googleapis.com/.../Listen/channel`

### O que acontece?
Extensões de navegador agressivas (como uBlock Origin, Privacy Badger, Ghostery) ou navegadores com proteção rígida nativa (como o Brave) podem classificar o Firebase/Firestore como uma ferramenta de rastreamento do Google e bloquear a comunicação de rede.

### Impacto na UX (Experiência do Usuário)
- **Bloqueio Parcial (apenas Listen/Realtime):** Os dados são salvos com sucesso via requisições comuns, mas a tela não atualiza dados ao vivo sem que o usuário recarregue a página (F5).
- **Bloqueio Total:** O histórico de treinos falha ao ser enviado para a nuvem. O usuário pode concluir o treino e não ver o resultado salvo. A tela de histórico também pode ficar travada em um *loading* infinito.

### O que observar no futuro?
Monitore os chamados de suporte técnico. Intervenha se usuários relatarem:
- *"Eu faço os treinos, mas os resultados desaparecem."*
- *"A tela de histórico fica carregando para sempre e não abre."*

**Resolução via Suporte:** Instruir o paciente/usuário a desativar os bloqueadores de anúncio ou as "blindagens" do navegador (Brave) para o domínio oficial do VIGIL. 

---

## 2. Inserção Manual de Novos Treinos nos Hubs (Menus)

### O que acontece?
O sistema VIGIL exige que cada jogo seja explicitamente registrado nos menus (Hubs) de suas respectivas áreas de atenção. Criar os arquivos de um jogo não o faz aparecer na interface. (Exemplo recente ocorrido: O treino *Sala de Vigília* estava programado, mas invisível).

### O que observar no futuro?
Ao desenvolver novos treinos, garantir que a última etapa do desenvolvimento seja plugar o jogo no menu correto:
1. Importar o componente no Hub correspondente (ex: `SustainedHub.tsx`, `AlternatingHub.tsx`).
2. Adicionar a string do jogo no tipo `ActiveGame`.
3. Criar o `<Card>` visual no grid de seleção.
4. Adicionar a condicional de renderização (`{activeGame === 'novo-jogo' && ...}`).
