"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderSchema } from "@/lib/validation";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrencyBRL, parseCurrencyBRL } from "@/lib/utils";

import { OrderInput } from "@/lib/validation";

type OrderFormData = OrderInput;

function Navbar() {
  return (
    <nav className="w-full bg-white shadow flex justify-center py-4 mb-8">
      <div className="flex gap-8">
        <Button asChild variant="ghost"><a href="/">Dashboard</a></Button>
        <Button asChild variant="ghost"><a href="/clients">Clientes</a></Button>
        <Button asChild variant="ghost"><a href="/centers">Centros</a></Button>
        <Button asChild variant="ghost"><a href="/orders">Ordens</a></Button>
        <Button asChild variant="ghost"><a href="/reports">Relatórios</a></Button>
      </div>
    </nav>
  );
}

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [serverError, setServerError] = useState("");
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [centers, setCenters] = useState<{ id: number; name: string }[]>([]);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors, isValid, isSubmitting } } = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [ro, rc, rz] = await Promise.all([
          fetch(`/api/orders/${id}`),
          fetch('/api/clients'),
          fetch('/api/centers')
        ]);
        const jo = await ro.json();
        const order = jo?.data ?? jo;
        const jc = await rc.json();
        const jz = await rz.json();
        const listC = Array.isArray(jc) ? jc : Array.isArray(jc?.data) ? jc.data : [];
        const listZ = Array.isArray(jz) ? jz : Array.isArray(jz?.data) ? jz.data : [];
        setClients(listC.map((c: any) => ({ id: c.id, name: c.name })));
        setCenters(listZ.map((c: any) => ({ id: c.id, name: c.name })));
        reset({
          ...order,
          prazoEntrega: order.prazoEntrega ? new Date(order.prazoEntrega).toISOString().split('T')[0] : '',
          data_pedido: order.data_pedido ? new Date(order.data_pedido).toISOString().split('T')[0] : '',
          data_entrega: order.data_entrega ? new Date(order.data_entrega).toISOString().split('T')[0] : '',
          obs: order.obs ?? "",
          numero_pedido: order.numero_pedido ?? "",
          solicitante: order.solicitante ?? "",
          documento: order.documento ?? "",
          editorial: order.editorial ?? "",
          tipo_produto: order.tipo_produto ?? "",
          cor_miolo: order.cor_miolo ?? "",
          papel_miolo: order.papel_miolo ?? "",
          papel_capa: order.papel_capa ?? "",
          cor_capa: order.cor_capa ?? "",
          laminacao: order.laminacao ?? "",
          acabamento: order.acabamento ?? "",
          shrink: order.shrink ?? "",
          pagamento: order.pagamento ?? "",
          frete: order.frete ?? "",
          status: order.status ?? "Pendente",
        });
      } catch {}
    };
    if (id) load();
  }, [id, reset]);

  // Auto compute total
  const tiragem = watch("tiragem") || 0;
  const valorUnitario = watch("valorUnitario") || 0;
  useEffect(() => {
    const total = (Number(tiragem) || 0) * (Number(valorUnitario) || 0);
    setValue("valorTotal", total, { shouldValidate: true });
  }, [tiragem, valorUnitario, setValue]);

  const onSubmit = async (data: OrderFormData) => {
    setServerError("");
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || 'Erro ao atualizar ordem.';
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fullMsg = formErrors.length ? `${msg}: ${formErrors.join('; ')}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== 'Failed to fetch') throw e;
          throw new Error('Erro ao atualizar ordem.');
        }
      }
      router.push('/orders');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao atualizar ordem.');
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50"> 
      <Navbar />
      <Card className="max-w-3xl w-full mt-8">
        <CardHeader>
          <CardTitle>Editar OP</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && <div className="text-red-600 mb-2">{serverError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Label htmlFor="clientId">Cliente</Label>
            <select id="clientId" aria-invalid={!!errors.clientId} {...register('clientId', { valueAsNumber: true })} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.clientId?.message && <p className="text-sm text-red-600">{String(errors.clientId.message)}</p>}

            <Label htmlFor="centerId">Centro de Produção</Label>
            <select id="centerId" aria-invalid={!!errors.centerId} {...register('centerId', { valueAsNumber: true })} className="border rounded px-2 py-1">
              <option value="">Selecione...</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.centerId?.message && <p className="text-sm text-red-600">{String(errors.centerId.message)}</p>}

            <Label htmlFor="title">Título</Label>
            <Input id="title" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title?.message && <p className="text-sm text-red-600">{String(errors.title.message)}</p>}

            <Label htmlFor="tiragem">Tiragem</Label>
            <Input id="tiragem" type="number" min={0} aria-invalid={!!errors.tiragem} {...register('tiragem', { valueAsNumber: true })} />
            {errors.tiragem?.message && <p className="text-sm text-red-600">{String(errors.tiragem.message)}</p>}

            <Label htmlFor="formato">Formato</Label>
            <Input id="formato" aria-invalid={!!errors.formato} {...register('formato')} />
            {errors.formato?.message && <p className="text-sm text-red-600">{String(errors.formato.message)}</p>}

            <Label htmlFor="numPaginasTotal">Nº de páginas total</Label>
            <Input id="numPaginasTotal" type="number" min={0} aria-invalid={!!errors.numPaginasTotal} {...register('numPaginasTotal', { valueAsNumber: true })} />
            {errors.numPaginasTotal?.message && <p className="text-sm text-red-600">{String(errors.numPaginasTotal.message)}</p>}

            <Label htmlFor="numPaginasColoridas">Nº de páginas coloridas</Label>
            <Input id="numPaginasColoridas" type="number" min={0} aria-invalid={!!errors.numPaginasColoridas} {...register('numPaginasColoridas', { valueAsNumber: true })} />
            {errors.numPaginasColoridas?.message && <p className="text-sm text-red-600">{String(errors.numPaginasColoridas.message)}</p>}

            <Label htmlFor="valorUnitario">Valor Unitário</Label>
            <Controller
              name="valorUnitario"
              control={control}
              render={({ field }) => (
                <Input
                  id="valorUnitario"
                  type="text"
                  inputMode="decimal"
                  aria-invalid={!!errors.valorUnitario}
                  value={formatCurrencyBRL(Number(field.value) || 0)}
                  onChange={(e) => {
                    const num = parseCurrencyBRL(e.target.value);
                    field.onChange(num);
                  }}
                />
              )}
            />
            {errors.valorUnitario?.message && <p className="text-sm text-red-600">{String(errors.valorUnitario.message)}</p>}

            <Label htmlFor="valorTotal">Valor Total</Label>
            <Controller
              name="valorTotal"
              control={control}
              render={({ field }) => (
                <Input
                  id="valorTotal"
                  type="text"
                  readOnly
                  aria-invalid={!!errors.valorTotal}
                  value={formatCurrencyBRL(Number(field.value) || 0)}
                />
              )}
            />
            {errors.valorTotal?.message && <p className="text-sm text-red-600">{String(errors.valorTotal.message)}</p>}

            <Label htmlFor="prazoEntrega">Prazo de entrega</Label>
            <Input id="prazoEntrega" type="date" aria-invalid={!!errors.prazoEntrega} {...register('prazoEntrega')} />
            {errors.prazoEntrega?.message && <p className="text-sm text-red-600">{String(errors.prazoEntrega.message)}</p>}

            <Label htmlFor="obs">Observações</Label>
            <Input id="obs" {...register('obs')} />

            <h3 className="text-lg font-semibold mt-4 pt-4 border-t">Detalhes Adicionais</h3>

            <Label htmlFor="status">Status</Label>
            <select id="status" {...register('status')} className="border rounded px-2 py-1">
              <option value="Pendente">Pendente</option>
              <option value="Em produção">Em produção</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            {errors.status?.message && <p className="text-sm text-red-600">{String(errors.status.message)}</p>}

            <Label htmlFor="numero_pedido">Número do Pedido</Label>
            <Input id="numero_pedido" {...register('numero_pedido')} />
            {errors.numero_pedido?.message && <p className="text-sm text-red-600">{String(errors.numero_pedido.message)}</p>}

            <Label htmlFor="data_pedido">Data do Pedido</Label>
            <Input id="data_pedido" type="date" {...register('data_pedido')} />
            {errors.data_pedido?.message && <p className="text-sm text-red-600">{String(errors.data_pedido.message)}</p>}

            <Label htmlFor="data_entrega">Data de Entrega</Label>
            <Input id="data_entrega" type="date" {...register('data_entrega')} />
            {errors.data_entrega?.message && <p className="text-sm text-red-600">{String(errors.data_entrega.message)}</p>}

            <Label htmlFor="solicitante">Solicitante</Label>
            <Input id="solicitante" {...register('solicitante')} />
            {errors.solicitante?.message && <p className="text-sm text-red-600">{String(errors.solicitante.message)}</p>}

            <Label htmlFor="documento">Documento</Label>
            <Input id="documento" {...register('documento')} />
            {errors.documento?.message && <p className="text-sm text-red-600">{String(errors.documento.message)}</p>}

            <Label htmlFor="editorial">Grupo Editorial</Label>
            <Input id="editorial" {...register('editorial')} />
            {errors.editorial?.message && <p className="text-sm text-red-600">{String(errors.editorial.message)}</p>}

            <Label htmlFor="tipo_produto">Tipo de Produto</Label>
            <Input id="tipo_produto" {...register('tipo_produto')} />
            {errors.tipo_produto?.message && <p className="text-sm text-red-600">{String(errors.tipo_produto.message)}</p>}

            <Label htmlFor="cor_miolo">Cor do Miolo</Label>
            <Input id="cor_miolo" {...register('cor_miolo')} />
            {errors.cor_miolo?.message && <p className="text-sm text-red-600">{String(errors.cor_miolo.message)}</p>}

            <Label htmlFor="papel_miolo">Papel do Miolo</Label>
            <Input id="papel_miolo" {...register('papel_miolo')} />
            {errors.papel_miolo?.message && <p className="text-sm text-red-600">{String(errors.papel_miolo.message)}</p>}

            <Label htmlFor="papel_capa">Papel da Capa</Label>
            <Input id="papel_capa" {...register('papel_capa')} />
            {errors.papel_capa?.message && <p className="text-sm text-red-600">{String(errors.papel_capa.message)}</p>}

            <Label htmlFor="cor_capa">Cor da Capa</Label>
            <Input id="cor_capa" {...register('cor_capa')} />
            {errors.cor_capa?.message && <p className="text-sm text-red-600">{String(errors.cor_capa.message)}</p>}

            <Label htmlFor="laminacao">Laminação</Label>
            <Input id="laminacao" {...register('laminacao')} />
            {errors.laminacao?.message && <p className="text-sm text-red-600">{String(errors.laminacao.message)}</p>}

            <Label htmlFor="acabamento">Acabamento</Label>
            <Input id="acabamento" {...register('acabamento')} />
            {errors.acabamento?.message && <p className="text-sm text-red-600">{String(errors.acabamento.message)}</p>}

            <Label htmlFor="shrink">Shrink</Label>
            <Input id="shrink" {...register('shrink')} />
            {errors.shrink?.message && <p className="text-sm text-red-600">{String(errors.shrink.message)}</p>}

            <Label htmlFor="pagamento">Pagamento</Label>
            <Input id="pagamento" {...register('pagamento')} />
            {errors.pagamento?.message && <p className="text-sm text-red-600">{String(errors.pagamento.message)}</p>}

            <Label htmlFor="frete">Frete</Label>
            <Input id="frete" {...register('frete')} />
            {errors.frete?.message && <p className="text-sm text-red-600">{String(errors.frete.message)}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/orders')}>Cancelar</Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

