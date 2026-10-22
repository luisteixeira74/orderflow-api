import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().trim().optional(),
  price: z.number().positive("Preço deve ser maior que zero"),
  stock: z.number().int().min(0, "Estoque não pode ser negativo").default(0),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
