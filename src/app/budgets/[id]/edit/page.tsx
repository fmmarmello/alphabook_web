// D:\\dev\\alphabook_project\\alphabook_web\\src\\app\\budgets\[id]\\edit\\page.tsx
import { getSpecifications } from "@/lib/specifications";
import EditBudgetForm from "./form";

export default function EditBudgetPage() {
  const specifications = getSpecifications();
  return <EditBudgetForm specifications={specifications} />;
}
