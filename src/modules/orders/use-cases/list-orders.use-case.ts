import { prisma } from "../../../lib/prisma.js";

export async function listOrdersUseCase() {
  return prisma.order.findMany({
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
