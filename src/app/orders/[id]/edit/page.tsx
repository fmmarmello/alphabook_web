import { OrderForm } from "@/components/forms/order-form";
import { notFound } from "next/navigation";
import type { OrderWithBudget } from "@/types/models";
import { serverApiCall } from "@/lib/server-auth";

async function getOrder(id: string): Promise<OrderWithBudget | null> {
  return await serverApiCall<OrderWithBudget>(`/api/orders/${id}`);
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
