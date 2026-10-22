import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.email("E-mail inválido"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
