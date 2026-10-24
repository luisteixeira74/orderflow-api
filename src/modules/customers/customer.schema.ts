import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.email("E-mail inválido").trim(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const loginCustomerSchema = z.object({
  email: z.email("E-mail inválido").trim(),
  password: z.string().min(1, "Senha obrigatória"),
});

export type LoginCustomerInput = z.infer<typeof loginCustomerSchema>;
