import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: string | number;
  product: {
    name: string;
  };
};

type Order = {
  id: string;
  status: string;
  total: string | number;
  createdAt: string;
  customer: {
    name: string;
  };
  items: OrderItem[];
};

type OrderDetailsProps = {
  orderId: string;
  onBack: () => void;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PENDING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmado",
  IN_PREPARATION: "Em preparação",
  PREPARING: "Em preparação",
  READY_FOR_DELIVERY: "Pronto para entrega",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function OrderDetails({ orderId, onBack }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      setError("");
      setOrder(null);

      try {
        const response = await fetch(`http://localhost:3000/orders/${orderId}`);

        if (!response.ok) {
          throw new Error("Não foi possível carregar o pedido.");
        }

        const result = await response.json();
        setOrder(result.data ?? result);
      } catch {
        setError(
          "Erro ao carregar o pedido. Verifique a API e tente novamente.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  const statusClass = order?.status.toLowerCase().replaceAll("_", "-") ?? "";

  return (
    <section className="order-details">
      <button type="button" className="order-back-button" onClick={onBack}>
        ← Voltar para pedidos
      </button>

      {loading && <p className="feedback">Carregando detalhes...</p>}

      {!loading && error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && order && (
        <>
          <div className="order-details-header">
            <div>
              <h2>Detalhes do pedido</h2>
              <p className="order-id">ID: {order.id}</p>
            </div>

            <span className={`status-badge status-${statusClass}`}>
              {statusLabels[order.status] ?? order.status}
            </span>
          </div>

          <div className="order-info">
            <div className="order-info-item">
              <span>Cliente</span>
              <strong>{order.customer.name}</strong>
            </div>

            <div className="order-info-item">
              <span>Data do pedido</span>
              <strong>
                {new Date(order.createdAt).toLocaleString("pt-BR")}
              </strong>
            </div>
          </div>

          <div className="order-items">
            <h3>Itens do pedido</h3>

            <div className="table-wrapper">
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th className="numeric">Qtd.</th>
                    <th className="numeric">Preço unitário</th>
                    <th className="numeric">Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product.name}</td>
                      <td className="numeric">{item.quantity}</td>
                      <td className="numeric">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="numeric">
                        {formatCurrency(Number(item.unitPrice) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="order-total">
              <span>Total do pedido</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
