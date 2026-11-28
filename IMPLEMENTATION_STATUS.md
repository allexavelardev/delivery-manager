# Implementation Status

## Stack e arquitetura

- Next.js 15.5.29, App Router; React 19.3.1.
- TypeScript 5.9.3, `strict: true`.
- Tailwind CSS 4.3.5 + `@tailwindcss/postcss` 4.3.5.
- Supabase JS 2.119.2 + `@supabase/ssr` 0.6.1.
- ESLint 9.39.5 + `eslint-config-next` 15.5.29.
- Clientes Supabase separados para browser/server; middleware atualiza sessão.
- Pastas principais: `app/`, `components/`, `lib/`, `supabase/migrations/`.
- Banco PostgreSQL multiempresa: `company_id`, UUIDs, valores monetários `numeric`, snapshots de itens do pedido, histórico de status e auditoria.
- RLS habilitado nas tabelas públicas; helpers `is_company_member` e `has_company_role` existem na migration inicial.
- Chaves esperadas: `sb_publishable_...` no cliente; `sb_secret_...` somente em servidor privilegiado. Nenhuma chave secreta está no código.

## Implementado e validado

- Painel da empresa com rotas separadas: `/`, `/empresa/pedidos`, `/empresa/cardapio`, `/empresa/entregadores`, `/empresa/clientes`, `/empresa/relatorios`, `/empresa/configuracoes`.
- Loja pública `/loja/[slug]` com categorias, carrinho, entrega/retirada, pagamento e confirmação local/WhatsApp.
- Loja pública: botão “Meus pedidos” exige o WhatsApp do cliente, normaliza o número, grava-o no pedido local e exibe somente o histórico correspondente, com detalhes, total e linha de progresso. A leitura multi-dispositivo via Supabase depende do checkout server-side da próxima fase.
- Login por Magic Link/OTP de e-mail, callback PKCE e sign-out.
- Tema claro/escuro/sistema, navegação responsiva e cards de pedidos por etapa.
- Tema inicializado antes da hidratação via `app/layout.tsx`, evitando flash claro ao trocar de rota; ações de avanço e adicionar produto receberam botões com área de toque, borda, contraste e hover.
- Configurações recebeu layout responsivo com colunas protegidas por `minmax(0, ...)`, campos com foco visível e ação de salvar alinhada sem quebra.
- Arquivos principais: `app/page.tsx`, `app/empresa/**`, `app/api/empresa/pedidos/route.ts`, `app/api/empresa/pedidos/[id]/route.ts`, `app/loja/[slug]/page.tsx`, `components/public-store.tsx`, `components/orders-board.tsx`, `components/sidebar.tsx`, `middleware.ts`, `lib/supabase/**`.
- Quadro de pedidos: consulta server-side autenticada identifica a primeira associação ativa em `company_members`, filtra `orders` pelo `company_id` da sessão e não aceita empresa fornecida pelo cliente. Sem pedidos, mostra colunas vazias; modo demonstração é explícito via `NEXT_PUBLIC_LOCAL_DEMO=true`.
- Mutação de pedidos: `PATCH /api/empresa/pedidos/[id]` valida a empresa pela sessão e transições lineares (`received|confirmed -> preparing -> out_for_delivery -> delivered`), atualiza o pedido e grava histórico/auditoria; o quadro usa a rota quando não está em demonstração.
- Entregador: a transição para “Saiu para entrega” segue imediatamente, sem solicitação; nessa coluna o card exibe seleção e botão “Atribuir”. Ao concluir, o card mantém o entregador registrado em `delivery_assignments` como informação somente leitura; a API não permite nova atribuição após `delivered`.
- Migrations locais: `supabase/migrations/0001_delivery_manager.sql` e `0002_harden_rls_helpers.sql`.
- `npx tsc --noEmit`: aprovado.
- `pnpm lint`: aprovado.
- `pnpm build`: aprovado com Node.js 24.22.3.
- Correção visual validada novamente com `npx tsc --noEmit`, `pnpm lint` e `pnpm build`.
- Regra de entregador validada no build e no typecheck; a confirmação funcional com dados reais depende de haver usuário, empresa, pedido e entregador cadastrados no Supabase.
- Correção do fluxo visual de transição validada novamente com `npx tsc --noEmit`, `pnpm lint` e `pnpm build`.
- Regra de atribuição posterior validada novamente com `npx tsc --noEmit`, `pnpm lint` e `pnpm build`.
- Persistência visual do entregador após conclusão validada novamente com `npx tsc --noEmit`, `pnpm lint` e `pnpm build`.
- Histórico da loja pública validado novamente com `npx tsc --noEmit`, `pnpm lint` e `pnpm build`.
- Consulta de histórico por WhatsApp validada novamente com `npx tsc --noEmit`, `pnpm lint` e `pnpm build`.
- Rotas locais e asset CSS validados com HTTP 200.
- A rota pública `/loja/[slug]` permanece registrada como dinâmica no build; para testes locais, usar a porta do servidor atualmente iniciado, pois processos anteriores foram encerrados pelo ambiente.
- Verificação Supabase: `public.orders` acessível no projeto remoto e atualmente sem registros (`orders_count = 0`); advisor de segurança ainda aponta as funções `SECURITY DEFINER` da migration 0001 até o hardening 0002 ser aplicado.

## Ambiente, infraestrutura e versionamento

- `.env.local` necessário: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_LOCAL_DEMO`.
- `SUPABASE_SECRET_KEY=sb_secret_...` será necessário apenas para operações server-side privilegiadas; não está configurado nem usado atualmente.
- `.env.local` está excluído pelo `.gitignore`.
- Supabase remoto: projeto `delivery-manager` ativo; migration 0001 aplicada; 20 tabelas públicas com RLS ativo; nenhum bucket Storage criado.
- Migration 0002 de hardening RLS está apenas local e ainda não aplicada remotamente.
- GitHub: `main` publicado em `allexavelardev/delivery-manager`; último commit remoto `42a2496`.
- Estado local após o último push: loja pública, `components/public-store.tsx` e `backup_auditoria.zip` estão fora do último commit remoto.

## Pendências e próximo passo imediato

- Remover dados locais do dashboard/cardápio e criar leituras reais por empresa no Supabase.
- Implementar Route Handler/RPC de checkout com recálculo de preço, disponibilidade, pedido mínimo, idempotência e histórico.
- Aplicar e validar `0002_harden_rls_helpers.sql` no Supabase.
- Implementar associação de usuário à empresa, papéis RLS, OTP por telefone e histórico protegido do cliente.
- Criar upload client-side Canvas/WebP e políticas do Storage.
- Adicionar testes de isolamento RLS e fluxo Playwright.

Próxima tarefa: criar o checkout server-side transacional, com recálculo de preços no banco, validação de disponibilidade/pedido mínimo, idempotência e histórico.
