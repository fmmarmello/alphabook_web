"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderSchema, OrderInput } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormGrid, FormField } from "@/components/ui/form-grid";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Order, Client, Center } from "@/types/models";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderFormProps {
  mode: 'create' | 'edit';
  initialData?: Order;
}

export function OrderForm({ mode, initialData }: OrderFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [clients, setClients] = useState<Pick<Client, 'id' | 'name'>[]>([]);
  const [centers, setCenters] = useState<Pick<Center, 'id' | 'name'>[]>([]);

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch,
    formState: { errors, isValid, isSubmitting } 
  } = useForm<OrderInput>({
    resolver: zodResolver(OrderSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: initialData ? {
      ...initialData,
      clientId: initialData.clientId,
      centerId: initialData.centerId,
    } : {},
  });

  useEffect(() => {
    const fetchClientsAndCenters = async () => {
      try {
        const [clientsRes, centersRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/centers'),
        ]);
        const clientsData = await clientsRes.json();
        const centersData = await centersRes.json();
        setClients(clientsData.data.map((c: Client) => ({ id: c.id, name: c.name })));
        setCenters(centersData.data.map((c: Center) => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error("Failed to fetch clients or centers", error);
      }
    };
    fetchClientsAndCenters();
  }, []);

  const onSubmit = async (data: OrderInput) => {
    setServerError("");
    try {
      const url = mode === 'create' 
        ? '/api/orders' 
        : `/api/orders/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} ordem.`);
      }

      toast.success(`Ordem ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso!`);
      router.push('/orders');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao processar requisição.');
    }
  };

  return (
    <Card className="max-w-4xl w-full">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nova Ordem de Produção' : 'Editar Ordem de Produção'}</CardTitle>
      </CardHeader>
      <CardContent>
        {serverError && <ErrorAlert message={serverError} className="mb-4" />}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormGrid columns={2} gap="md">
            <FormField>
              <Label htmlFor="clientId">Cliente *</Label>
              <Select onValueChange={(value) => setValue('clientId', parseInt(value))} defaultValue={initialData?.clientId.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId?.message && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
            </FormField>

            <FormField>
              <Label htmlFor="centerId">Centro *</Label>
              <Select onValueChange={(value) => setValue('centerId', parseInt(value))} defaultValue={initialData?.centerId.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um centro" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map(center => (
                    <SelectItem key={center.id} value={center.id.toString()}>{center.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.centerId?.message && <p className="text-sm text-destructive">{errors.centerId.message}</p>}
            </FormField>
          </FormGrid>

          <FormField>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" placeholder="Título da ordem" {...register('title')} />
            {errors.title?.message && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </FormField>

          <FormGrid columns={3} gap="md">
            <FormField>
              <Label htmlFor="tiragem">Tiragem *</Label>
              <Input id="tiragem" type="number" placeholder="0" {...register('tiragem', { valueAsNumber: true })} />
              {errors.tiragem?.message && <p className="text-sm text-destructive">{errors.tiragem.message}</p>}
            </FormField>

            <FormField>
              <Label htmlFor="formato">Formato *</Label>
              <Input id="formato" placeholder="Ex: 21x28cm" {...register('formato')} />
              {errors.formato?.message && <p className="text-sm text-destructive">{errors.formato.message}</p>}
            </FormField>

            <FormField>
              <Label htmlFor="prazoEntrega">Prazo de Entrega *</Label>
              <Input id="prazoEntrega" type="date" {...register('prazoEntrega')} />
              {errors.prazoEntrega?.message && <p className="text-sm text-destructive">{errors.prazoEntrega.message}</p>}
            </FormField>
          </FormGrid>

          <FormGrid columns={2} gap="md">
            <FormField>
              <Label htmlFor="numPaginasTotal">Páginas Totais *</Label>
              <Input id="numPaginasTotal" type="number" placeholder="0" {...register('numPaginasTotal', { valueAsNumber: true })} />
              {errors.numPaginasTotal?.message && <p className="text-sm text-destructive">{errors.numPaginasTotal.message}</p>}
            </FormField>

            <FormField>
              <Label htmlFor="numPaginasColoridas">Páginas Coloridas *</Label>
              <Input id="numPaginasColoridas" type="number" placeholder="0" {...register('numPaginasColoridas', { valueAsNumber: true })} />
              {errors.numPaginasColoridas?.message && <p className="text-sm text-destructive">{errors.numPaginasColoridas.message}</p>}
            </FormField>
          </FormGrid>

          <FormGrid columns={2} gap="md">
            <FormField>
              <Label htmlFor="valorUnitario">Valor Unitário *</Label>
              <Input id="valorUnitario" type="number" step="0.01" placeholder="0.00" {...register('valorUnitario', { valueAsNumber: true })} />
              {errors.valorUnitario?.message && <p className="text-sm text-destructive">{errors.valorUnitario.message}</p>}
            </FormField>

            <FormField>
              <Label htmlFor="valorTotal">Valor Total *</Label>
              <Input id="valorTotal" type="number" step="0.01" placeholder="0.00" {...register('valorTotal', { valueAsNumber: true })} />
              {errors.valorTotal?.message && <p className="text-sm text-destructive">{errors.valorTotal.message}</p>}
            </FormField>
          </FormGrid>

          <FormField>
            <Label htmlFor="obs">Observações</Label>
            <Input id="obs" placeholder="Observações sobre a ordem" {...register('obs')} />
            {errors.obs?.message && <p className="text-sm text-destructive">{errors.obs.message}</p>}
          </FormField>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push('/orders')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Criar Ordem' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
