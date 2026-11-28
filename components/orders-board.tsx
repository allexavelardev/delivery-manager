'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Download, Plus, Search, UserRound } from 'lucide-react';
import { money, orders as seedOrders, type DemoOrder } from '@/lib/demo';

const stages: { status: DemoOrder['status']; label: string; tone: string; dot: string }[] = [
  { status: 'Aguardando', label: 'Aguardando', tone: 'border-[#d5b18c]', dot: 'bg-[#b97945]' },
  { status: 'Em preparo', label: 'Em preparo', tone: 'border-[#d9b66d]', dot: 'bg-[#d99b26]' },
  { status: 'Saiu para entrega', label: 'Saiu para entrega', tone: 'border-[#9bb08e]', dot: 'bg-[#719a76]' },
  { status: 'Concluído', label: 'Concluído', tone: 'border-[#a4b8a8]', dot: 'bg-[#4f8060]' },
];

type ApiOrder = { id: string; order_number: number; status: 'received' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'; total: number | string; created_at: string; customers: { name: string; phone_e164: string } | null; delivery_assignments?: { couriers: { name: string } | null }[] };
type Courier = { id: string; name: string };
const demoCouriers: Courier[] = [{ id: 'demo-rafael', name: 'Rafael Souza' }, { id: 'demo-camila', name: 'Camila Oliveira' }, { id: 'demo-diego', name: 'Diego Martins' }];

function toBoardOrder(order: ApiOrder): DemoOrder {
  const status: DemoOrder['status'] = order.status === 'received' || order.status === 'confirmed' ? 'Aguardando' : order.status === 'preparing' || order.status === 'ready' ? 'Em preparo' : order.status === 'out_for_delivery' ? 'Saiu para entrega' : 'Concluído';
  return { id: `#${order.order_number}`, sourceId: order.id, courierName: order.delivery_assignments?.[0]?.couriers?.name, customer: order.customers?.name ?? 'Cliente não identificado', items: 'Itens do pedido disponíveis no detalhe', total: Number(order.total), status, time: new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
}

export function OrdersBoard() {
  const isDemo = process.env.NEXT_PUBLIC_LOCAL_DEMO === 'true';
  const [orders, setOrders] = useState<DemoOrder[]>(isDemo ? seedOrders : []);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState('');
  const [couriers, setCouriers] = useState<Courier[]>(isDemo ? demoCouriers : []);
  const [assigning, setAssigning] = useState(false);
  const [assignmentSelection, setAssignmentSelection] = useState<Record<string, string>>({});
  const [assignedCouriers, setAssignedCouriers] = useState<Record<string, string>>({});
  const filtered = useMemo(() => orders.filter(order => `${order.id} ${order.customer} ${order.items}`.toLowerCase().includes(query.toLowerCase())), [orders, query]);

  useEffect(() => {
    if (isDemo) return;
    let active = true;
    fetch('/api/empresa/pedidos').then(async response => {
      const body = await response.json() as { error?: string; orders?: ApiOrder[]; couriers?: Courier[] };
      if (!response.ok) throw new Error(body.error ?? 'Não foi possível carregar os pedidos.');
      if (active) setCouriers(body.couriers ?? []);
      return body.orders ?? [];
    }).then(data => { if (active) setOrders(data.map(toBoardOrder)); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os pedidos.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isDemo]);

  async function advanceStatus(order: DemoOrder) {
    const next = order.status === 'Aguardando' ? 'preparing' : order.status === 'Em preparo' ? 'out_for_delivery' : 'delivered';
    if (isDemo) { setOrders(current => current.map(item => item.id === order.id ? { ...item, status: order.status === 'Aguardando' ? 'Em preparo' : order.status === 'Em preparo' ? 'Saiu para entrega' : 'Concluído' } : item)); return; }
    if (!order.sourceId) return;
    setError('');
    const response = await fetch(`/api/empresa/pedidos/${order.sourceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    const body = await response.json() as { error?: string };
    if (!response.ok) { setError(body.error ?? 'Não foi possível atualizar o pedido.'); return; }
    setOrders(current => current.map(item => item.id === order.id ? { ...item, courierName: item.courierName, status: order.status === 'Aguardando' ? 'Em preparo' : order.status === 'Em preparo' ? 'Saiu para entrega' : 'Concluído' } : item));
  }

  async function assignCourier(order: DemoOrder) {
    const selectedCourier = assignmentSelection[order.id];
    if (!selectedCourier) return;
    const courier = couriers.find(item => item.id === selectedCourier);
    if (!courier) return;
    if (isDemo) { setAssignedCouriers(current => ({ ...current, [order.id]: courier.name })); return; }
    if (!order.sourceId) return;
    setAssigning(true); setError('');
    const response = await fetch(`/api/empresa/pedidos/${order.sourceId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assign_only: true, courier_name: courier.name }) });
    const body = await response.json() as { error?: string };
    setAssigning(false);
    if (!response.ok) { setError(body.error ?? 'Não foi possível atribuir o entregador.'); return; }
    setAssignedCouriers(current => ({ ...current, [order.id]: courier.name }));
    setOrders(current => current.map(item => item.id === order.id ? { ...item, courierName: courier.name } : item));
  }

  function exportCsv() { const csv = ['pedido,cliente,itens,total,status,horario', ...filtered.map(order => `${order.id},${order.customer},"${order.items}",${order.total},${order.status},${order.time}`)].join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'pedidos-delivery-manager.csv'; link.click(); URL.revokeObjectURL(url); }

  return <div>
    <div className="flex flex-col sm:flex-row gap-3 mb-5"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-2.5 text-[var(--muted)]"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar pedido, cliente ou item" className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] outline-none focus:border-[var(--primary)]"/></div><button onClick={exportCsv} disabled={loading || Boolean(error)} className="inline-flex items-center justify-center gap-2 border border-[var(--line)] rounded-lg px-3 py-2 text-sm font-bold text-[var(--muted)] disabled:opacity-50"><Download size={15}/>Exportar CSV</button><button disabled={!isDemo} className="inline-flex items-center justify-center gap-2 min-h-10 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16}/>Novo pedido</button></div>
    {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
    {loading && <div className="mb-4 rounded-lg border border-dashed border-[var(--line)] p-5 text-center text-sm text-[var(--muted)]">Carregando pedidos reais...</div>}
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">{stages.map(stage => { const stageOrders = filtered.filter(order => order.status === stage.status); return <section key={stage.status} className={`rounded-xl border-t-4 ${stage.tone} bg-[var(--background)]/70 p-3 min-h-[300px]`}><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`}/><h2 className="text-sm font-bold">{stage.label}</h2></div><span className="text-xs font-bold text-[var(--muted)]">{stageOrders.length}</span></div><div className="space-y-3">{stageOrders.map(order => <article key={order.id} className="panel p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-extrabold">{order.id}</p><p className="text-xs font-semibold mt-1">{order.customer}</p></div><span className="text-[10px] text-[var(--muted)]">{order.time}</span></div><p className="text-xs text-[var(--muted)] mt-3 leading-relaxed">{order.items}</p>{order.status === 'Saiu para entrega' && <div className="mt-3 rounded-lg bg-[var(--background)] p-2.5"><label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]"><UserRound size={13}/>Entregador</label><div className="flex gap-2 mt-2"><select value={assignmentSelection[order.id] ?? ''} onChange={event => setAssignmentSelection(current => ({ ...current, [order.id]: event.target.value }))} className="min-w-0 flex-1 h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-xs"><option value="">{assignedCouriers[order.id] ?? order.courierName ?? 'Não atribuído'}</option>{couriers.map(courier => <option key={courier.id} value={courier.id}>{courier.name}</option>)}</select><button onClick={() => void assignCourier(order)} disabled={!assignmentSelection[order.id] || assigning} className="h-9 rounded-md border border-[var(--primary)] px-2.5 text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white disabled:opacity-50">Atribuir</button></div></div>}{order.status === 'Concluído' && <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--background)] p-2.5 text-xs"><UserRound size={14} className="text-[var(--muted)]"/><span className="text-[var(--muted)]">Entregador:</span><strong>{assignedCouriers[order.id] ?? order.courierName ?? 'Não informado'}</strong></div>}<div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--line)]"><strong className="text-sm tabular-nums">{money(order.total)}</strong>{order.status !== 'Concluído' ? <button onClick={() => void advanceStatus(order)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--primary)] bg-[var(--primary)]/10 px-3 text-[11px] font-extrabold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white">Avançar <ChevronRight size={14}/></button> : <span className="text-[11px] font-bold text-[var(--olive)]">Finalizado</span>}</div></article>)}{stageOrders.length === 0 && <div className="border border-dashed border-[var(--line)] rounded-lg p-5 text-center text-xs text-[var(--muted)]">Nenhum pedido nesta etapa.</div>}</div></section>; })}</div>
  </div>;
}
