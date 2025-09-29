import { BudgetForm } from "@/components/forms/budget-form";

export default function NewBudgetPage() {
  return (
    <div className="space-y-6">
      <BudgetForm mode="create" />
    </div>
  );
}