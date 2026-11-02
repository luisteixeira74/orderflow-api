import { afterEach, describe, it, expect, vi } from "vitest";
import { prisma } from "../src/lib/prisma.js";

const { createOrderUseCaseMock } = vi.hoisted(() => ({
  createOrderUseCaseMock: vi.fn(),
}));

vi.mock("../src/modules/orders/use-cases/create-order.use-case.js", () => ({
  createOrderUseCase: createOrderUseCaseMock,
}));

import { buildApp } from "../src/app.js";

describe("POST /orders - unexpected errors", () => {
  const app = buildApp();

  afterEach(async () => {
    await app.close();
  });

  it("should return 500 when an unexpected error occurs", async () => {
    await app.ready();

    const user = await prisma.user.create({
      data: {
        name: "Usuário Teste",
        email: `error-test-${Date.now()}@example.com`,
        passwordHash: "hash-teste",
      },
    });

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    createOrderUseCaseMock.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        customerId: "customer-test",
        items: [
          {
            productId: "product-test",
            quantity: 1,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      message: "Erro interno ao criar pedido",
    });
    expect(response.body).not.toContain("Database connection failed");
  });
});
