import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

describe("POST /orders", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should create an order with its items and total", async () => {
    const customer = await prisma.customer.create({
      data: {
        name: "Maria Silva",
        email: `order-${Date.now()}@example.com`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Teclado Teste",
        price: "100.00",
        stock: 10,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        customerId: customer.id,
        items: [
          {
            productId: product.id,
            quantity: 2,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body).toMatchObject({
      customerId: customer.id,
      status: "PENDING",
      total: "200",
      items: [
        {
          productId: product.id,
          quantity: 2,
          unitPrice: "100",
        },
      ],
    });

    const savedOrder = await prisma.order.findUnique({
      where: {
        id: body.id,
      },
      include: {
        items: true,
      },
    });

    expect(savedOrder).not.toBeNull();
    expect(savedOrder?.items).toHaveLength(1);

    const updatedProduct = await prisma.product.findUnique({
      where: {
        id: product.id,
      },
    });

    expect(updatedProduct?.stock).toBe(8);
  });

  it("should return 404 when customer does not exist", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Produto Teste",
        price: "50.00",
        stock: 10,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        customerId: "cliente-inexistente",
        items: [
          {
            productId: product.id,
            quantity: 1,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      message: "Cliente não encontrado",
    });
  });

  it("should return 404 when product does not exist", async () => {
    const customer = await prisma.customer.create({
      data: {
        name: "João Silva",
        email: `order-product-${Date.now()}@example.com`,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        customerId: customer.id,
        items: [
          {
            productId: "produto-inexistente",
            quantity: 1,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      message: "Produto não encontrado",
    });
  });

  it("should return 409 when stock is insufficient", async () => {
    const customer = await prisma.customer.create({
      data: {
        name: "Carlos Silva",
        email: `order-stock-${Date.now()}@example.com`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Mouse Teste",
        price: "50.00",
        stock: 2,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        customerId: customer.id,
        items: [
          {
            productId: product.id,
            quantity: 3,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      message: "Estoque insuficiente",
    });
  });

  it("should reject duplicate product items when total quantity exceeds stock", async () => {
    const customer = await prisma.customer.create({
      data: {
        name: "Ana Souza",
        email: `order-duplicate-${Date.now()}@example.com`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Mouse Teste",
        price: "50.00",
        stock: 5,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        customerId: customer.id,
        items: [
          {
            productId: product.id,
            quantity: 3,
          },
          {
            productId: product.id,
            quantity: 3,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      message: "Estoque insuficiente",
    });

    const updatedProduct = await prisma.product.findUnique({
      where: {
        id: product.id,
      },
    });

    expect(updatedProduct?.stock).toBe(5);
  });
});
