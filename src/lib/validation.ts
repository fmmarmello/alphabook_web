import { z } from "zod";
import { isBrazilPhone, isCpfOrCnpj, isEmail } from "./validators";

export const ClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpjCpf: z.string().refine(isCpfOrCnpj, "CNPJ/CPF inválido"),
  phone: z.string().refine(isBrazilPhone, "Telefone inválido"),
  email: z.string().refine(isEmail, "Email inválido"),
  address: z.string().min(1, "Endereço é obrigatório"),
  force: z.boolean().optional(),
});

export type ClientInput = z.infer<typeof ClientSchema>;

export const CenterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["Interno", "Terceirizado", "Digital", "Offset", "Outro"], {
    errorMap: () => ({ message: "Tipo inválido" }),
  }),
  obs: z.string().optional().default(""),
});

export type CenterInput = z.infer<typeof CenterSchema>;

export const OrderSchema = z.object({
  clientId: z.number().int().positive("Cliente inválido"),
  centerId: z.number().int().positive("Centro inválido"),
  title: z.string().min(1, "Título é obrigatório"),
  tiragem: z.number().int().positive("Tiragem deve ser positiva"),
  formato: z.string().min(1, "Formato é obrigatório"),
  numPaginasTotal: z.number().int().nonnegative("Número de páginas inválido"),
  numPaginasColoridas: z.number().int().nonnegative("Número de páginas inválido"),
  valorUnitario: z.number().nonnegative("Valor inválido"),
  valorTotal: z.number().nonnegative("Valor inválido"),
  prazoEntrega: z.string().min(1, "Prazo de entrega é obrigatório"),
  obs: z.string().optional().default(""),
  numero_pedido: z.string().optional(),
  data_pedido: z.string().optional(),
  data_entrega: z.string().optional(),
  solicitante: z.string().optional(),
  documento: z.string().optional(),
  editorial: z.string().optional(),
  tipo_produto: z.string().optional(),
  cor_miolo: z.string().optional(),
  papel_miolo: z.string().optional(),
  papel_capa: z.string().optional(),
  cor_capa: z.string().optional(),
  laminacao: z.string().optional(),
  acabamento: z.string().optional(),
  shrink: z.string().optional(),
  pagamento: z.string().optional(),
  frete: z.string().optional(),
  status: z.string().optional(),
});

export const BudgetSchema = z.object({
  numero_pedido: z.string().optional(),
  data_pedido: z.string().optional(),
  data_entrega: z.string().optional(),
  solicitante: z.string().optional(),
  documento: z.string().optional(),
  editorial: z.string().optional(),
  tipo_produto: z.string().optional(),
  titulo: z.string().min(1, "Título é obrigatório"),
  tiragem: z.number().int().positive("Tiragem deve ser positiva"),
  formato: z.string().min(1, "Formato é obrigatório"),
  total_pgs: z.number().int().nonnegative("Número de páginas inválido"),
  pgs_colors: z.number().int().nonnegative("Número de páginas inválido"),
  cor_miolo: z.string().optional(),
  papel_miolo: z.string().optional(),
  papel_capa: z.string().optional(),
  cor_capa: z.string().optional(),
  laminacao: z.string().optional(),
  acabamento: z.string().optional(),
  shrink: z.string().optional(),
  centro_producao: z.string().optional(),
  observacoes: z.string().optional(),
  preco_unitario: z.number().nonnegative("Valor inválido"),
  preco_total: z.number().nonnegative("Valor inválido"),
  prazo_producao: z.string().optional(),
  pagamento: z.string().optional(),
  frete: z.string().optional(),
  approved: z.boolean().optional(),
  orderId: z.number().int().optional(),
});

export type BudgetInput = z.infer<typeof BudgetSchema>;

export type OrderInput = z.infer<typeof OrderSchema>;

export function parseNumber(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && !Number.isNaN(n) ? n : fallback;
}

export function parseSort(order: string | null) {
  return order === "desc" ? "desc" : "asc" as const;
}

