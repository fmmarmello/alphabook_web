import NewBudgetForm from "./form";
import { getSpecifications } from "@/lib/specifications";

export default async function NewBudgetPage() {
  const specifications = await getSpecifications();

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8">
      <NewBudgetForm specifications={specifications} />
    </div>
  );
}