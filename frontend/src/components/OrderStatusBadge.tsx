type OrderStatusBadgeProps = {
  status: string;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparação",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Em entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const label = statusLabels[status] ?? status;

  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {label}
    </span>
  );
}
