import { useEffect, useState } from "react";
import { OrdersTable } from "./components/OrdersTable";
import { OrderDetails } from "./components/OrderDetails";
import { CreateOrder } from "./components/CreateOrder";
import { OrderFlowLogo } from "./components/OrderFlowLogo";
import { OrderFilters } from "./components/OrderFilters";
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
        });

        if (search) params.set("search", search);
        if (status) params.set("status", status);

        const response = await fetch(
          `http://localhost:3000/orders?${params.toString()}`,
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
  }, [page, refreshKey, search, status]);

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>
            <OrderFlowLogo />
          </h1>
          <p>Gestão de pedidos</p>
        </div>

        <span className="api-status">API conectada</span>
      </header>

      <main className="content">
        {successMessage && (
          <p className="form-message success" role="status">
            {successMessage}
          </p>
        )}

        <div className="page-heading">
          <div>
            <h2>Acompanhe e gerencie seus pedidos</h2>
          </div>

          {!showCreateOrder && (
            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(null);
                setShowCreateOrder(true);
              }}
            >
              + Criar pedido
            </button>
          )}
        </div>

        <section className="orders-card">
          {showCreateOrder ? (
            <CreateOrder
              onBack={() => setShowCreateOrder(false)}
              onCreated={() => {
                setSuccessMessage("Pedido criado com sucesso!");
                setShowCreateOrder(false);
                setSelectedOrderId(null);
                setPage(1);
                setRefreshKey((current) => current + 1);
              }}
            />
          ) : selectedOrderId !== null ? (
            <OrderDetails
              orderId={selectedOrderId}
              onBack={() => setSelectedOrderId(null)}
            />
          ) : (
            <>
              <div className="orders-card-header">
                <h3>Total de pedidos</h3>
                <span>{total} pedido(s)</span>
              </div>

              <OrderFilters
                searchInput={searchInput}
                status={status}
                onSearchInputChange={setSearchInput}
                onSearch={() => {
                  setPage(1);
                  setSearch(searchInput.trim());
                }}
                onStatusChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                onClear={() => {
                  setSearchInput("");
                  setSearch("");
                  setStatus("");
                  setPage(1);
                }}
              />

              {loading && <p className="feedback">Carregando pedidos...</p>}

              {!loading && error && <p className="feedback error">{error}</p>}

              {!loading && !error && orders.length === 0 && (
                <div className="empty-state">
                  <h3>Nenhum pedido encontrado</h3>
                  <p>Tente alterar os filtros ou criar um novo pedido.</p>
                </div>
              )}

              {!loading && !error && orders.length > 0 && (
                <>
                  <div className="table-wrapper">
                    <OrdersTable
                      orders={orders}
                      onSelectOrder={setSelectedOrderId}
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
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
