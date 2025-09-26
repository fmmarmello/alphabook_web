import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyBRL(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function parseCurrencyBRL(input: string): number {
  const digits = (input || "").replace(/\D+/g, "");
  if (!digits) return 0;
  const cents = parseInt(digits, 10);
  return cents / 100;
}
