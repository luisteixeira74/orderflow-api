import type { FastifyInstance } from "fastify";
import {
  createCustomer,
  listCustomers,
  getCustomerById,
} from "./customer.controller.js";

export async function customerRoutes(app: FastifyInstance) {
  app.get("/customers", listCustomers);
  app.post("/customers", createCustomer);
  app.get("/customers/:id", getCustomerById);
}
