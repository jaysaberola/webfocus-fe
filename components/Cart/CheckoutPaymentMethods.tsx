import {
  PAYNAMICS_PAYMENT_GROUPS,
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
        <span className={styles.paymentGatewayBadge}>Paynamics</span>
      </div>
      <p className={styles.paymentBlockHint}>
        Choose a Paynamics option. You can still confirm the provider on the Paynamics page.
      </p>
      <div className={styles.paymentMethodList} role="radiogroup" aria-label="Payment method">
        {PAYNAMICS_PAYMENT_GROUPS.map((group) => {
          const hideGroupTitle = group.methods.length === 1 && group.methods[0].label === group.label;
          return (
            <div key={group.id} className={styles.paymentMethodGroup}>
              {hideGroupTitle ? null : <p className={styles.paymentMethodGroupTitle}>{group.label}</p>}
              {group.methods.map((method) => (
                <PaymentMethodOption
                  key={method.id}
                  method={method}
                  checked={value === method.id}
                  onSelect={() => onChange(method.id)}
                />
              ))}
            </div>
          );
        })}
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
