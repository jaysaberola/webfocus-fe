import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";

type CustomDocumentProps = DocumentInitialProps & {
  isPublicRoute: boolean;
};

function isPublicSiteRoute(pathname: string) {
  return (
    pathname.startsWith("/public") ||
    pathname.startsWith("/news/preview") ||
    pathname.startsWith("/pages/preview")
  );
}

export default function CustomDocument({ isPublicRoute }: CustomDocumentProps) {
  return (
    <Html lang="en">
      <Head>
        {isPublicRoute && (
          <>
            <link rel="stylesheet" href="/css/public-css.css" />
            <link rel="stylesheet" href="/css/custom.css" />
            <link rel="stylesheet" href="/css/product.css" />
            <link rel="stylesheet" href="/css/banner.css" />
            <link rel="stylesheet" href="/css/navigation.css" />
            <link rel="stylesheet" href="/css/public-overrides.css" />
          </>
        )}
      </Head>
      <body>
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
  };
};
