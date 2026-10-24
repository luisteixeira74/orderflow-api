import { prisma } from "../../../lib/prisma.js";
import type { CreateCustomerInput } from "../customer.schema.js";
import { Prisma } from "../../../generated/prisma/client.js";
import argon2 from "argon2";

export async function createCustomerUseCase(data: CreateCustomerInput) {
  try {
    const passwordHash = await argon2.hash(data.password);

    return await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
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
