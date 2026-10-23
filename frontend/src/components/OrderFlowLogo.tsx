export function OrderFlowLogo() {
  return (
    <div className="orderflow-logo" aria-label="OrderFlow">
      <span className="orderflow-logo-text">Order</span>

      <svg className="orderflow-logo-f" viewBox="0 0 40 44" aria-hidden="true">
        <path className="orderflow-logo-letter" d="M8 40 V5 H34" />

        <path className="orderflow-logo-wave" d="M8 23 H35" />
      </svg>

      <span className="orderflow-logo-text">low</span>
    </div>
  );
}
