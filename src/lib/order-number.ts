import prisma from "@/lib/prisma";

function prefixForNow(prefix = "OP") {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${yyyy}${mm}/`;
}

function extractSeq(value?: string | null, pref = ""): number {
  if (!value) return 0;
  if (pref && !value.startsWith(pref)) return 0;
  const parts = value.split("/");
  const last = parts[parts.length - 1] ?? "";
  const n = parseInt(last.replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function generateNumeroPedido(prefix = "OP"): Promise<string> {
  const pref = prefixForNow(prefix); // e.g., 202501/
  // Fetch existing order numbers for this prefix from both budgets and orders
  const [budgets, orders] = await Promise.all([
    prisma.budget.findMany({ select: { numero_pedido: true }, where: { numero_pedido: { startsWith: pref } } }),
    prisma.order.findMany({ select: { numero_pedido: true }, where: { numero_pedido: { startsWith: pref } } }),
  ]);
  const maxSeq = Math.max(
    0,
    ...budgets.map((b) => extractSeq(b.numero_pedido, pref)),
    ...orders.map((o) => extractSeq(o.numero_pedido, pref))
  );
  const next = (maxSeq + 1).toString().padStart(4, "0");
  return `${next}${pref}`; // e.g., 0001/202501
}

export default generateNumeroPedido;

