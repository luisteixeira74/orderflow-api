import { prisma } from "../../../lib/prisma.js";
import type { UpdateProductInput } from "../product.schema.js";

export async function updateProductUseCase(
  id: string,
  data: UpdateProductInput,
) {
  const updateData = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && {
      description: data.description,
    }),
    ...(data.price !== undefined && { price: data.price }),
    ...(data.stock !== undefined && { stock: data.stock }),
  };

  return prisma.product.updateMany({
    where: { id },
    data: updateData,
  });
}
