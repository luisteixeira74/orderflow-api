import type { FastifyReply, FastifyRequest } from "fastify";
import { createOrderSchema } from "./order.schema.js";
import { createOrderUseCase } from "./use-cases/create-order.use-case.js";

export async function createOrder(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = createOrderSchema.safeParse(request.body);

  if (!result.success) {
    return reply.status(400).send({
      message: "Invalid request body",
      errors: result.error.format(),
    });
  }

  try {
    const order = await createOrderUseCase(result.data);

    return reply.status(201).send(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CUSTOMER_NOT_FOUND") {
        return reply.status(404).send({
          message: "Cliente não encontrado",
        });
      }

      if (error.message === "PRODUCT_NOT_FOUND") {
        return reply.status(404).send({
          message: "Produto não encontrado",
        });
      }

      if (error.message === "INSUFFICIENT_STOCK") {
        return reply.status(409).send({
          message: "Estoque insuficiente",
        });
      }
    }

    request.log.error(error);

    return reply.status(500).send({
      message: "Erro interno ao criar pedido",
    });
  }
}
