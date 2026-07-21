import {
  PAYNAMICS_PAYMENT_METHODS,
  type PaynamicsPaymentMethod,
} from "@/lib/checkoutPaymentMethods";
import styles from "@/styles/publicCartCheckout.module.css";

type CheckoutPaymentMethodsProps = {
  value: string;
  onChange: (methodId: string) => void;
};

export default function CheckoutPaymentMethods({ value, onChange }: CheckoutPaymentMethodsProps) {
  return (
    <div className={styles.paymentBlock}>
      <div className={styles.paymentBlockHead}>
        <p className={styles.paymentBlockTitle}>Payment Method</p>
        <span className={styles.paymentGatewayBadge}>Paynamics IPG</span>
      </div>
      <p className={styles.paymentBlockHint}>
        Choose how you want to pay. You will be redirected to Paynamics to complete payment securely.
      </p>
      <div className={styles.paymentMethodList} role="radiogroup" aria-label="Payment method">
        {PAYNAMICS_PAYMENT_METHODS.map((method) => (
          <PaymentMethodOption
            key={method.id}
            method={method}
            checked={value === method.id}
            onSelect={() => onChange(method.id)}
          />
        ))}
      </div>
    </div>
  );
}

type PaymentMethodOptionProps = {
  method: PaynamicsPaymentMethod;
  checked: boolean;
  onSelect: () => void;
};

function PaymentMethodOption({ method, checked, onSelect }: PaymentMethodOptionProps) {
  return (
    <label className={`${styles.paymentMethodOption} ${checked ? styles.paymentMethodOptionActive : ""}`}>
      <input
        type="radio"
        name="checkout-payment-method"
        value={method.id}
        checked={checked}
        onChange={onSelect}
      />
      <span className={styles.paymentMethodIcon} aria-hidden="true">
        <i className={method.icon} />
      </span>
      <span className={styles.paymentMethodCopy}>
        <strong>{method.label}</strong>
        <span>{method.description}</span>
      </span>
    </label>
  );
}
