import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const validStatuses = ['received', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof validStatuses[number];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  received: 'preparing',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { status?: string; courier_name?: string | null; assign_only?: boolean } | null;
  const requestedStatus = body?.status;

  if (!body?.assign_only && (!requestedStatus || !validStatuses.includes(requestedStatus as OrderStatus))) {
    return NextResponse.json({ error: 'Status de pedido inválido.' }, { status: 400 });
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

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, company_id, status')
    .eq('id', id)
    .eq('company_id', membership.company_id)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: 'Não foi possível localizar o pedido.' }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  }

  if (body?.assign_only) {
    if (order.status !== 'out_for_delivery' || !body.courier_name?.trim()) {
      return NextResponse.json({ error: 'A atribuição só está disponível para pedidos em rota.' }, { status: 409 });
    }
    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('id')
      .eq('company_id', membership.company_id)
      .eq('active', true)
      .ilike('name', body.courier_name.trim())
      .maybeSingle();
    if (courierError) return NextResponse.json({ error: 'Não foi possível localizar o entregador.' }, { status: 500 });
    if (!courier) return NextResponse.json({ error: 'Entregador não encontrado.' }, { status: 400 });

    const { data: assignment } = await supabase.from('delivery_assignments').select('id').eq('order_id', order.id).maybeSingle();
    const assignmentResult = assignment
      ? await supabase.from('delivery_assignments').update({ courier_id: courier.id, assigned_at: new Date().toISOString() }).eq('id', assignment.id)
      : await supabase.from('delivery_assignments').insert({ company_id: membership.company_id, order_id: order.id, courier_id: courier.id, delivery_fee: 0 });
    if (assignmentResult.error) return NextResponse.json({ error: 'Não foi possível salvar a atribuição.' }, { status: 500 });
    return NextResponse.json({ ok: true, courierId: courier.id });
  }

  if (nextStatus[order.status as OrderStatus] !== requestedStatus) {
    return NextResponse.json({ error: 'Transição de status não permitida.' }, { status: 409 });
  }

  let courierId: string | null = null;
  if (requestedStatus === 'out_for_delivery' && body?.courier_name?.trim()) {
    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('id')
      .eq('company_id', membership.company_id)
      .eq('active', true)
      .ilike('name', body.courier_name.trim())
      .maybeSingle();

    if (courierError) {
      return NextResponse.json({ error: 'Não foi possível localizar o entregador.' }, { status: 500 });
    }
    if (!courier) {
      return NextResponse.json({ error: 'Entregador não encontrado. Informe um nome cadastrado ou deixe em branco.' }, { status: 400 });
    }
    courierId = courier.id;
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: requestedStatus, updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .eq('company_id', membership.company_id)
    .select('id, order_number, status, total, created_at')
    .single();

  if (updateError || !updatedOrder) {
    return NextResponse.json({ error: 'Não foi possível atualizar o pedido.' }, { status: 500 });
  }

  if (requestedStatus === 'out_for_delivery' && courierId) {
    const { data: assignment } = await supabase
      .from('delivery_assignments')
      .select('id')
      .eq('order_id', order.id)
      .maybeSingle();
    const assignmentResult = assignment
      ? await supabase.from('delivery_assignments').update({ courier_id: courierId, assigned_at: new Date().toISOString() }).eq('id', assignment.id)
      : await supabase.from('delivery_assignments').insert({ company_id: membership.company_id, order_id: order.id, courier_id: courierId, delivery_fee: 0 });
    if (assignmentResult.error) {
      return NextResponse.json({ error: 'Pedido atualizado, mas não foi possível associar o entregador.' }, { status: 500 });
    }
  }

  const { error: historyError } = await supabase.from('order_status_history').insert({
    order_id: order.id,
    status: requestedStatus,
    changed_by: user.id,
  });
  const { error: auditError } = await supabase.from('audit_logs').insert({
    company_id: membership.company_id,
    actor_id: user.id,
    action: 'order.status_changed',
    entity_type: 'order',
    entity_id: order.id,
    metadata: { from: order.status, to: requestedStatus },
  });

  if (historyError || auditError) {
    return NextResponse.json({ error: 'Pedido atualizado, mas não foi possível registrar todo o histórico.' }, { status: 500 });
  }

  return NextResponse.json({ order: updatedOrder, role: membership.role });
}
