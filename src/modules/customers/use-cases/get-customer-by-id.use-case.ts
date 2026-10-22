import { prisma } from "../../../lib/prisma.js";

export async function getCustomerByIdUseCase(id: string) {
  return prisma.customer.findUnique({
    where: { id },
  });
}
