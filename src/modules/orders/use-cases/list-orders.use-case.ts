import { prisma } from "../../../lib/prisma.js";

export async function listOrdersUseCase(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count(),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
