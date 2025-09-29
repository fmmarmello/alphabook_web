"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderSchema, type OrderInput } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormGrid, FormRow, FormField } from "@/components/ui/form-grid";
import { Navbar } from "@/components/layout/Navbar";
import { getSpecifications } from "@/lib/specifications";

type OrderFormData = OrderInput;

export default function NewOrderPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [centers, setCenters] = useState<{ id: number; name: string }[]>([]);
  const [specifications, setSpecifications] = useState<any>({});

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid, isSubmitting } } = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [rc, rz, rs] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/centers'),
          fetch('/api/specifications')
        ]);
        const jc = await rc.json();
        const jz = await rz.json();
        const js = await rs.json();
        const listC = Array.isArray(jc) ? jc : Array.isArray(jc?.data) ? jc.data : [];
        const listZ = Array.isArray(jz) ? jz : Array.isArray(jz?.data) ? jz.data : [];
        setClients(listC.map((c: any) => ({ id: c.id, name: c.name })));
        setCenters(listZ.map((c: any) => ({ id: c.id, name: c.name })));
        setSpecifications(js);
      } catch {
        setClients([]);
        setCenters([]);
      }
    };
    load();
  }, []);

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
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || 'Erro ao criar ordem.';
          const details = err?.error?.details;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fullMsg = formErrors.length ? `${msg}: ${formErrors.join('; ')}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== 'Failed to fetch') throw e;
          throw new Error('Erro ao criar ordem.');
        }
      }
      router.push('/orders');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao criar ordem.');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      <Card className="max-w-3xl w-full mt-8">
        <CardHeader>
          <CardTitle>Nova OP</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && <div className="text-red-600 mb-4">{serverError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormGrid columns={3} gap="md">
              <FormField>
                <Label htmlFor="clientId">Cliente</Label>
                <Select onValueChange={(value) => setValue('clientId', Number(value))} {...register('clientId')}>
                  <SelectTrigger className="min-w-0 w-full" aria-invalid={!!errors.clientId}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId?.message && <p className="text-sm text-red-600">{String(errors.clientId.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="centerId">Centro de Produção</Label>
                <Select onValueChange={(value) => setValue('centerId', Number(value))} {...register('centerId')}>
                  <SelectTrigger className="min-w-0 w-full" aria-invalid={!!errors.centerId}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.centerId?.message && <p className="text-sm text-red-600">{String(errors.centerId?.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => setValue('status', value)} defaultValue="Pendente" {...register('status')}>
                  <SelectTrigger className="min-w-0 w-full" aria-invalid={!!errors.status}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em produção">Em produção</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status?.message && <p className="text-sm text-red-600">{String(errors.status.message)}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={3} gap="md">
              <FormField>
                <Label htmlFor="numero_pedido">Número do Pedido</Label>
                <Input id="numero_pedido" {...register('numero_pedido')} />
                {errors.numero_pedido?.message && <p className="text-sm text-red-600">{String(errors.numero_pedido.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="data_pedido">Data do Pedido</Label>
                <Input id="data_pedido" type="date" {...register('data_pedido')} />
                {errors.data_pedido?.message && <p className="text-sm text-red-600">{String(errors.data_pedido.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="data_entrega">Data de Entrega</Label>
                <Input id="data_entrega" type="date" {...register('data_entrega')} />
                {errors.data_entrega?.message && <p className="text-sm text-red-600">{String(errors.data_entrega.message)}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="solicitante">Solicitante</Label>
                <Input id="solicitante" {...register('solicitante')} />
                {errors.solicitante?.message && <p className="text-sm text-red-600">{String(errors.solicitante.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="documento">Documento</Label>
                <Input id="documento" {...register('documento')} />
                {errors.documento?.message && <p className="text-sm text-red-600">{String(errors.documento.message)}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="editorial">Grupo Editorial</Label>
                <Input id="editorial" {...register('editorial')} />
                {errors.editorial?.message && <p className="text-sm text-red-600">{String(errors.editorial.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="tipo_produto">Tipo de Produto</Label>
                <Input id="tipo_produto" {...register('tipo_produto')} />
                {errors.tipo_produto?.message && <p className="text-sm text-red-600">{String(errors.tipo_produto.message)}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={4} gap="md">
              <FormField>
                <Label htmlFor="cor_miolo">Cor do Miolo</Label>
                <Select onValueChange={(value) => setValue('cor_miolo', value)} {...register('cor_miolo')}>
                  <SelectTrigger className="min-w-0 w-full" aria-invalid={!!errors.cor_miolo}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {specifications["Cor do miolo"]?.map((item: string) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cor_miolo?.message && <p className="text-sm text-red-600">{String(errors.cor_miolo.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="papel_miolo">Papel do Miolo</Label>
                <Select onValueChange={(value) => setValue('papel_miolo', value)} {...register('papel_miolo')}>
                  <SelectTrigger className="min-w-0 w-full" aria-invalid={!!errors.papel_miolo}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {specifications["Tipo de Papel miolo"]?.map((item: string) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.papel_miolo?.message && <p className="text-sm text-red-600">{String(errors.papel_miolo.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="papel_capa">Papel da Capa</Label>
                <Select onValueChange={(value) => setValue('papel_capa', value)} {...register('papel_capa')}>
                  <SelectTrigger className="min-w-0 w-full" aria-invalid={!!errors.papel_capa}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {specifications["Tipo de Papel de Capa"]?.map((item: string) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.papel_capa?.message && <p className="text-sm text-red-600">{String(errors.papel_capa.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="cor_capa">Cor da Capa</Label>
                <Select onValueChange={(value) => setValue('cor_capa', value)} {...register('cor_capa')}>
                  <SelectTrigger className="min-w-0 w-full" aria-invalid={!!errors.cor_capa}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {specifications["Cor da capa"]?.map((item: string) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cor_capa?.message && <p className="text-sm text-red-600">{String(errors.cor_capa.message)}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={3} gap="md">
              <FormField>
                <Label htmlFor="laminacao">Laminação</Label>
                <Input id="laminacao" {...register('laminacao')} />
                {errors.laminacao?.message && <p className="text-sm text-red-600">{String(errors.laminacao.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="acabamento">Acabamento</Label>
                <Input id="acabamento" {...register('acabamento')} />
                {errors.acabamento?.message && <p className="text-sm text-red-600">{String(errors.acabamento.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="shrink">Shrink</Label>
                <Input id="shrink" {...register('shrink')} />
                {errors.shrink?.message && <p className="text-sm text-red-600">{String(errors.shrink.message)}</p>}
              </FormField>
            </FormGrid>

            <FormGrid columns={2} gap="md">
              <FormField>
                <Label htmlFor="pagamento">Pagamento</Label>
                <Input id="pagamento" {...register('pagamento')} />
                {errors.pagamento?.message && <p className="text-sm text-red-600">{String(errors.pagamento.message)}</p>}
              </FormField>

              <FormField>
                <Label htmlFor="frete">Frete</Label>
                <Input id="frete" {...register('frete')} />
                {errors.frete?.message && <p className="text-sm text-red-600">{String(errors.frete.message)}</p>}
              </FormField>
            </FormGrid>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/orders')}>Cancelar</Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

