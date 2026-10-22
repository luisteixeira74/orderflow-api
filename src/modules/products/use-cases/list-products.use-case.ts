import { prisma } from "../../../lib/prisma.js";

export async function listProductsUseCase() {
  return prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}
