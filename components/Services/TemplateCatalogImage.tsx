import { useEffect, useRef, useState } from "react";
import styles from "@/styles/services.module.css";

type TemplateCatalogImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  showPreviewHint?: boolean;
};

export default function TemplateCatalogImage({
  src,
  alt,
  priority = false,
  showPreviewHint = true,
}: TemplateCatalogImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);

    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div className={styles.templateCatalogImageWrap}>
      {!loaded && !failed ? <span className={styles.templateCatalogImageSkeleton} aria-hidden="true" /> : null}
      {!failed ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={400}
          height={260}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "low"}
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
      {showPreviewHint ? <span className={styles.templateCatalogPreview}>Preview</span> : null}
    </div>
  );
}
