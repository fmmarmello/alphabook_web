// D:\\dev\\alphabook_project\\alphabook_web\\src\\app\\budgets\\new\\page.tsx
import { getSpecifications } from "@/lib/specifications";
import NewBudgetForm from "./form";

export default function NewBudgetPage() {
  const specifications = getSpecifications();
  return <NewBudgetForm specifications={specifications} />;
}
