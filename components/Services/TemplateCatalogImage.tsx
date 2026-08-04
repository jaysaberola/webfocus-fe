import { useState } from "react";
import styles from "@/styles/services.module.css";

type TemplateCatalogImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

export default function TemplateCatalogImage({ src, alt, priority = false }: TemplateCatalogImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={styles.templateCatalogImageWrap}>
      {!loaded && !failed ? <span className={styles.templateCatalogImageSkeleton} aria-hidden="true" /> : null}
      {!failed ? (
        <img
          src={src}
          alt={alt}
          width={400}
          height={260}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`${styles.templateCatalogImage} ${loaded ? styles.templateCatalogImageLoaded : ""}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
        />
      ) : (
        <div className={styles.templateCatalogImageFallback} aria-hidden="true">
          <i className="fa-solid fa-image" />
        </div>
      )}
      <span className={styles.templateCatalogPreview}>Preview</span>
    </div>
  );
}
