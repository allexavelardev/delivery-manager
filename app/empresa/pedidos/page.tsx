import { CompanyLayout } from '@/components/company-layout';
import { OrdersBoard } from '@/components/orders-board';
export default function OrdersPage(){return <CompanyLayout eyebrow="Operação · pedidos" title="Pedidos" description="Acompanhe cada pedido pela etapa certa e mantenha a cozinha em ritmo."><OrdersBoard/></CompanyLayout>}
