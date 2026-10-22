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

  it("should prevent overselling when orders happen concurrently", async () => {
    const customer = await prisma.customer.create({
      data: {
        name: "Cliente Concorrente",
        email: `order-concurrent-${Date.now()}@example.com`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Produto Concorrente",
        price: "50.00",
        stock: 5,
      },
    });

    const payload = {
      customerId: customer.id,
      items: [
        {
          productId: product.id,
          quantity: 4,
        },
      ],
    };

    const [response1, response2] = await Promise.all([
      app.inject({
        method: "POST",
        url: "/orders",
        payload,
      }),
      app.inject({
        method: "POST",
        url: "/orders",
        payload,
      }),
    ]);

    const statuses = [response1.statusCode, response2.statusCode].sort();

    expect(statuses).toEqual([201, 409]);

    const updatedProduct = await prisma.product.findUnique({
      where: {
        id: product.id,
      },
    });

    expect(updatedProduct?.stock).toBe(1);

    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.id,
      },
    });

    expect(orders).toHaveLength(1);
  });
});

describe("GET /orders", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should list orders with customer and products", async () => {
    const customer = await prisma.customer.create({
      data: {
        name: "Maria Silva",
        email: `list-orders-${Date.now()}@example.com`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Teclado para Listagem",
        price: "100.00",
        stock: 10,
      },
    });

    await app.inject({
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

    const response = await app.inject({
      method: "GET",
      url: "/orders",
    });

    expect(response.statusCode).toBe(200);

    const result = response.json();

    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerId: customer.id,
          customer: expect.objectContaining({
            name: "Maria Silva",
          }),
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: product.id,
              quantity: 2,
              product: expect.objectContaining({
                name: "Teclado para Listagem",
              }),
            }),
          ]),
        }),
      ]),
    );
  });
});

describe("GET /orders/:id", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should return an order with customer and products", async () => {
    const customer = await prisma.customer.create({
      data: {
        name: "Cliente Consulta",
        email: `get-order-${Date.now()}@example.com`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Produto Consulta",
        price: "75.00",
        stock: 10,
      },
    });

    const createResponse = await app.inject({
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

    expect(createResponse.statusCode).toBe(201);

    const createdOrder = createResponse.json();

    const response = await app.inject({
      method: "GET",
      url: `/orders/${createdOrder.id}`,
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      id: createdOrder.id,
      customerId: customer.id,
      customer: {
        name: "Cliente Consulta",
      },
      items: [
        {
          productId: product.id,
          quantity: 2,
          product: {
            name: "Produto Consulta",
          },
        },
      ],
    });
  });

  it("should return 404 when order does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/orders/pedido-inexistente",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      message: "Pedido não encontrado",
    });
  });

  it("should paginate orders", async () => {
    const customer = await prisma.customer.create({
      data: {
        name: "Cliente Paginação",
        email: `pagination-${Date.now()}@example.com`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Produto Paginação",
        price: "10.00",
        stock: 10,
      },
    });

    const orderIds: string[] = [];

    // Create two orders for pagination testing
    for (let i = 0; i < 2; i++) {
      const response = await app.inject({
        method: "POST",
        url: "/orders",
        payload: {
          customerId: customer.id,
          items: [{ productId: product.id, quantity: 1 }],
        },
      });

      expect(response.statusCode).toBe(201);
      orderIds.push(response.json().id);
    }

    const firstPage = await app.inject({
      method: "GET",
      url: "/orders?page=1&limit=1",
    });

    const secondPage = await app.inject({
      method: "GET",
      url: "/orders?page=2&limit=1",
    });

    expect(firstPage.statusCode).toBe(200);
    expect(secondPage.statusCode).toBe(200);

    const firstResult = firstPage.json();
    const secondResult = secondPage.json();

    expect(firstResult.data).toHaveLength(1);
    expect(secondResult.data).toHaveLength(1);
    expect(firstResult.data[0].id).not.toBe(secondResult.data[0].id);

    expect(firstResult.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: expect.any(Number),
    });

    expect(secondResult.pagination.page).toBe(2);
    expect(firstResult.pagination.totalPages).toBe(
      firstResult.pagination.total,
    );

    expect(orderIds).toContain(firstResult.data[0].id);
    expect(orderIds).toContain(secondResult.data[0].id);
  });
});

describe("PATCH /orders/:id/cancel", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  async function createTestOrder() {
    const customer = await prisma.customer.create({
      data: {
        name: "Cliente Cancelamento",
        email: `cancel-order-${Date.now()}-${Math.random()}@example.com`,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Produto Cancelamento",
        price: "50.00",
        stock: 10,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 2 }],
      },
    });

    expect(response.statusCode).toBe(201);

    return {
      order: response.json(),
      product,
    };
  }

  it("should cancel an order and restore stock", async () => {
    const { order, product } = await createTestOrder();

    const response = await app.inject({
      method: "PATCH",
      url: `/orders/${order.id}/cancel`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("CANCELLED");

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(updatedProduct?.stock).toBe(10);
  });

  it("should return 404 when order does not exist", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/orders/pedido-inexistente/cancel",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      message: "Pedido não encontrado",
    });
  });

  it("should not restore stock twice when order is already cancelled", async () => {
    const { order, product } = await createTestOrder();

    const firstResponse = await app.inject({
      method: "PATCH",
      url: `/orders/${order.id}/cancel`,
    });

    expect(firstResponse.statusCode).toBe(200);

    const secondResponse = await app.inject({
      method: "PATCH",
      url: `/orders/${order.id}/cancel`,
    });

    expect(secondResponse.statusCode).toBe(409);

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(updatedProduct?.stock).toBe(10);
  });

  it("should not cancel an order outside PENDING status", async () => {
    const { order } = await createTestOrder();

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });

    const response = await app.inject({
      method: "PATCH",
      url: `/orders/${order.id}/cancel`,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      message: "Pedido não pode ser cancelado neste status",
    });
  });
});
