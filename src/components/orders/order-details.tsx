// src/components/orders/order-details.tsx
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";

interface OrderDetailsProps {
  order: any; // Order with budget included
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const { budget } = order;

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Ordem {order.numero_pedido}
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-gray-600">
          Baseada no orçamento: {budget.numero_pedido}
        </p>
      </div>

      {/* Budget Information (Read-only) */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-4">Informações do Orçamento (Origem)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Cliente</label>
            <p className="font-medium">{budget.client.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Centro</label>
            <p className="font-medium">{budget.center.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Produto</label>
            <p className="font-medium">{budget.titulo}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Tiragem</label>
            <p className="font-medium">{budget.tiragem.toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Valor Total</label>
            <p className="font-medium">R$ {budget.preco_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <Link href={`/budgets/${budget.id}/edit`} className="text-blue-600 hover:underline">
            → Ver orçamento completo
          </Link>
        </div>
      </div>

      {/* Production Information (Editable) */}
      <div className="space-y-4">
        <h3 className="font-semibold">Informações de Produção</h3>
        {/* Production timeline, costs, notes, etc. */}
      </div>
    </div>
  );
}
