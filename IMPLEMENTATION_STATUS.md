# Status de implementação

## Estado atual — auditoria após as novas diretrizes

Fase em andamento: **Fase 1 — Fundação**. A implementação local segue ativa; alterações de dados do Supabase ficam sujeitas a confirmação explícita.

## Implementado nesta entrega

- [x] Base Next.js/TypeScript/Tailwind preservada e reorganizada.
- [x] Visual operacional responsivo com identidade editorial para restaurante.
- [x] Tema sistema, claro e escuro com persistência local.
- [ ] Dashboard com busca, exportação CSV, feedback de ação e avanço de status: a interação atual ainda é local e precisa ser substituída por consultas/mutações Supabase antes de ser considerada concluída.
- [x] Menu desktop/mobile.
- [x] Menu reorganizado em painéis separados: Operação, Cardápio e loja, Relacionamento e Gestão.
- [x] Rotas independentes do painel da empresa: pedidos, cardápio, entregadores, clientes, relatórios e configurações.
- [x] Quadro de pedidos em cards por etapa com busca, avanço local de status e exportação CSV.
- [x] Cards de produtos com filtro e alternância de disponibilidade local.
- [x] Pipeline CSS do servidor local corrigido; o cache `.next` não é compartilhado entre `next dev` e `next build`.
- [x] Migration SQL multiempresa versionada com RLS e índices.
- [x] README e variáveis de ambiente documentados.

## Ajustes obrigatórios identificados na fase atual

- [ ] Remover `lib/demo.ts` e o seed local do dashboard; criar leitura real de pedidos por empresa através do Supabase, com estado vazio explícito quando não houver dados.
- [ ] Substituir o botão “Novo pedido” e o avanço local de status por mutações server-side/RPC, com validação de transições e histórico de status.
- [ ] Adicionar autenticação de equipe, sessão e seleção segura de `company_id`; o dashboard não pode operar como tela pública em produção.
- [ ] Criar a base de autenticação do cliente com OTP por telefone/WhatsApp e fallback funcional por OTP/Magic Link de e-mail via Supabase Auth.
- [ ] Criar upload client-side com Canvas/WebP, validação de tipo/tamanho e envio ao bucket Storage por empresa.
- [ ] Adicionar testes de isolamento RLS e de regras de pedido antes de marcar a Fase 1 como concluída.

## Testado

- [x] `pnpm install`.
- [x] `pnpm typecheck` / `npx tsc --noEmit`.
- [x] `pnpm lint`.
- [x] `pnpm build` com Node.js 24.22.3 do runtime compatível.
- [x] Asset CSS validado no servidor local: `/_next/static/css/app/layout.css` retornando HTTP 200.
- [x] Rotas locais `/` e `/login` validadas com HTTP 200.
- [ ] Fluxos com Supabase real.

## Validação remota

- [x] Projeto `delivery-manager` encontrado e ativo no Supabase.
- [x] Migration inicial aplicada no projeto remoto; 20 tabelas públicas criadas com RLS ativo.
- [ ] Migration `0002_harden_rls_helpers.sql` ainda não aplicada: a execução foi recusada pela confirmação de alteração remota.

## Ainda falta

- Autenticação, onboarding e middleware de permissões.
- CRUD persistido de catálogo, clientes, entregadores e pedidos.
- RPC/Route Handler de checkout com recálculo server-side.
- Loja pública `/loja/[slug]`, WhatsApp, OTP de cliente e tempo real.
- Relatórios reais, storage de imagens e testes de isolamento/Playwright.

## Próxima fase de front-end

Construir a loja pública/cardápio do cliente, checkout responsivo e painel mobile do entregador, mantendo os dados locais até a aprovação visual e posterior sincronização com Supabase.

## Próxima tarefa, após “Continuar”

Concluir a Fase 1 começando pela sessão Supabase e leitura autenticada dos dados da empresa; somente depois remover o modo demonstração e avançar para a Fase 2.
