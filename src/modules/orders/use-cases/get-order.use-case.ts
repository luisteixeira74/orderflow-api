import { prisma } from "../../../lib/prisma.js";

export async function getOrderUseCase(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}
