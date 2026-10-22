import Fastify from "fastify";
import { customerRoutes } from "./modules/customers/customer.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "orderflow-api",
    };
  });

  app.register(customerRoutes);

  return app;
}
