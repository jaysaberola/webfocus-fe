import { useEffect, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";
import styles from "@/styles/mainbanner.module.css";

interface MainBannerProps {
  album: PublicAlbum;
}

export default function MainBanner({ album }: MainBannerProps) {
  const HOME_BANNER_VISIBILITY_STORAGE_KEY = "cms4.homeBanner.visibility.v1";
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

  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, { is_active?: boolean }>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HOME_BANNER_VISIBILITY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setVisibilityOverrides(parsed as Record<string, { is_active?: boolean }>);
      }
    } catch {
      // ignore
    }
  }, []);

  const banners = (album.banners || []).filter((banner: any, index: number) => {
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
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState<number | null>(null);
  const [fontOverrides, setFontOverrides] = useState<Record<string, any>>({});

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cms4.homeBanner.fonts.v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setFontOverrides(parsed as Record<string, any>);
      }
    } catch {
      // ignore
    }
  }, []);

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

  if (!banners.length) return null;

  const banner = banners[current];
  const hasCustomScriptText = Boolean(banner.description?.trim());
  const scriptText = hasCustomScriptText ? banner.description!.trim() : "Welcome to";
  const isWelcomeScript = ["welcome", "welcome to"].includes(scriptText.toLowerCase());

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

  const scriptStyle =
    hasCustomScriptText &&
    !isWelcomeScript &&
    (descriptionFont || typeof descriptionFontSize === "number" || typeof descriptionBold === "boolean")
      ? ({
          ...(descriptionFont ? { fontFamily: descriptionFont } : {}),
          ...(typeof descriptionFontSize === "number" && Number.isFinite(descriptionFontSize)
            ? { fontSize: Math.max(10, Math.min(120, descriptionFontSize)) }
            : {}),
          ...(typeof descriptionBold === "boolean" ? { fontWeight: descriptionBold ? 700 : 400 } : {}),
        } as const)
      : undefined;
  const titleStyle = titleFont
    ? ({
        fontFamily: titleFont,
        ...(typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
          ? { fontSize: Math.max(10, Math.min(120, titleFontSize)) }
          : {}),
        ...(typeof titleBold === "boolean" ? { fontWeight: titleBold ? 900 : 400 } : {}),
      } as const)
    : (
        typeof titleFontSize === "number" || typeof titleBold === "boolean"
          ? ({
              ...(typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
                ? { fontSize: Math.max(10, Math.min(120, titleFontSize)) }
                : {}),
              ...(typeof titleBold === "boolean" ? { fontWeight: titleBold ? 900 : 400 } : {}),
            } as const)
          : undefined
      );
  const buttonStyle =
    buttonFont || typeof buttonFontSize === "number" || typeof buttonBold === "boolean"
      ? ({
          ...(buttonFont ? { fontFamily: buttonFont } : {}),
          ...(typeof buttonFontSize === "number" && Number.isFinite(buttonFontSize)
            ? { fontSize: Math.max(10, Math.min(120, buttonFontSize)) }
            : {}),
          ...(typeof buttonBold === "boolean" ? { fontWeight: buttonBold ? 800 : 400 } : {}),
        } as const)
      : undefined;

  return (
    <>
      <section className={styles.bannerSection}>
      {/* 🖼 SLIDER STRIP */}
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
                isExiting ? styles.slideExiting : "",
                animationClass ? "animate__animated" : "",
                animationClass ? `animate__${animationClass}` : "",
              ].filter(Boolean).join(" ")}
              style={{
                ...(isVideoBanner(banner) ? {} : { backgroundImage: `url(${banner.image_url})` }),
                ["--animate-duration" as any]: `${animationDurationMs}ms`,
              }}
            >
              {isVideoBanner(banner) && (
                <video
                  className={styles.slideVideo}
                  src={banner.image_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* overlay */}
      <div className={styles.overlay} />

      {/* 🧾 CONTENT (STATIC) */}
      <div className={`container text-center text-white ${styles.content}`}>
        <div className={styles.inner}>
          <div className={styles.script} style={scriptStyle}>
            {scriptText}
          </div>

          {banner.title && (
            <h1 className={styles.title} style={titleStyle}>
              {banner.title}
            </h1>
          )}

          {banner.button_text && banner.url && (
            <a
              href={banner.url}
              target="_blank"
              rel="noreferrer"
              className={styles.cta}
              style={buttonStyle}
            >
              {banner.button_text}
            </a>
          )}
        </div>
      </div>

      {/* ● dots */}
      <div className={styles.dots}>
        {banners.map((_, index) => (
          <span
            key={index}
            onClick={() => goToBanner(index)}
            className={`${styles.dot} ${index === current ? ' ' + styles.active : ''}`}
          />
        ))}
      </div>
    </section>
    </>
  );
}
