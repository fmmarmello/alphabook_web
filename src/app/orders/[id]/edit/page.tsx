import { OrderForm } from "@/components/forms/order-form";
import { notFound } from "next/navigation";
import type { Order } from "@/types/models";

async function getOrder(id: string): Promise<Order | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/orders/${id}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function EditOrderPage({
  params,
}: {
  params: { id: string }
}) {
  const order = await getOrder(params.id);
  
  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <OrderForm mode="edit" initialData={order} />
    </div>
  );
}