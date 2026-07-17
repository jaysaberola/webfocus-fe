import LandingPageLayout from "@/components/Layout/GuestLayout";
import ServicesPage from "@/components/Services/ServicesPage";
import { getPublicPageBySlug } from "@/services/publicPageService";

type Props = {
  pageData?: any;
};

export default function ServicesPublicPage(_props: Props) {
  return <ServicesPage />;
}

export async function getServerSideProps() {
  try {
    const res = await getPublicPageBySlug("services");
    return {
      props: {
        pageData: res.data,
        layout: { fullWidth: true, hideBanner: true },
      },
    };
  } catch {
    return {
      props: {
        pageData: { slug: "services", title: "Services" },
        layout: { fullWidth: true, hideBanner: true },
      },
    };
  }
}

ServicesPublicPage.Layout = LandingPageLayout;
