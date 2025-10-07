import { z } from "zod";
import { isBrazilPhone, isCpfOrCnpj, isEmail } from "./validators";
import { SPECIFICATION_OPTIONS } from "./specifications-enums";

// Budget status enum validation
export const BudgetStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED", 
  "APPROVED",
  "REJECTED",
  "CONVERTED",
  "CANCELLED"
]);

// Order status enum validation
export const OrderStatusSchema = z.enum([
  "PENDING",
  "IN_PRODUCTION",
  "COMPLETED", 
  "DELIVERED",
  "CANCELLED",
  "ON_HOLD"
]);

// Order type enum validation
export const OrderTypeSchema = z.enum([
  "BUDGET_DERIVED",
  "DIRECT_ORDER", 
  "RUSH_ORDER"
]);

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
  type: z.enum(["Interno", "Terceirizado", "Digital", "Offset", "Outro"]),
  obs: z.string().optional().default(""),
});

export type CenterInput = z.infer<typeof CenterSchema>;

export const OrderSchema = z.object({
  clientId: z.number().int().positive("Cliente inválido"),
  centerId: z.number().int().positive("Centro inválido"),
  budgetId: z.number().int().positive("Orçamento inválido").optional(),
  orderType: OrderTypeSchema.optional(),
  title: z.string().min(1, "Título é obrigatório"),
  tiragem: z.number().int().positive("Tiragem deve ser positiva"),
  formato: z.string().min(1, "Formato é obrigatório"),
  numPaginasTotal: z.number().int().nonnegative("Número de páginas inválido"),
  numPaginasColoridas: z.number().int().nonnegative("Número de páginas inválido"),
  valorUnitario: z.number().nonnegative("Valor inválido"),
  valorTotal: z.number().nonnegative("Valor inválido"),
  prazoEntrega: z.string().min(1, "Prazo de entrega é obrigatório"),
  obs: z.string().optional().default(""),
  status: OrderStatusSchema.optional(),
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
});

// Production specification schemas with enum validation
export const ProductionSpecificationsSchema = z.object({
  cor_miolo: z.enum(SPECIFICATION_OPTIONS.COR_MIOLO).optional(),
  papel_miolo: z.enum(SPECIFICATION_OPTIONS.PAPEL_MIOLO).optional(),
  papel_capa: z.enum(SPECIFICATION_OPTIONS.PAPEL_CAPA).optional(),
  cor_capa: z.enum(SPECIFICATION_OPTIONS.COR_CAPA).optional(),
  laminacao: z.enum(SPECIFICATION_OPTIONS.LAMINACAO).optional(),
  acabamento: z.enum(SPECIFICATION_OPTIONS.ACABAMENTO).optional(),
  shrink: z.enum(SPECIFICATION_OPTIONS.SHRINK).optional(),
  centro_producao: z.enum(SPECIFICATION_OPTIONS.CENTRO_PRODUCAO).optional(),
}).refine(
  (data) => {
    // Business rule: If capa is "Sem capa", other capa fields should be empty
    if (data.cor_capa === "Sem capa") {
      return !data.papel_capa && !data.laminacao;
    }
    return true;
  },
  {
    message: "Campos da capa devem estar vazios quando 'Sem capa' é selecionado",
    path: ["cor_capa"],
  }
).refine(
  (data) => {
    // Business rule: If "Fichário" is selected for capa, lamination doesn't apply
    if (data.cor_capa === "Fichário") {
      return !data.laminacao;
    }
    return true;
  },
  {
    message: "Laminação não se aplica quando 'Fichário' é selecionado",
    path: ["laminacao"],
  }
);

