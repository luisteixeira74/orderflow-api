import { useEffect, useState } from "react";
import { OrdersTable } from "./components/OrdersTable";
import "./App.css";

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

type OrderResponse = {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:3000/orders?page=${page}&limit=10`,
        );

        if (!response.ok) {
          throw new Error("Não foi possível carregar os pedidos.");
        }

        const result: OrderResponse = await response.json();

        setOrders(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch {
        setError(
          "Erro ao conectar à API. Verifique se o backend está rodando.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [page]);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>OrderFlow</h1>
          <p>Gestão de pedidos</p>
        </div>

        <span className="api-status">API conectada</span>
      </header>

      <main className="content">
        <div className="page-heading">
          <div>
            <h2>Acompanhe e gerencie seus pedidos</h2>
          </div>
        </div>

        <section className="orders-card">
          <div className="orders-card-header">
            <h3>Total de pedidos</h3>
            <span>{total} pedido(s)</span>
          </div>

          {loading && <p className="feedback">Carregando pedidos...</p>}

          {!loading && error && <p className="feedback error">{error}</p>}

          {!loading && !error && orders.length === 0 && (
            <div className="empty-state">
              <h3>Nenhum pedido encontrado</h3>
              <p>Quando houver pedidos cadastrados, eles aparecerão aqui.</p>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <>
              <div className="table-wrapper">
                <OrdersTable
                  orders={orders}
                  onSelectOrder={(orderId) => {
                    console.log("Pedido selecionado:", orderId);
                  }}
                />
              </div>

              <div className="pagination">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </button>

                <span>
                  Página {page} de {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
