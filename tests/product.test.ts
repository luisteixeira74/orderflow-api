import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { buildApp } from "../src/app.js";

describe("Products API", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  async function createTestProduct() {
    const response = await app.inject({
      method: "POST",
      url: "/products",
      payload: {
        name: "Teclado",
        description: "Teclado mecânico",
        price: 199.9,
        stock: 10,
      },
    });

    expect(response.statusCode).toBe(201);

    return response.json() as {
      id: string;
      name: string;
      description: string;
      price: string;
      stock: number;
    };
  }

  it("should return 400 when the request body is invalid", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/products",
      payload: {
        name: "X",
        price: -10,
        stock: -1,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should create a product", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/products",
      payload: {
        name: "Mouse",
        price: 89.9,
        stock: 20,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      name: "Mouse",
      price: "89.9",
      stock: 20,
    });
  });

  it("should list products", async () => {
    await createTestProduct();

    const response = await app.inject({
      method: "GET",
      url: "/products",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Teclado",
          stock: 10,
        }),
      ]),
    );
  });

  it("should return a product by ID", async () => {
    const product = await createTestProduct();

    const response = await app.inject({
      method: "GET",
      url: `/products/${product.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: product.id,
      name: "Teclado",
    });
  });

  it("should return 404 when the product does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/products/id-inexistente",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      message: "Produto não encontrado",
    });
  });

  it("should update a product", async () => {
    const product = await createTestProduct();

    const response = await app.inject({
      method: "PUT",
      url: `/products/${product.id}`,
      payload: {
        price: 249.9,
        stock: 5,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: "Produto atualizado com sucesso",
    });

    const updatedResponse = await app.inject({
      method: "GET",
      url: `/products/${product.id}`,
    });

    expect(updatedResponse.statusCode).toBe(200);
    expect(updatedResponse.json()).toMatchObject({
      id: product.id,
      name: "Teclado",
      price: "249.9",
      stock: 5,
    });
  });

  it("should return 404 when updating a product that does not exist", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/products/id-inexistente",
      payload: {
        price: 100,
      },
    });

    expect(response.statusCode).toBe(404);
  });
});
