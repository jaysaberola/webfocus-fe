import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicAlbum } from "@/services/publicPageService";
import { resolveStorageAssetUrl, resolveStorageAssetUrlWithFallback } from "@/lib/storageAssets";
import styles from "@/styles/mainbanner.module.css";

interface MainBannerProps {
  album: PublicAlbum;
}

const HOME_BANNER_VISIBILITY_STORAGE_KEY = "cms4.homeBanner.visibility.v1";
const HOME_BANNER_FONT_STORAGE_KEY = "cms4.homeBanner.fonts.v1";

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}
const WEB_DESIGN_SERVICES_URL = "/public/services?tab=webdesign";

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function resolveSecondaryBannerUrl(url: string, label: string) {
  const normalizedLabel = label.trim().toLowerCase();
  const isCustomPackages =
    normalizedLabel.includes("custom package") || normalizedLabel === "custom packages";

  if (isCustomPackages || !url || url === "#" || url === "/public/products") {
    return WEB_DESIGN_SERVICES_URL;
  }

  return url;
}

const DEFAULT_HERO_IMAGE = "/images/homescreenify-sA3wymYqyaI-unsplash.jpg";

function resolveSlideImage(banner: { image_url?: string; image_path?: string }) {
  const resolved =
    resolveStorageAssetUrl(banner.image_url) ||
    resolveStorageAssetUrl(banner.image_path);

  return resolved || DEFAULT_HERO_IMAGE;
}

function resolveSubtitle(banner: { alt?: string; title?: string }) {
  const alt = banner.alt?.trim();
  if (alt) return alt;

  const title = (banner.title ?? "").toLowerCase();
  if (title.includes("restaurant") || title.includes("place")) {
    return "Discover exceptional flavors, warm hospitality, and an unforgettable dining experience.";
  }

  return "Establish a powerhouse digital presence on Manila's lowest-latency hosting nodes to load your pages 3x faster than traditional foreign servers.";
}

