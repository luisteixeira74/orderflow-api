import { prisma } from "../../../lib/prisma.js";

export async function listCustomersUseCase() {
  return prisma.customer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}
