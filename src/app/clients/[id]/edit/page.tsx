import { ClientForm } from "@/components/forms/client-form";
import { notFound } from "next/navigation";
import type { Client } from "@/types/models";
import { serverApiCall } from "@/lib/server-auth";

async function getClient(id: string): Promise<Client | null> {
  return await serverApiCall<Client>(`/api/clients/${id}`);
}

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const client = await getClient(id);
  
  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ClientForm mode="edit" initialData={client} />
    </div>
  );
}