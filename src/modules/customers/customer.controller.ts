import type { FastifyReply, FastifyRequest } from "fastify";
import { listCustomersUseCase } from "./use-cases/list-customers.use-case.js";
import { createCustomerUseCase } from "./use-cases/create-customer.use-case.js";
import { getCustomerByIdUseCase } from "./use-cases/get-customer-by-id.use-case.js";
import { createCustomerSchema } from "./customer.schema.js";

export async function listCustomers(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const customers = await listCustomersUseCase();
  return reply.send(customers);
}

export async function createCustomer(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = createCustomerSchema.safeParse(request.body);

  if (!result.success) {
    return reply.status(400).send({
      message: "Invalid request body",
      errors: result.error.format(),
    });
  }

  try {
    const customer = await createCustomerUseCase(result.data);
    return reply.status(201).send(customer);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CUSTOMER_EMAIL_ALREADY_EXISTS"
    ) {
      return reply.status(409).send({
        message: "E-mail já cadastrado",
      });
    }

    throw error;
  }
}

export async function getCustomerById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  const customer = await getCustomerByIdUseCase(id);

  if (!customer) {
    return reply.status(404).send({
      message: "Cliente não encontrado",
    });
  }

  return reply.send(customer);
}
