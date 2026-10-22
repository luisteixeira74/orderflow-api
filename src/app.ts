import Fastify from "fastify";
import { customerRoutes } from "./modules/customers/customer.routes.js";
import { productRoutes } from "./modules/products/product.routes.js";
import { orderRoutes } from "./modules/orders/order.routes.js";

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
  app.register(productRoutes);
  app.register(orderRoutes);

  return app;
}
