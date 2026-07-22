import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { ADMIN_FONT_HREF, ADMIN_STYLESHEETS, isAdminSiteRoute } from "@/lib/adminRoute";
import { isPublicSiteRoute } from "@/lib/freshchatConfig";

type CustomDocumentProps = DocumentInitialProps & {
  isPublicRoute: boolean;
  isAdminRoute: boolean;
};

export default function CustomDocument({ isPublicRoute, isAdminRoute }: CustomDocumentProps) {
  return (
    <Html lang="en">
      <Head>
        {isPublicRoute && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=optional"
              rel="stylesheet"
            />
            <link rel="stylesheet" href="/css/public-css.css" />
            <link rel="stylesheet" href="/css/custom.css" />
            <link rel="stylesheet" href="/css/product.css" />
            <link rel="stylesheet" href="/css/banner.css" />
            <link rel="stylesheet" href="/css/navigation.css" />
            <link rel="stylesheet" href="/css/public-overrides.css" />
          </>
        )}
        {isAdminRoute && (
          <>
            {ADMIN_STYLESHEETS.map((href) => (
              <link key={href} rel="stylesheet" href={href} />
            ))}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={ADMIN_FONT_HREF} rel="stylesheet" />
          </>
        )}
      </Head>
      <body>
        {isPublicRoute ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{if(localStorage.getItem("webfocus.publicConsent.v1")!=="1"){document.documentElement.classList.add("needs-privacy-consent");}}catch(e){}})();`,
            }}
          />
        ) : null}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

CustomDocument.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await Document.getInitialProps(ctx);
  const pathname = ctx.pathname || "";

  return {
    ...initialProps,
    isPublicRoute: isPublicSiteRoute(pathname),
    isAdminRoute: isAdminSiteRoute(pathname),
  };
};
