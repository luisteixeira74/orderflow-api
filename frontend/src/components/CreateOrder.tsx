import { useEffect, useState } from "react";

type Customer = {
  id: string;
  name: string;
  email: string;
};

type Product = {
  id: string;
  name: string;
  price: string | number;
  stock: number;
};

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type CreateOrderProps = {
  onBack: () => void;
  onCreated: () => void;
};

const API_URL = "http://localhost:3000";

export function CreateOrder({ onBack, onCreated }: CreateOrderProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<OrderItemInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [customersResponse, productsResponse] = await Promise.all([
          fetch(`${API_URL}/customers`),
          fetch(`${API_URL}/products`),
        ]);

        if (!customersResponse.ok || !productsResponse.ok) {
          throw new Error("Não foi possível carregar clientes e produtos.");
        }

        const [customersData, productsData] = await Promise.all([
          customersResponse.json(),
          productsResponse.json(),
        ]);

        setCustomers(customersData);
        setProducts(productsData);
      } catch {
        setError("Erro ao carregar clientes e produtos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  function addItem() {
    setError("");

    if (!productId) {
      setError("Selecione um produto.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("A quantidade deve ser um número inteiro maior que zero.");
      return;
    }

    const product = products.find((item) => item.id === productId);

    if (!product) {
      setError("Produto não encontrado.");
      return;
    }

    const currentQuantity = items
      .filter((item) => item.productId === productId)
      .reduce((total, item) => total + item.quantity, 0);

    if (currentQuantity + quantity > product.stock) {
      setError(`Estoque insuficiente para ${product.name}.`);
      return;
    }

    setItems((current) => {
      const existingItem = current.find((item) => item.productId === productId);

      if (existingItem) {
        return current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...current, { productId, quantity }];
    });

    setProductId("");
    setQuantity(1);
  }

  function removeItem(productIdToRemove: string) {
    setItems((current) =>
      current.filter((item) => item.productId !== productIdToRemove),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!customerId) {
      setError("Selecione um cliente.");
      return;
    }

    if (items.length === 0) {
      setError("Adicione pelo menos um produto ao pedido.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          items,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message ?? "Não foi possível criar o pedido.");
      }

      onCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao criar o pedido.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);

    return sum + Number(product?.price ?? 0) * item.quantity;
  }, 0);

  if (loading) {
    return <p>Carregando clientes e produtos...</p>;
  }

  return (
    <section className="create-order">
      <div className="create-order-header">
        <div>
          <h2>Criar pedido</h2>
          <p>Selecione o cliente e adicione os produtos.</p>
        </div>

        <button type="button" onClick={onBack}>
          Voltar
        </button>
      </div>

      {error && <p className="form-message error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="customer">Cliente</label>
          <select
            id="customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            required
          >
            <option value="">Selecione um cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} — {customer.email}
              </option>
            ))}
          </select>
        </div>

        <div className="add-order-item">
          <div className="form-field">
            <label htmlFor="product">Produto</label>
            <select
              id="product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — R${" "}
                  {Number(product.price).toFixed(2).replace(".", ",")} (
                  estoque: {product.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field quantity-field">
            <label htmlFor="quantity">Quantidade</label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>

          <button type="button" onClick={addItem}>
            Adicionar item
          </button>
        </div>

        <h3>Itens do pedido</h3>

        {items.length === 0 ? (
          <p>Nenhum produto adicionado.</p>
        ) : (
          <div className="table-wrapper">
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Preço unitário</th>
                  <th>Subtotal</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);

                  if (!product) return null;

                  const price = Number(product.price);

                  return (
                    <tr key={item.productId}>
                      <td>{product.name}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td>
                        {(price * item.quantity).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="order-total">
          <strong>
            Total:{" "}
            {total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </strong>
        </div>

        <button
          type="submit"
          disabled={
            submitting || customers.length === 0 || products.length === 0
          }
        >
          {submitting ? "Criando pedido..." : "Criar pedido"}
        </button>
      </form>
    </section>
  );
}
