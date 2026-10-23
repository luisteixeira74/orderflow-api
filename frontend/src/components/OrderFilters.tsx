type OrderFiltersProps = {
  searchInput: string;
  status: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
};

export function OrderFilters({
  searchInput,
  status,
  onSearchInputChange,
  onSearch,
  onStatusChange,
  onClear,
}: OrderFiltersProps) {
  return (
    <form
      className="order-filters"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <input
        type="text"
        placeholder="Buscar por ID ou cliente..."
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
      />

      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        <option value="">Todos os status</option>
        <option value="PENDING">Pendente</option>
        <option value="PENDING_PAYMENT">Aguardando pagamento</option>
        <option value="CONFIRMED">Confirmado</option>
        <option value="IN_PREPARATION">Em preparação</option>
        <option value="READY_FOR_DELIVERY">Pronto para entrega</option>
        <option value="OUT_FOR_DELIVERY">Saiu para entrega</option>
        <option value="DELIVERED">Entregue</option>
        <option value="CANCELLED">Cancelado</option>
      </select>

      <button type="submit">Buscar</button>

      <button type="button" onClick={onClear}>
        Limpar
      </button>
    </form>
  );
}
