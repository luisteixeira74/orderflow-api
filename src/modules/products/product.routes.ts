import type { FastifyInstance } from "fastify";
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
} from "./product.controller.js";

export async function productRoutes(app: FastifyInstance) {
  app.get("/products", listProducts);
  app.post("/products", createProduct);
  app.get("/products/:id", getProductById);
  app.put("/products/:id", updateProduct);
}