export default function MainBanner({ album }: MainBannerProps) {
  const isVideoBanner = (banner: any) => {
    const mediaType = String(banner?.media_type ?? banner?.mediaType ?? "").toLowerCase();
    if (mediaType === "video") return true;
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(banner?.image_url ?? ""));
  };

  const toBoolean = (value: any): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1" || value === "true") return true;
    if (value === 0 || value === "0" || value === "false") return false;
    return undefined;
  };

  const toVisibleFromStatus = (value: any): boolean | undefined => {
    if (value == null) return undefined;
    const normalized = String(value).trim().toLowerCase();
    if (["published", "public", "active", "visible", "show"].includes(normalized)) return true;
    if (["private", "hidden", "inactive", "draft", "archived", "hide"].includes(normalized)) return false;
    return undefined;
  };

  const isBannerVisible = (banner: any): boolean => {
    const active = toBoolean(banner?.is_active ?? banner?.active);
    const hidden = toBoolean(banner?.is_hidden ?? banner?.hidden);
    const visibleByStatus = toVisibleFromStatus(banner?.status ?? banner?.visibility);
    if (typeof hidden === "boolean") return !hidden;
    if (typeof active === "boolean") return active;
    if (typeof visibleByStatus === "boolean") return visibleByStatus;
    return true;
  };

  const [visibilityOverrides, setVisibilityOverrides] = useState<
    Record<string, { is_active?: boolean }>
  >({});
  const [fontOverrides, setFontOverrides] = useState<Record<string, any>>({});

  useEffect(() => {
    setVisibilityOverrides(readJsonStorage(HOME_BANNER_VISIBILITY_STORAGE_KEY, {}));
    setFontOverrides(readJsonStorage(HOME_BANNER_FONT_STORAGE_KEY, {}));
  }, []);

  const banners = useMemo(() => {
    return (album.banners || []).filter((banner: any, index: number) => {
      const keyById = banner?.id ? `id:${banner.id}` : undefined;
      const keyByOrder = typeof banner?.order !== "undefined" ? `order:${banner.order}` : undefined;
      const keyByIndex = `index:${index}`;

      const local =
        (keyById ? visibilityOverrides[keyById] : undefined) ||
        (keyByOrder ? visibilityOverrides[keyByOrder] : undefined) ||
        visibilityOverrides[keyByIndex];

      if (typeof local?.is_active === "boolean") return local.is_active;
      return isBannerVisible(banner);
    });
  }, [album.banners, visibilityOverrides]);
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState<number | null>(null);

  const normalizeAnimationName = (value: any) => {
    if (!value) return "";
    const raw = String(value).trim();
    if (!raw) return "";
    return raw.replace(/^animate__/, "").replace(/[^a-zA-Z0-9_-]/g, "");
  };

  const transitionInClass = normalizeAnimationName(
    (album as any).transition_in_value ?? (album as any).transitionInValue
  );
  const transitionOutClass = normalizeAnimationName(
    (album as any).transition_out_value ?? (album as any).transitionOutValue
  );
  const animationDurationMs = 900;

  const goToBanner = (next: number) => {
    if (!banners.length || next === current) return;
    const outgoing = current;
    setExiting(outgoing);
    setCurrent(next);

    window.setTimeout(() => {
      setExiting((value) => (value === outgoing ? null : value));
    }, animationDurationMs);
  };

  const transitionSeconds = Number(album.transition);
  const interval = Number.isFinite(transitionSeconds) && transitionSeconds > 0
    ? transitionSeconds * 1000
    : 5000;

  useEffect(() => {
    if (!banners.length) return;

    const timer = setInterval(() => {
      goToBanner((current + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [banners.length, current, interval]);

  if (!banners.length) {
    return (
      <section className={styles.bannerWrap} aria-hidden="true">
        <div className={styles.bannerHero}>
          <div className={styles.bannerCard} />
        </div>
      </section>
    );
  }

  const banner = banners[current];
  const subtitleText = resolveSubtitle(banner);

  const buttonParts = (banner.button_text || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const urlParts = (banner.url || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  const primaryButtonText = buttonParts[0] || "";
  const secondaryButtonText = buttonParts[1] || "";
  const primaryButtonUrl = urlParts[0] || "";
  const secondaryButtonUrl = urlParts[1] || "";

  const resolvedPrimaryText = primaryButtonText || "CLICK TO SEE MORE";
  const resolvedSecondaryText = secondaryButtonText || "CUSTOM PACKAGES";
  const resolvedPrimaryUrl = primaryButtonUrl || secondaryButtonUrl || "#";
  const resolvedSecondaryUrl = resolveSecondaryBannerUrl(
    secondaryButtonUrl || primaryButtonUrl || "",
    resolvedSecondaryText
  );

  const overrideById = (banner as any)?.id ? fontOverrides[`id:${(banner as any).id}`] : undefined;
  const overrideByOrder = typeof (banner as any)?.order !== "undefined" ? fontOverrides[`order:${(banner as any).order}`] : undefined;
  const override = overrideById || overrideByOrder;

  const descriptionFont =
    (banner as any).description_font ??
    (banner as any).descriptionFont ??
    (banner as any).description_font_family ??
    (banner as any).descriptionFontFamily ??
    override?.description_font;
  const titleFont =
    (banner as any).title_font ??
    (banner as any).titleFont ??
    (banner as any).title_font_family ??
    (banner as any).titleFontFamily ??
    override?.title_font;
  const buttonFont =
    (banner as any).button_font ??
    (banner as any).buttonFont ??
    (banner as any).button_font_family ??
    (banner as any).buttonFontFamily ??
    override?.button_font;

  const titleFontSizeRaw =
    (banner as any).title_font_size ??
    (banner as any).titleFontSize ??
    (banner as any).title_size ??
    (banner as any).titleSize ??
    override?.title_font_size;
  const titleFontSize =
    typeof titleFontSizeRaw === "number"
      ? titleFontSizeRaw
      : typeof titleFontSizeRaw === "string" && titleFontSizeRaw.trim() !== ""
        ? Number(titleFontSizeRaw)
        : undefined;

  const titleBoldRaw =
    (banner as any).title_bold ??
    (banner as any).titleBold ??
    (banner as any).is_title_bold ??
    (banner as any).isTitleBold ??
    override?.title_bold;
  const titleBold =
    typeof titleBoldRaw === "boolean"
      ? titleBoldRaw
      : titleBoldRaw === 1 || titleBoldRaw === "1" || titleBoldRaw === "true"
        ? true
        : titleBoldRaw === 0 || titleBoldRaw === "0" || titleBoldRaw === "false"
          ? false
          : undefined;

  const descriptionFontSizeRaw =
    (banner as any).description_font_size ??
    (banner as any).descriptionFontSize ??
    (banner as any).description_size ??
    (banner as any).descriptionSize ??
    override?.description_font_size;
  const descriptionFontSize =
    typeof descriptionFontSizeRaw === "number"
      ? descriptionFontSizeRaw
      : typeof descriptionFontSizeRaw === "string" && descriptionFontSizeRaw.trim() !== ""
        ? Number(descriptionFontSizeRaw)
        : undefined;

  const descriptionBoldRaw =
    (banner as any).description_bold ??
    (banner as any).descriptionBold ??
    (banner as any).is_description_bold ??
    (banner as any).isDescriptionBold ??
    override?.description_bold;
  const descriptionBold =
    typeof descriptionBoldRaw === "boolean"
      ? descriptionBoldRaw
      : descriptionBoldRaw === 1 || descriptionBoldRaw === "1" || descriptionBoldRaw === "true"
        ? true
        : descriptionBoldRaw === 0 || descriptionBoldRaw === "0" || descriptionBoldRaw === "false"
          ? false
          : undefined;

  const buttonFontSizeRaw =
    (banner as any).button_font_size ??
    (banner as any).buttonFontSize ??
    (banner as any).button_size ??
    (banner as any).buttonSize ??
    override?.button_font_size;
  const buttonFontSize =
    typeof buttonFontSizeRaw === "number"
      ? buttonFontSizeRaw
      : typeof buttonFontSizeRaw === "string" && buttonFontSizeRaw.trim() !== ""
        ? Number(buttonFontSizeRaw)
        : undefined;

  const buttonBoldRaw =
    (banner as any).button_bold ??
    (banner as any).buttonBold ??
    (banner as any).is_button_bold ??
    (banner as any).isButtonBold ??
    override?.button_bold;
  const buttonBold =
    typeof buttonBoldRaw === "boolean"
      ? buttonBoldRaw
      : buttonBoldRaw === 1 || buttonBoldRaw === "1" || buttonBoldRaw === "true"
        ? true
        : buttonBoldRaw === 0 || buttonBoldRaw === "0" || buttonBoldRaw === "false"
          ? false
          : undefined;

  const titleStyle = titleFont
    ? ({
        fontFamily: titleFont,
        ...(typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
          ? { fontSize: Math.max(10, Math.min(120, titleFontSize)) }
          : {}),
        ...(typeof titleBold === "boolean" ? { fontWeight: titleBold ? 800 : 400 } : {}),
      } as const)
    : (
        typeof titleFontSize === "number" || typeof titleBold === "boolean"
          ? ({
              ...(typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
                ? { fontSize: Math.max(10, Math.min(120, titleFontSize)) }
                : {}),
              ...(typeof titleBold === "boolean" ? { fontWeight: titleBold ? 800 : 400 } : {}),
            } as const)
          : undefined
      );

  const subtitleStyle =
    descriptionFont || typeof descriptionFontSize === "number" || typeof descriptionBold === "boolean"
      ? ({
          ...(descriptionFont ? { fontFamily: descriptionFont } : {}),
          ...(typeof descriptionFontSize === "number" && Number.isFinite(descriptionFontSize)
            ? { fontSize: Math.max(10, Math.min(120, descriptionFontSize)) }
            : {}),
          ...(typeof descriptionBold === "boolean" ? { fontWeight: descriptionBold ? 600 : 400 } : {}),
        } as const)
      : undefined;

  const primaryButtonStyle =
    buttonFont || typeof buttonFontSize === "number" || typeof buttonBold === "boolean"
      ? ({
          ...(buttonFont ? { fontFamily: buttonFont } : {}),
          ...(typeof buttonFontSize === "number" && Number.isFinite(buttonFontSize)
            ? { fontSize: Math.max(10, Math.min(120, buttonFontSize)) }
            : {}),
          ...(typeof buttonBold === "boolean" ? { fontWeight: buttonBold ? 800 : 400 } : {}),
        } as const)
      : undefined;

  const secondaryButtonStyle = buttonFont || typeof buttonFontSize === "number" || typeof buttonBold === "boolean"
    ? ({
        ...(buttonFont ? { fontFamily: buttonFont } : {}),
        ...(typeof buttonFontSize === "number" && Number.isFinite(buttonFontSize)
          ? { fontSize: Math.max(10, Math.min(120, buttonFontSize)) }
          : {}),
        ...(typeof buttonBold === "boolean" ? { fontWeight: buttonBold ? 700 : 400 } : {}),
      } as const)
    : undefined;

  return (
    <section className={styles.bannerWrap}>
      <div className={styles.bannerHero}>
        <div className={styles.bannerCard}>
      {/* SLIDER STRIP */}
      <div className={styles.sliderStrip}>
        {banners.map((banner, index) => {
          const isActive = index === current;
          const isExiting = index === exiting;
          const animationClass = isExiting
            ? transitionOutClass
            : isActive
              ? transitionInClass
              : "";

          return (
            <div
              key={banner.id ?? index}
              className={[
                styles.slide,
                isActive ? styles.slideActive : "",
                isActive && index === 0 ? styles.slideActivePrimary : "",
                isExiting ? styles.slideExiting : "",
                animationClass && index !== 0 ? "animate__animated" : "",
                animationClass && index !== 0 ? `animate__${animationClass}` : "",
              ].filter(Boolean).join(" ")}
              style={{
                ["--animate-duration" as any]: `${animationDurationMs}ms`,
              }}
            >
              {isVideoBanner(banner) ? (
                <video
                  className={styles.slideVideo}
                  src={resolveStorageAssetUrlWithFallback(banner.image_url || banner.image_path, DEFAULT_HERO_IMAGE)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload={index === 0 ? "auto" : "metadata"}
                />
              ) : (
                <img
                  src={resolveSlideImage(banner)}
                  alt=""
                  className={styles.slideImage}
                  width={1920}
                  height={1080}
                  sizes="100vw"
                  fetchPriority={index === 0 && isActive ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding={index === 0 ? "sync" : "async"}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* overlay */}
      <div className={styles.overlay} />

      {/* CONTENT */}
      <div className={styles.content}>
        <div className={styles.inner}>
          {banner.title && (
            <h1 className={styles.title} style={titleStyle}>
              {banner.title}
            </h1>
          )}

          {subtitleText && (
            <p className={styles.subtitle} style={subtitleStyle}>
              {subtitleText}
            </p>
          )}

          <div className={styles.ctaRow}>
            {isInternalHref(resolvedPrimaryUrl) ? (
              <Link
                href={resolvedPrimaryUrl}
                className={styles.ctaPrimary}
                style={primaryButtonStyle}
              >
                {resolvedPrimaryText}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <a href={resolvedPrimaryUrl} className={styles.ctaPrimary} style={primaryButtonStyle}>
                {resolvedPrimaryText}
                <span aria-hidden="true">→</span>
              </a>
            )}

            {isInternalHref(resolvedSecondaryUrl) ? (
              <Link
                href={resolvedSecondaryUrl}
                className={styles.ctaSecondary}
                style={secondaryButtonStyle}
              >
                {resolvedSecondaryText}
              </Link>
            ) : (
              <a
                href={resolvedSecondaryUrl}
                className={styles.ctaSecondary}
                style={secondaryButtonStyle}
              >
                {resolvedSecondaryText}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* dots */}
      {banners.length > 1 && (
        <div className={styles.dots}>
          {banners.map((_, index) => (
            <span
              key={index}
              onClick={() => goToBanner(index)}
              className={`${styles.dot} ${index === current ? " " + styles.active : ""}`}
            />
          ))}
        </div>
      )}
      </div>
      </div>
    </section>
  );
}
