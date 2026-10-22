import { prisma } from "../../../lib/prisma.js";
import type { CreateCustomerInput } from "../customer.schema.js";
import { Prisma } from "../../../generated/prisma/client.js";

export async function createCustomerUseCase(data: CreateCustomerInput) {
  try {
    return await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("CUSTOMER_EMAIL_ALREADY_EXISTS");
    }

    throw error;
  }
}
