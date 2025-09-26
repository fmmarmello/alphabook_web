// D:\\dev\\alphabook_project\\alphabook_web\\src\\app\\api\\budgets\[id]\\approve\\route.ts
import prisma from "@/lib/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) return badRequest("ID inválido");

    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) return notFound("Orçamento não encontrado");

    // Create a new order from the budget
    const order = await prisma.order.create({
      data: {
        title: budget.titulo,
        tiragem: budget.tiragem,
        formato: budget.formato,
        numPaginasTotal: budget.total_pgs,
        numPaginasColoridas: budget.pgs_colors,
        valorUnitario: budget.preco_unitario,
        valorTotal: budget.preco_total,
        prazoEntrega: budget.prazo_producao || "",
        obs: budget.observacoes || "",
        numero_pedido: budget.numero_pedido,
        data_pedido: budget.data_pedido,
        data_entrega: budget.data_entrega,
        solicitante: budget.solicitante,
        documento: budget.documento,
        editorial: budget.editorial,
        tipo_produto: budget.tipo_produto,
        cor_miolo: budget.cor_miolo,
        papel_miolo: budget.papel_miolo,
        papel_capa: budget.papel_capa,
        cor_capa: budget.cor_capa,
        laminacao: budget.laminacao,
        acabamento: budget.acabamento,
        shrink: budget.shrink,
        pagamento: budget.pagamento,
        frete: budget.frete,
        // These fields are not in the budget, so they are set to default values
        clientId: 1, // You need to determine how to set the client
        centerId: 1, // You need to determine how to set the center
      },
    });

    // Update the budget to mark it as approved and link it to the new order
    await prisma.budget.update({
      where: { id },
      data: {
        approved: true,
        orderId: order.id,
      },
    });

    return ok(order);
  } catch (error) {
    return serverError((error as Error).message);
  }
}
