"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CenterSchema } from "@/lib/validation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormGrid, FormField } from "@/components/ui/form-grid";

type CenterFormData = { name: string; type: string; obs: string };
const centerTypes = ["Interno", "Terceirizado", "Digital", "Offset", "Outro"];

function Navbar() {
  return (
    <nav className="w-full bg-white shadow flex justify-center py-4 mb-8">
      <div className="flex gap-8">
        <Button asChild variant="ghost"><Link href="/">Dashboard</Link></Button>
        <Button asChild variant="ghost"><Link href="/clients">Clientes</Link></Button>
        <Button asChild variant="ghost"><Link href="/centers">Centros</Link></Button>
        <Button asChild variant="ghost"><Link href="/orders">Ordens</Link></Button>
        <Button asChild variant="ghost"><Link href="/reports">Relatórios</Link></Button>
      </div>
    </nav>
  );
}

export default function NewCenterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isValid, isSubmitting } } = useForm<CenterFormData>({
    resolver: zodResolver(CenterSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: CenterFormData) => {
    setServerError("");
    try {
      const res = await fetch('/api/centers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || 'Erro ao criar centro.';
          throw new Error(msg);
        } catch (e) {
          if (e instanceof Error && e.message !== 'Failed to fetch') throw e;
          throw new Error('Erro ao criar centro.');
        }
      }
      router.push('/centers');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao criar centro.');
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen">
      <Navbar />
      <Card className="max-w-4xl w-full mt-8">
        <CardHeader>
          <CardTitle>Novo Centro</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && <div className="text-red-600 mb-4">{serverError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Nome do centro" aria-invalid={!!errors.name} {...register('name')} />
                {errors.name?.message && <p className="text-sm text-red-600">{String(errors.name.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="type">Tipo</Label>
                <Select onValueChange={(value) => setValue('type', value)} {...register('type')}>
                  <SelectTrigger aria-invalid={!!errors.type}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {centerTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type?.message && <p className="text-sm text-red-600">{String(errors.type.message)}</p>}
              </FormField>
            </FormGrid>

            <FormField>
              <Label htmlFor="obs">Observações</Label>
              <Input id="obs" placeholder="Opcional" {...register('obs')} />
            </FormField>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/centers')}>Cancelar</Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
