import type { FastifyReply, FastifyRequest } from "fastify";
import { createProductSchema } from "./product.schema.js";
import { createProductUseCase } from "./use-cases/create-product.use-case.js";
import { listProductsUseCase } from "./use-cases/list-products.use-case.js";
import { updateProductSchema } from "./product.schema.js";
import { getProductByIdUseCase } from "./use-cases/get-product-by-id.use-case.js";
import { updateProductUseCase } from "./use-cases/update-product.use-case.js";

export async function createProduct(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = createProductSchema.safeParse(request.body);

  if (!result.success) {
    return reply.status(400).send({
      message: "Invalid request body",
      errors: result.error.format(),
    });
  }

  const product = await createProductUseCase(result.data);

  return reply.status(201).send(product);
}

export async function listProducts() {
  return listProductsUseCase();
}

export async function getProductById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const product = await getProductByIdUseCase(request.params.id);

  if (!product) {
    return reply.status(404).send({
      message: "Produto não encontrado",
    });
  }

  return reply.send(product);
}

export async function updateProduct(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = updateProductSchema.safeParse(request.body);

  if (!result.success) {
    return reply.status(400).send({
      message: "Invalid request body",
      errors: result.error.format(),
    });
  }

  const updateResult = await updateProductUseCase(
    request.params.id,
    result.data,
  );

  if (updateResult.count === 0) {
    return reply.status(404).send({
      message: "Produto não encontrado",
    });
  }

  return reply.send({
    message: "Produto atualizado com sucesso",
  });
}
