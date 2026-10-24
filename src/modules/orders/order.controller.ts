import type { FastifyReply, FastifyRequest } from "fastify";
import { createOrderSchema } from "./order.schema.js";
import { createOrderUseCase } from "./use-cases/create-order.use-case.js";
import { listOrdersUseCase } from "./use-cases/list-orders.use-case.js";
import { getOrderUseCase } from "./use-cases/get-order.use-case.js";
import { cancelOrderUseCase } from "./use-cases/cancel-order.use-case.js";
import { ORDER_STATUSES } from "./order.constants.js";
import { updateOrderStatusUseCase } from "./use-cases/update-order-status.use-case.js";
import type { HttpErrorResponse } from "../../shared/http-error.js";
import { z } from "zod";
import { performance } from "node:perf_hooks";
import type { OrderMetrics } from "../../plugins/metrics.js";

export async function createOrder(
  request: FastifyRequest,
  reply: FastifyReply,
  metrics: OrderMetrics,
) {
  const result = createOrderSchema.safeParse(request.body);

  if (!result.success) {
    const response: HttpErrorResponse = {
      message: "Corpo da requisição inválido",
      errors: z.treeifyError(result.error),
    };

    return reply.status(400).send(response);
  }

  const startedAt = performance.now();

  try {
    const order = await createOrderUseCase(result.data);

    metrics.ordersCreated.inc();

    return reply.status(201).send(order);
  } catch (error) {
    const knownErrors = [
      "CUSTOMER_NOT_FOUND",
      "PRODUCT_NOT_FOUND",
      "INSUFFICIENT_STOCK",
    ];

    const reason =
      error instanceof Error && knownErrors.includes(error.message)
        ? error.message.toLowerCase()
        : "unexpected";

    metrics.ordersCreationFailed.inc({ reason });

    if (error instanceof Error) {
      if (error.message === "CUSTOMER_NOT_FOUND") {
        const response: HttpErrorResponse = {
          message: "Cliente não encontrado",
        };

        return reply.status(404).send(response);
      }

      if (error.message === "PRODUCT_NOT_FOUND") {
        const response: HttpErrorResponse = {
          message: "Produto não encontrado",
        };

        return reply.status(404).send(response);
      }

      if (error.message === "INSUFFICIENT_STOCK") {
        const response: HttpErrorResponse = {
          message: "Estoque insuficiente",
        };

        return reply.status(409).send(response);
      }
    }

    request.log.error(error);

    return reply.status(500).send({
      message: "Erro interno ao criar pedido",
    });
  } finally {
    const durationSeconds = (performance.now() - startedAt) / 1000;

    metrics.orderCreationDuration.observe(durationSeconds);
  }
}

export async function listOrders(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
  };

  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  const search = query.search?.trim() ?? "";
  const status = query.status?.trim() ?? "";

  if (status && !(ORDER_STATUSES as readonly string[]).includes(status)) {
    const response: HttpErrorResponse = {
      message: "Status inválido para filtro de pedidos",
    };

    return reply.status(400).send(response);
  }

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    const response: HttpErrorResponse = {
      message: "page deve ser positivo e limit deve estar entre 1 e 100",
    };

    return reply.status(400).send(response);
  }

  try {
    const result = await listOrdersUseCase(page, limit, {
      search,
      status,
    });
    return reply.status(200).send(result);
  } catch (error) {
    request.log.error(error);

    const response: HttpErrorResponse = {
      message: "Erro interno ao listar pedidos",
    };

    return reply.status(500).send(response);
  }
}

export async function getOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    const order = await getOrderUseCase(id);

    if (!order) {
      const response: HttpErrorResponse = {
        message: "Pedido não encontrado",
      };

      return reply.status(404).send(response);
    }

    return reply.status(200).send(order);
  } catch (error) {
    request.log.error(error);

    const response: HttpErrorResponse = {
      message: "Erro interno ao consultar pedido",
    };

    return reply.status(500).send(response);
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
        const response: HttpErrorResponse = {
          message: "Pedido não encontrado",
        };

        return reply.status(404).send(response);
      }

      if (error.message === "ORDER_ALREADY_CANCELLED") {
        const response: HttpErrorResponse = {
          message: "Pedido já está cancelado",
        };

        return reply.status(409).send(response);
      }

      if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
        const response: HttpErrorResponse = {
          message: "Pedido não pode ser cancelado neste status",
        };

        return reply.status(409).send(response);
      }
    }

    request.log.error(error);

    const response: HttpErrorResponse = {
      message: "Erro interno ao cancelar pedido",
    };

    return reply.status(500).send(response);
  }
}

export async function updateOrderStatus(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as { status?: unknown } | undefined;
  const nextStatus = body?.status;

  if (typeof nextStatus !== "string") {
    const response: HttpErrorResponse = {
      message: "O campo status é obrigatório e deve ser uma string",
    };

    return reply.status(400).send(response);
  }

  try {
    const order = await updateOrderStatusUseCase(id, nextStatus);

    return reply.status(200).send(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ORDER_NOT_FOUND") {
        const response: HttpErrorResponse = {
          message: "Pedido não encontrado",
        };

        return reply.status(404).send(response);
      }

      if (
        error.message === "ORDER_STATUS_FINAL" ||
        error.message === "INVALID_ORDER_STATUS_TRANSITION"
      ) {
        const response: HttpErrorResponse = {
          message:
            error.message === "ORDER_STATUS_FINAL"
              ? "O pedido já está em um status final"
              : "Transição de status inválida",
        };

        return reply.status(409).send(response);
      }
    }

    request.log.error(error);

    const response: HttpErrorResponse = {
      message: "Erro interno ao atualizar status do pedido",
    };

    return reply.status(500).send(response);
  }
}
