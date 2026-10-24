import fastifyJwt from "@fastify/jwt";
import fastifyPlugin from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";

export const authPlugin = fastifyPlugin(async function (app: FastifyInstance) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não está configurado");
  }

  await app.register(fastifyJwt, {
    secret,
    sign: {
      expiresIn: "15m",
    },
  });

  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          message: "Token ausente ou inválido",
        });
      }
    },
  );
});
