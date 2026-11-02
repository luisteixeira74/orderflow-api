import argon2 from "argon2";
import { prisma } from "../../lib/prisma.js";
import type { LoginInput } from "./auth.schema.js";

export async function loginUseCase(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordIsValid = await argon2.verify(user.passwordHash, data.password);

  if (!passwordIsValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
