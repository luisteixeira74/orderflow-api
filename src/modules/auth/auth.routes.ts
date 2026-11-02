import type { FastifyInstance } from "fastify";
import { loginController } from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", loginController);
}
