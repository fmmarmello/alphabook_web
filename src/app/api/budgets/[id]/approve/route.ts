import prisma from "@/lib/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api-response";
import { generateNumeroPedido } from "@/lib/order-number";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) return badRequest("ID inválido");

    let budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) return notFound("Orçamento não encontrado");

    if (!budget.numero_pedido) {
      const numero = await generateNumeroPedido();
      budget = await prisma.budget.update({ where: { id }, data: { numero_pedido: numero } });
    }

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
        solicitante: budget.solicitante || undefined,
        documento: budget.documento || undefined,
        editorial: budget.editorial || undefined,
        tipo_produto: budget.tipo_produto || undefined,
        cor_miolo: budget.cor_miolo || undefined,
        papel_miolo: budget.papel_miolo || undefined,
        papel_capa: budget.papel_capa || undefined,
        cor_capa: budget.cor_capa || undefined,
        laminacao: budget.laminacao || undefined,
        acabamento: budget.acabamento || undefined,
        shrink: budget.shrink || undefined,
        pagamento: budget.pagamento || undefined,
        frete: budget.frete || undefined,
        clientId: 1,
        centerId: 1,
      },
    });

    await prisma.budget.update({
      where: { id },
      data: { approved: true, orderId: order.id },
    });

    return ok(order);
  } catch (error) {
    return serverError((error as Error).message);
  }
}

