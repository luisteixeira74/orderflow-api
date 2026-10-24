import { prisma } from "../../../lib/prisma.js";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
};

export async function updateOrderStatusUseCase(id: string, nextStatus: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.status === "CANCELLED" || order.status === "DELIVERED") {
      throw new Error("ORDER_STATUS_FINAL");
    }

    const allowedStatuses = ALLOWED_TRANSITIONS[order.status] ?? [];

    if (!allowedStatuses.includes(nextStatus)) {
      throw new Error("INVALID_ORDER_STATUS_TRANSITION");
    }

    const updated = await tx.order.updateMany({
      where: {
        id,
        status: order.status,
      },
      data: {
        status: nextStatus,
      },
    });

    if (updated.count === 0) {
      throw new Error("INVALID_ORDER_STATUS_TRANSITION");
    }

    return tx.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });
  });
}
