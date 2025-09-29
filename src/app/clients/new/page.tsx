import { ClientForm } from "@/components/forms/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <ClientForm mode="create" />
    </div>
  );
}