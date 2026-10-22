import { prisma } from "../../../lib/prisma.js";
import type { CreateOrderInput } from "../order.schema.js";

export async function createOrderUseCase(data: CreateOrderInput) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }
    // Get unique product IDs from the order items
    const productIds = [...new Set(data.items.map((item) => item.productId))];

    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    // Create a map of productId to product for easy lookup
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const quantityByProductId = new Map<string, number>();
    // Count total quantity for each product
    for (const item of data.items) {
      const currentQuantity = quantityByProductId.get(item.productId) ?? 0;

      quantityByProductId.set(item.productId, currentQuantity + item.quantity);
    }

    let totalInCents = 0;

    // Calculate total and prepare order items
    const items = data.items.map((item) => {
      const product = productById.get(item.productId)!;
      const totalQuantity = quantityByProductId.get(item.productId)!;

      if (product.stock < totalQuantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const unitPriceInCents = Math.round(Number(product.price) * 100);

      totalInCents += unitPriceInCents * item.quantity;

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    // Update stock for each product
    for (const [productId, quantity] of quantityByProductId) {
      const stockUpdate = await tx.product.updateMany({
        where: {
          id: productId,
          stock: { gte: quantity },
        },
        data: {
          stock: { decrement: quantity },
        },
      });

      if (stockUpdate.count === 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }
    }

    return tx.order.create({
      data: {
        customerId: customer.id,
        status: "PENDING",
        total: (totalInCents / 100).toFixed(2),
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
  });
}
