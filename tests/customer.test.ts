import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { buildApp } from "../src/app.js";

describe("POST /customers", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should return 400 when the request body is invalid", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/customers",
      payload: {
        name: "J",
        email: "email-invalido",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      message: "Invalid request body",
    });
  });

  it("should create a customer", async () => {
    const email = `teste-${Date.now()}@example.com`;

    const response = await app.inject({
      method: "POST",
      url: "/customers",
      payload: {
        name: "Maria Silva",
        email,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      name: "Maria Silva",
      email,
    });
  });

  it("should return 409 when the email already exists", async () => {
    const email = `duplicado-${Date.now()}@example.com`;

    const firstResponse = await app.inject({
      method: "POST",
      url: "/customers",
      payload: {
        name: "Maria Silva",
        email,
      },
    });

    expect(firstResponse.statusCode).toBe(201);

    const secondResponse = await app.inject({
      method: "POST",
      url: "/customers",
      payload: {
        name: "Maria Silva",
        email,
      },
    });

    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toMatchObject({
      message: "E-mail já cadastrado",
    });
  });
});
