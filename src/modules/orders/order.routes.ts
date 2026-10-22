import type { FastifyInstance } from "fastify";
import { createOrder } from "./order.controller.js";

export async function orderRoutes(app: FastifyInstance) {
  app.post("/orders", createOrder);
}
