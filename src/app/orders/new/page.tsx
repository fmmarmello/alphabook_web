import { OrderForm } from "@/components/forms/order-form";

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <OrderForm mode="create" />
    </div>
  );
}