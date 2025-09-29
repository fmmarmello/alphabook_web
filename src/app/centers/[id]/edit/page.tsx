import { CenterForm } from "@/components/forms/center-form";
import { notFound } from "next/navigation";
import type { Center } from "@/types/models";

async function getCenter(id: string): Promise<Center | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/centers/${id}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function EditCenterPage({
  params,
}: {
  params: { id: string }
}) {
  const center = await getCenter(params.id);
  
  if (!center) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CenterForm mode="edit" initialData={center} />
    </div>
  );
}