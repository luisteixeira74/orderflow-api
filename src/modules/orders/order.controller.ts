import type { FastifyReply, FastifyRequest } from "fastify";
import { createOrderSchema } from "./order.schema.js";
import { createOrderUseCase } from "./use-cases/create-order.use-case.js";
import { listOrdersUseCase } from "./use-cases/list-orders.use-case.js";
import { getOrderUseCase } from "./use-cases/get-order.use-case.js";
import { cancelOrderUseCase } from "./use-cases/cancel-order.use-case.js";

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

export async function listOrders(request: FastifyRequest, reply: FastifyReply) {
  try {
    const orders = await listOrdersUseCase();
    return reply.status(200).send(orders);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: "Erro interno ao listar pedidos",
    });
  }
}

export async function getOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    const order = await getOrderUseCase(id);

    if (!order) {
      return reply.status(404).send({
        message: "Pedido não encontrado",
      });
    }

    return reply.status(200).send(order);
  } catch (error) {
    request.log.error(error);

    return reply.status(500).send({
      message: "Erro interno ao consultar pedido",
    });
  }
}

export async function cancelOrder(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params as { id: string };

    const order = await cancelOrderUseCase(id);

    return reply.status(200).send(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ORDER_NOT_FOUND") {
        return reply.status(404).send({
          message: "Pedido não encontrado",
        });
      }

      if (error.message === "ORDER_ALREADY_CANCELLED") {
        return reply.status(409).send({
          message: "Pedido já está cancelado",
        });
      }

      if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
        return reply.status(409).send({
          message: "Pedido não pode ser cancelado neste status",
        });
      }
    }

    request.log.error(error);

    return reply.status(500).send({
      message: "Erro interno ao cancelar pedido",
    });
  }
}
