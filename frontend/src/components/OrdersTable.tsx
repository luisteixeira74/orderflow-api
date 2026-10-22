import { OrderStatusBadge } from "./OrderStatusBadge";

type Order = {
  id: string;
  status: string;
  total: string | number;
  createdAt: string;
  customer: {
    name: string;
  };
  items: {
    quantity: number;
  }[];
};

type OrdersTableProps = {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
};

export function OrdersTable({ orders, onSelectOrder }: OrdersTableProps) {
  {
    return (
      <table className="orders-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Itens</th>
            <th>Total</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <button
                  type="button"
                  className="order-link"
                  onClick={() => onSelectOrder(order.id)}
                  title={order.id}
                >
                  {order.id.slice(0, 8)}
                </button>
              </td>
              <td>{order.customer.name}</td>
              <td>
                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
              <td>
                {Number(order.total).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              <td>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
