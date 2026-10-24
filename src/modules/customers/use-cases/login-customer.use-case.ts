import argon2 from "argon2";
import { prisma } from "../../../lib/prisma.js";
import type { LoginCustomerInput } from "../customer.schema.js";

export async function loginCustomerUseCase(data: LoginCustomerInput) {
  const customer = await prisma.customer.findUnique({
    where: { email: data.email },
  });

  if (!customer) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordIsValid = await argon2.verify(
    customer.passwordHash,
    data.password,
  );

  if (!passwordIsValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
  };
}