// Enhanced budget schema with production specification validation
export const EnhancedBudgetSchema = z.object({
  // Core fields
  clientId: z.number().int().positive("Cliente é obrigatório"),
  centerId: z.number().int().positive("Centro de produção é obrigatório"),
  numero_pedido: z.string().optional(),
  data_pedido: z.string().optional(),
  data_entrega: z.string().optional(),
  solicitante: z.string().optional(),
  documento: z.string().optional(),
  editorial: z.string().optional(),
  tipo_produto: z.string().optional(),

  // Required fields
  titulo: z.string().min(1, "Título é obrigatório"),
  tiragem: z.number().int().positive("Tiragem deve ser positiva"),
  formato: z.string().min(1, "Formato é obrigatório"),
  total_pgs: z.number().int().nonnegative("Número de páginas inválido"),
  pgs_colors: z.number().int().nonnegative("Número de páginas inválido"),

  // Production specifications with enhanced validation
  ...ProductionSpecificationsSchema.shape,

  // Other fields
  observacoes: z.string().optional(),
  preco_unitario: z.number().nonnegative("Valor inválido"),
  preco_total: z.number().nonnegative("Valor inválido"),
  prazo_producao: z.string().optional(),
  pagamento: z.string().optional(),
  frete: z.string().optional(),
  status: BudgetStatusSchema.optional(),
  approved: z.boolean().optional(),
  orderId: z.number().int().optional(),
}).refine(
  (data) => {
    // Business rule: Color pages cannot exceed total pages
    if (data.pgs_colors > data.total_pgs) {
      return false;
    }
    return true;
  },
  {
    message: "Páginas coloridas não podem exceder o total de páginas",
    path: ["pgs_colors"],
  }
).refine(
  (data) => {
    // Business rule: Total price should equal tiragem * preco_unitario
    const calculatedTotal = data.tiragem * data.preco_unitario;
    const tolerance = 0.01; // Small tolerance for floating point
    return Math.abs(data.preco_total - calculatedTotal) <= tolerance;
  },
  {
    message: "Preço total deve ser igual a tiragem multiplicada pelo preço unitário",
    path: ["preco_total"],
  }
);

// Enhanced schema for order creation with conditional validation
export const OrderCreationSchema = z.object({
  clientId: z.number().int().positive("Cliente inválido").optional(),
  centerId: z.number().int().positive("Centro inválido").optional(),
  budgetId: z.number().int().positive("Orçamento inválido").optional(),
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
}).refine(
  (data) => {
    // If budgetId is provided, clientId and centerId are optional (taken from budget)
    // If budgetId is not provided, clientId and centerId are required
    if (!data.budgetId) {
      return data.clientId && data.centerId;
    }
    return true;
  },
  {
    message: "Cliente e Centro são obrigatórios quando não há orçamento vinculado",
    path: ["clientId"],
  }
);

// Schema for order status changes
export const OrderStatusChangeSchema = z.object({
  status: OrderStatusSchema,
  reason: z.string().optional(),
});

export const BudgetSchema = z.object({
  clientId: z.number().int().positive("Cliente é obrigatório"),
  centerId: z.number().int().positive("Centro de produção é obrigatório"),
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
  status: BudgetStatusSchema.optional(),
  approved: z.boolean().optional(),
  orderId: z.number().int().optional(),
});

// Budget rejection schema
export const BudgetRejectSchema = z.object({
  reason: z.string().min(1, "Motivo da rejeição é obrigatório"),
});

export type BudgetInput = z.infer<typeof BudgetSchema>;
export type EnhancedBudgetInput = z.infer<typeof EnhancedBudgetSchema>;
export type ProductionSpecificationsInput = z.infer<typeof ProductionSpecificationsSchema>;
export type BudgetRejectInput = z.infer<typeof BudgetRejectSchema>;

export type OrderInput = z.infer<typeof OrderSchema>;
export type OrderCreationInput = z.infer<typeof OrderCreationSchema>;
export type OrderStatusChangeInput = z.infer<typeof OrderStatusChangeSchema>;

export function parseNumber(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && !Number.isNaN(n) ? n : fallback;
}

export function parseSort(order: string | null) {
  return order === "desc" ? "desc" : ("asc" as const);
}

