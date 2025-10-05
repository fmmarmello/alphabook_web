import { OrderForm } from "@/components/forms/order-form";

interface NewOrderPageProps {
  searchParams: Promise<{ budgetId?: string }>;
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const params = await searchParams;
  const budgetId = params.budgetId;

  return (
    <div className="space-y-6">
      <OrderForm mode="create" budgetId={budgetId} />
    </div>
  );
}