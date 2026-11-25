-- Os helpers não precisam de SECURITY DEFINER quando a política de membros
-- é limitada ao próprio usuário. Isso evita RPC público privilegiado e
-- mantém a checagem de associação protegida pelo RLS.
alter table public.company_members enable row level security;

drop policy if exists members_read on public.company_members;
create policy members_read on public.company_members
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_company_member(target_company uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists(
    select 1 from public.company_members m
    where m.company_id = target_company
      and m.user_id = (select auth.uid())
      and m.active
  );
$$;

create or replace function public.has_company_role(target_company uuid, allowed_roles public.member_role[])
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists(
    select 1 from public.company_members m
    where m.company_id = target_company
      and m.user_id = (select auth.uid())
      and m.active
      and m.role = any(allowed_roles)
  );
$$;
