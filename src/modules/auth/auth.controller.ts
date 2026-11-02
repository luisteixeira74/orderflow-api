import type { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema } from "./auth.schema.js";
import { loginUseCase } from "./login.use-case.js";

export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = loginSchema.safeParse(request.body);

  if (!result.success) {
    return reply.status(400).send({
      message: "Dados de entrada inválidos",
      errors: result.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await loginUseCase(result.data);

    const token = request.server.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return reply.status(200).send({
      token,
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return reply.status(401).send({
        message: "E-mail ou senha inválidos",
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      message: "Erro interno do servidor",
    });
  }
}
