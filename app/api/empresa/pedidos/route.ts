import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', user.id)
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: 'Não foi possível identificar a empresa.' }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ error: 'Usuário sem empresa ativa.' }, { status: 403 });
  }

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_number, status, total, created_at, customers(name, phone_e164), delivery_assignments(couriers(name))')
    .eq('company_id', membership.company_id)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(100);

  if (ordersError) {
    return NextResponse.json({ error: 'Não foi possível carregar os pedidos.' }, { status: 500 });
  }

  const { data: couriers, error: couriersError } = await supabase
    .from('couriers')
    .select('id, name')
    .eq('company_id', membership.company_id)
    .eq('active', true)
    .order('name');

  if (couriersError) {
    return NextResponse.json({ error: 'Não foi possível carregar os entregadores.' }, { status: 500 });
  }

  return NextResponse.json({ companyId: membership.company_id, role: membership.role, orders: orders ?? [], couriers: couriers ?? [] });
}
