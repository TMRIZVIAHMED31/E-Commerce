export default function CartLogo({ className = '' }) {
  return (
    <span className={`cart-logo ${className}`.trim()} aria-hidden="true">
      <span className="cart-logo-handle" />
      <span className="cart-logo-basket" />
      <span className="cart-logo-wheel cart-logo-wheel-left" />
      <span className="cart-logo-wheel cart-logo-wheel-right" />
    </span>
  );
}
