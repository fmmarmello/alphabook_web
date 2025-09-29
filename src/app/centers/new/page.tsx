import { CenterForm } from "@/components/forms/center-form";

export default function NewCenterPage() {
  return (
    <div className="space-y-6">
      <CenterForm mode="create" />
    </div>
  );
}