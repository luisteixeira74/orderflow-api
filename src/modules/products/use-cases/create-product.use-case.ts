import { prisma } from "../../../lib/prisma.js";
import type { CreateProductInput } from "../product.schema.js";

export async function createProductUseCase(data: CreateProductInput) {
  return prisma.product.create({
    data: {
      name: data.name,
      ...(data.description !== undefined && {
        description: data.description,
      }),
      price: data.price,
      stock: data.stock,
    },
  });
}
