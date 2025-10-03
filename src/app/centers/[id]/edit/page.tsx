import { CenterForm } from "@/components/forms/center-form";
import { notFound } from "next/navigation";
import type { Center } from "@/types/models";
import { serverApiCall } from "@/lib/server-auth";

async function getCenter(id: string): Promise<Center | null> {
  return await serverApiCall<Center>(`/api/centers/${id}`);
}

export default async function EditCenterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const center = await getCenter(id);
  
  if (!center) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CenterForm mode="edit" initialData={center} />
    </div>
  );
}