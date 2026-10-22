import { prisma } from "../../../lib/prisma.js";

export async function getProductByIdUseCase(id: string) {
  return prisma.product.findUnique({
    where: {
      id,
    },
  });
}
