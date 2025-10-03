import { OrderForm } from "@/components/forms/order-form";
import { notFound } from "next/navigation";
import type { Order } from "@/types/models";
import { serverApiCall } from "@/lib/server-auth";

async function getOrder(id: string): Promise<Order | null> {
  return await serverApiCall<Order>(`/api/orders/${id}`);
}

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const order = await getOrder(id);
  
  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <OrderForm mode="edit" initialData={order} />
    </div>
  );
}