import type { FastifyInstance } from "fastify";
import { createOrder, listOrders, getOrder } from "./order.controller.js";

export async function orderRoutes(app: FastifyInstance) {
  app.post("/orders", createOrder);
  app.get("/orders", listOrders);
  app.get("/orders/:id", getOrder);
}
