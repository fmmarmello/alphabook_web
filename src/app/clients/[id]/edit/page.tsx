import { ClientForm } from "@/components/forms/client-form";
import { notFound } from "next/navigation";
import type { Client } from "@/types/models";

async function getClient(id: string): Promise<Client | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clients/${id}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function EditClientPage({
  params,
}: {
  params: { id: string }
}) {
  const client = await getClient(params.id);
  
  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ClientForm mode="edit" initialData={client} />
    </div>
  );
}