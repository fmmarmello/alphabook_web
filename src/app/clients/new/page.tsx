"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSchema } from "@/lib/validation";
import { onlyDigits } from "@/lib/validators";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ClientFormData = {
  name: string;
  cnpjCpf: string;
  phone: string;
  email: string;
  address: string;
  force?: boolean;
};

import { Navbar } from "@/components/layout/Navbar";

function formatCpfCnpj(value: string): string {
  const d = onlyDigits(value);
  if (d.length <= 11) {
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);
    let out = p1;
    if (p2) out += "." + p2;
    if (p3) out += "." + p3;
    if (p4) out += "-" + p4;
    return out;
  }
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 8);
  const p4 = d.slice(8, 12);
  const p5 = d.slice(12, 14);
  let out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "/" + p4;
  if (p5) out += "-" + p5;
  return out;
}

function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  const dd = d.slice(0, 2);
  const p1 = d.length > 10 ? d.slice(2, 7) : d.slice(2, 6);
  const p2 = d.length > 10 ? d.slice(7, 11) : d.slice(6, 10);
  let out = dd ? `(${dd}` : "";
  if (dd && dd.length === 2) out += ") ";
  if (p1) out += p1;
  if (p2) out += "-" + p2;
  return out;
}

export default function NewClientPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [duplicationError, setDuplicationError] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors, isValid, isSubmitting } } = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const cnpjCpf = watch('cnpjCpf');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (cnpjCpf && (onlyDigits(cnpjCpf).length === 11 || onlyDigits(cnpjCpf).length === 14)) {
        try {
          const res = await fetch(`/api/clients/check-cnpj-cpf?value=${encodeURIComponent(cnpjCpf)}`);
          if (res.status === 409) {
            const err = await res.json();
            setDuplicationError(err?.error?.message || err?.message || "CNPJ/CPF já existe.");
          } else {
            setDuplicationError("");
          }
        } catch (error) {
          setDuplicationError(""); // Clear error on network failure
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [cnpjCpf]);

  const onSubmit = async (data: ClientFormData) => {
    setServerError("");

    if (duplicationError) {
      const proceed = window.confirm(`${duplicationError} Deseja cadastrar mesmo assim?`);
      if (!proceed) {
        return;
      }
      data.force = true;
    }

    try {
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) {
        try {
          const err = await res.json();
          const msg = err?.error?.message || 'Erro ao criar cliente.';
          if (res.status === 409) {
            setDuplicationError(msg);
            return;
          }
          const details = err?.error?.details;
          const fieldErrors = details?.fieldErrors;
          const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
          const fieldMsgs = fieldErrors && typeof fieldErrors === 'object' ? (Object.values(fieldErrors) as any[]).flat().filter(Boolean) : [];
          const allMsgs = [...formErrors, ...fieldMsgs];
          const fullMsg = allMsgs.length ? `${msg}: ${allMsgs.join('; ')}` : msg;
          throw new Error(fullMsg);
        } catch (e) {
          if (e instanceof Error && e.message !== 'Failed to fetch') throw e;
          throw new Error('Erro ao criar cliente.');
        }
      }
      router.push('/clients');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao criar cliente.');
    }
  };

  return (
    <main>
      <Navbar />
      <Card className="max-w-4xl w-full mt-8">
        <CardHeader>
          <CardTitle>Novo Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && <div className="text-red-600 mb-2">{serverError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Nome completo" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name?.message && <p className="text-sm text-red-600">{String(errors.name.message)}</p>}

            <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
            {(() => {
              const reg = register('cnpjCpf');
              return (
                <Input id="cnpjCpf" placeholder="000.000.000-00 ou 00.000.000/0000-00" maxLength={18} aria-invalid={!!errors.cnpjCpf || !!duplicationError} {...reg}
                  onChange={(e) => { e.target.value = formatCpfCnpj(e.target.value); reg.onChange(e); setValue('cnpjCpf', e.target.value, { shouldValidate: true }); }} />
              );
            })()}
            {errors.cnpjCpf?.message && <p className="text-sm text-red-600">{String(errors.cnpjCpf.message)}</p>}
            {duplicationError && <p className="text-sm text-yellow-600">{duplicationError}</p>}

            <Label htmlFor="phone">Telefone</Label>
            {(() => {
              const reg = register('phone');
              return (
                <Input id="phone" type="tel" placeholder="(11) 98765-4321" maxLength={16} aria-invalid={!!errors.phone} {...reg}
                  onChange={(e) => { e.target.value = formatPhone(e.target.value); reg.onChange(e); setValue('phone', e.target.value, { shouldValidate: true }); }} />
              );
            })()}
            {errors.phone?.message && <p className="text-sm text-red-600">{String(errors.phone.message)}</p>}

            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="nome@exemplo.com" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email?.message && <p className="text-sm text-red-600">{String(errors.email.message)}</p>}

            <Label htmlFor="address">Endereço</Label>
            <Input id="address" placeholder="Rua, número, bairro, cidade" aria-invalid={!!errors.address} {...register('address')} />
            {errors.address?.message && <p className="text-sm text-red-600">{String(errors.address.message)}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/clients')}>Cancelar</Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

