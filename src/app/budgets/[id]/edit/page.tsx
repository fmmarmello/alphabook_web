import EditBudgetForm from "./form";

interface EditBudgetPageProps {
  params: {
    id: string;
  };
}

export default function EditBudgetPage({ params }: EditBudgetPageProps) {
  return <EditBudgetForm budgetId={params.id} />;
}