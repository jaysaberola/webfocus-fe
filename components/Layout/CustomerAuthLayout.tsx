import Head from "next/head";
import ToastHost from "@/components/UI/ToastHost";

type CustomerAuthLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export default function CustomerAuthLayout({ children, title = "Account" }: CustomerAuthLayoutProps) {
  return (
    <>
      <Head>
        <title>{title} | WebFocus Solutions, Inc.</title>
      </Head>
      {children}
      <ToastHost />
    </>
  );
}
