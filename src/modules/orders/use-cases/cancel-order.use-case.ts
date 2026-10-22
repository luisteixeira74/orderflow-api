import { prisma } from "../../../lib/prisma.js";

export async function cancelOrderUseCase(id: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.status === "CANCELLED") {
      throw new Error("ORDER_ALREADY_CANCELLED");
    }

    if (order.status !== "PENDING") {
      throw new Error("ORDER_CANNOT_BE_CANCELLED");
    }

    // Update the order status to CANCELLED
    const cancelled = await tx.order.updateMany({
      where: {
        id,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (cancelled.count === 0) {
      throw new Error("ORDER_CANNOT_BE_CANCELLED");
    }

    // Restore stock for each product in the order
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      });
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
