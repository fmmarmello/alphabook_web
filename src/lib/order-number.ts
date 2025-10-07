import { prisma } from '@/lib/prisma';

export async function generateNumeroPedido(type: 'BUDGET' | 'ORDER' = 'ORDER'): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  if (type === 'ORDER') {
    // Find the last order number for current month
    const lastOrder = await prisma.order.findFirst({
      where: {
        numero_pedido: {
          startsWith: 'ORD-'
        }
      },
      orderBy: {
        numero_pedido: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastOrder) {
      const match = lastOrder.numero_pedido.match(/ORD-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `ORD-${nextNumber.toString().padStart(4, '0')}/${year}${month}`;
  } else {
    // Budget number generation (existing logic)
    const lastBudget = await prisma.budget.findFirst({
      where: {
        numero_pedido: {
          not: null
        }
      },
      orderBy: {
        numero_pedido: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastBudget && lastBudget.numero_pedido) {
      const match = lastBudget.numero_pedido.match(/(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${nextNumber.toString().padStart(4, '0')}/${year}${month}`;
  }
}
