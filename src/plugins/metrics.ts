import type { FastifyInstance } from "fastify";

export function createOrderMetrics(app: FastifyInstance) {
  const client = app.metrics.client;

  return {
    ordersCreated: new client.Counter({
      name: "orders_created_total",
      help: "Total de pedidos criados com sucesso",
    }),

    ordersCreationFailed: new client.Counter({
      name: "orders_creation_failed_total",
      help: "Total de tentativas de criação de pedidos que falharam",
      labelNames: ["reason"],
    }),

    orderCreationDuration: new client.Histogram({
      name: "order_creation_duration_seconds",
      help: "Duração da tentativa de criação de um pedido",
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    }),
  };
}

export type OrderMetrics = ReturnType<typeof createOrderMetrics>;
