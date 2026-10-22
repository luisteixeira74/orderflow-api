import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),

  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Produto é obrigatório"),
        quantity: z
          .number()
          .int("Quantidade deve ser um número inteiro")
          .positive("Quantidade deve ser maior que zero"),
      }),
    )
    .min(1, "O pedido deve ter pelo menos um item"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
