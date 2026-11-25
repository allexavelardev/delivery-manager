# Delivery Manager

Base de um SaaS multiempresa para operação de delivery, construída com Next.js 15, TypeScript, Tailwind CSS, Supabase e Lucide.

## Estado atual

Esta entrega cobre a fundação visual responsiva, a primeira migração SQL multi-tenant e o acesso autenticado ao dashboard. O dashboard ainda usa dados de demonstração; nenhum pedido demonstrativo é gravado no banco.

Incluído:

- Dashboard operacional com busca, avanço de status local, feedback visual e exportação CSV.
- Tema sistema/claro/escuro persistido no navegador.
- Navegação desktop e menu mobile.
- Migração versionada com companies, memberships, catálogo, adicionais, clientes, pedidos, entregadores, pagamentos, assinaturas, configurações e auditoria.
- RLS habilitado e funções `is_company_member` / `has_company_role` com `security definer`.
- `.env.example` sem segredos.
- Auth por magic link/OTP de e-mail, callback PKCE, refresh de sessão por middleware e sign-out.

## Rodar localmente

1. Instale Node.js 20+.
2. Execute `pnpm install` (ou `npm install`).
3. Copie `.env.example` para `.env.local` e informe URL/chave pública do Supabase.
4. Execute `pnpm dev` e abra `http://localhost:3000`.
5. Para checar tipos: `pnpm typecheck`.

No Supabase Dashboard, habilite o provedor Email e adicione `http://localhost:3000/auth/callback` às Redirect URLs. Em deploy, adicione também a URL equivalente de produção.

## Supabase

Com a Supabase CLI configurada, aplique a migration:

```bash
supabase db push
```

Ou execute o conteúdo de `supabase/migrations/0001_delivery_manager.sql` no SQL Editor. Em produção, prefira migrations versionadas e não alterações manuais. Os fluxos públicos de cardápio/checkout devem passar por Route Handlers ou RPCs que recalculem preços no servidor; não conceda SELECT anônimo direto em pedidos ou clientes.

## Segurança e integrações

- `SUPABASE_SERVICE_ROLE_KEY` é exclusivamente server-side e não deve aparecer em código cliente.
- O isolamento depende de `company_id` + RLS; filtros no frontend nunca são a única barreira.
- WhatsApp inicial deve usar link `wa.me` após salvar o pedido. A Cloud API e webhooks assinados ficam como adaptadores futuros.
- Pagamentos de assinatura só devem alterar status após webhook assinado do provedor.
- Dados de cartão não são armazenados.

## Deploy na Vercel

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou a chave `ANON` legada) e, somente se algum Route Handler server-side precisar, `SUPABASE_SERVICE_ROLE_KEY`. Execute o build com `pnpm build`. Nenhum servidor externo permanente é necessário.

## Próximas fases

Onboarding, catálogo CRUD, checkout server-side com snapshot de preços, painel de pedidos persistido, clientes por telefone verificado, painel do entregador, relatórios agregados, storage otimizado e testes Playwright de isolamento.
