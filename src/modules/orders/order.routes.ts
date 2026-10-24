import type { FastifyInstance } from "fastify";
import {
  createOrder,
  listOrders,
  getOrder,
  cancelOrder,
  updateOrderStatus,
} from "./order.controller.js";
import { createOrderMetrics } from "../../plugins/metrics.js";

export async function orderRoutes(app: FastifyInstance) {
  const orderMetrics = createOrderMetrics(app);

  app.post("/orders", (request, reply) =>
    createOrder(request, reply, orderMetrics),
  );
  app.get("/orders", listOrders);
  app.get("/orders/:id", getOrder);
  app.patch("/orders/:id/cancel", cancelOrder);
  app.patch("/orders/:id/status", updateOrderStatus);
}
