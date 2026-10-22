type Order = {
  id: string;
  status: string;
};

export function OrderDetails({ order }: { order: Order }) {
  {
    return (
      <div className="order-details">
        <h2>Detalhes do Pedido</h2>
        <p>{order.id}</p>
      </div>
    );
  }
}
