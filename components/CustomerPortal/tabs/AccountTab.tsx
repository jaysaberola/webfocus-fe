import { PublicCustomer } from "@/services/publicCustomerService";
import AccountProfileSection from "../account/AccountProfileSection";
import AccountPasswordSection from "../account/AccountPasswordSection";
import AccountTwoFactorSection from "../account/AccountTwoFactorSection";
import AccountSessionsSection from "../account/AccountSessionsSection";
import styles from "@/styles/customerPortal.module.css";

type Props = {
  customer: PublicCustomer | null;
  onCustomerUpdate?: (customer: PublicCustomer) => void;
};

export default function AccountTab({ customer, onCustomerUpdate }: Props) {
  return (
    <div className={`${styles.tabStack} ${styles.accountTab}`}>
      <AccountProfileSection customer={customer} onCustomerUpdate={onCustomerUpdate} />
      <AccountPasswordSection />
      <AccountTwoFactorSection />
      <AccountSessionsSection />
    </div>
  );
}
