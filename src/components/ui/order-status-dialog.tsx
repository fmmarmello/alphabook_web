"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderStatusChangeSchema, type OrderStatusChangeInput, OrderStatusSchema } from "@/lib/validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@/types/models";

interface OrderStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  currentStatus: OrderStatus;
  onStatusChanged: (newStatus: OrderStatus) => void;
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendente",
  IN_PRODUCTION: "Em Produção", 
  COMPLETED: "Concluído",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  ON_HOLD: "Em Espera"
};

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "IN_PRODUCTION", 
  "COMPLETED",
  "DELIVERED",
  "CANCELLED",
  "ON_HOLD"
];

export function OrderStatusDialog({
  open,
  onOpenChange,
  orderId,
  currentStatus,
  onStatusChanged,
}: OrderStatusDialogProps) {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderStatusChangeInput>({
    resolver: zodResolver(OrderStatusChangeSchema),
    defaultValues: {
      status: currentStatus,
      reason: "",
    },
  });

  const selectedStatus = watch("status");

  const onSubmit = async (data: OrderStatusChangeInput) => {
    setServerError("");

    if (data.status === currentStatus) {
      toast.error("Selecione um status diferente do atual");
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || 'Erro ao alterar status da ordem.');
      }

      toast.success('Status da ordem alterado com sucesso!');
      onStatusChanged(data.status);
      onOpenChange(false);
      reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao processar requisição.');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setServerError("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Status da Ordem</DialogTitle>
        </DialogHeader>

        {serverError && <ErrorAlert message={serverError} className="mb-4" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-status">Status Atual</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              {ORDER_STATUS_LABELS[currentStatus]}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Novo Status *</Label>
            <Select 
              onValueChange={(value) => setValue('status', value as OrderStatus)}
              defaultValue={currentStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <SelectItem 
                    key={status} 
                    value={status}
                    disabled={status === currentStatus}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status?.message && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo da Alteração 
              {(selectedStatus === 'CANCELLED' || selectedStatus === 'ON_HOLD') && ' *'}
            </Label>
            <Input
              id="reason"
              placeholder="Descreva o motivo da alteração de status"
              {...register('reason')}
            />
            {errors.reason?.message && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Status
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}