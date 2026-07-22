import LandingPageLayout from "@/components/Layout/GuestLayout";
import ServicesPage, { resolveServiceTabFromQuery } from "@/components/Services/ServicesPage";
import { getPublicPageBySlug } from "@/services/publicPageService";
import type { GetServerSidePropsContext } from "next";

type Props = {
  pageData?: any;
  initialTab?: ReturnType<typeof resolveServiceTabFromQuery>;
};

export default function ServicesPublicPage({ initialTab }: Props) {
  return <ServicesPage initialTab={initialTab} />;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const initialTab = resolveServiceTabFromQuery(context.query.tab);
  try {
    const res = await getPublicPageBySlug("services");
    return {
      props: {
        pageData: res.data,
        initialTab,
        layout: { fullWidth: true, hideBanner: true },
      },
    };
  } catch {
    return {
      props: {
        pageData: { slug: "services", title: "Services" },
        initialTab,
        layout: { fullWidth: true, hideBanner: true },
      },
    };
  }
}

ServicesPublicPage.Layout = LandingPageLayout;
