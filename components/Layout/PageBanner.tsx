import { useEffect, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";

interface PageBannerProps {
  title?: string;
  subtitle?: string;
  album?: PublicAlbum | null;
}

export default function PageBanner({
  title = "Search Results",
  subtitle = "",
  album,
}: PageBannerProps) {
  const banners = album?.banners || [];
  const isVideoBanner = (banner: any) => {
    const mediaType = String(banner?.media_type ?? banner?.mediaType ?? "").toLowerCase();
    if (mediaType === "video") return true;
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(banner?.image_url ?? ""));
  };
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState<number | null>(null);

  const activeBanner: any = banners[current];
  const bannerTitle = activeBanner?.title?.trim() || "";
  const bannerDescription = activeBanner?.description?.trim() || "";
  const normalizeAnimationName = (value: any) => {
    if (!value) return "";
    const raw = String(value).trim();
    if (!raw) return "";
    return raw.replace(/^animate__/, "").replace(/[^a-zA-Z0-9_-]/g, "");
  };

  const transitionInClass = normalizeAnimationName(
    (album as any)?.transition_in_value ?? (album as any)?.transitionInValue
  );
  const transitionOutClass = normalizeAnimationName(
    (album as any)?.transition_out_value ?? (album as any)?.transitionOutValue
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

  const titleFont =
    activeBanner?.title_font ??
    activeBanner?.titleFont ??
    activeBanner?.title_font_family ??
    activeBanner?.titleFontFamily;
  const descriptionFont =
    activeBanner?.description_font ??
    activeBanner?.descriptionFont ??
    activeBanner?.description_font_family ??
    activeBanner?.descriptionFontFamily;

  const titleFontSizeRaw =
    activeBanner?.title_font_size ??
    activeBanner?.titleFontSize ??
    activeBanner?.title_size ??
    activeBanner?.titleSize;
  const titleFontSize =
    typeof titleFontSizeRaw === "number"
      ? titleFontSizeRaw
      : typeof titleFontSizeRaw === "string" && titleFontSizeRaw.trim() !== ""
        ? Number(titleFontSizeRaw)
        : undefined;

  const titleBoldRaw =
    activeBanner?.title_bold ??
    activeBanner?.titleBold ??
    activeBanner?.is_title_bold ??
    activeBanner?.isTitleBold;
  const titleBold =
    typeof titleBoldRaw === "boolean"
      ? titleBoldRaw
      : titleBoldRaw === 1 || titleBoldRaw === "1" || titleBoldRaw === "true"
        ? true
        : titleBoldRaw === 0 || titleBoldRaw === "0" || titleBoldRaw === "false"
          ? false
          : undefined;

  const descriptionFontSizeRaw =
    activeBanner?.description_font_size ??
    activeBanner?.descriptionFontSize ??
    activeBanner?.description_size ??
    activeBanner?.descriptionSize;
  const descriptionFontSize =
    typeof descriptionFontSizeRaw === "number"
      ? descriptionFontSizeRaw
      : typeof descriptionFontSizeRaw === "string" && descriptionFontSizeRaw.trim() !== ""
        ? Number(descriptionFontSizeRaw)
        : undefined;

  const descriptionBoldRaw =
    activeBanner?.description_bold ??
    activeBanner?.descriptionBold ??
    activeBanner?.is_description_bold ??
    activeBanner?.isDescriptionBold;
  const descriptionBold =
    typeof descriptionBoldRaw === "boolean"
      ? descriptionBoldRaw
      : descriptionBoldRaw === 1 || descriptionBoldRaw === "1" || descriptionBoldRaw === "true"
        ? true
        : descriptionBoldRaw === 0 || descriptionBoldRaw === "0" || descriptionBoldRaw === "false"
          ? false
          : undefined;

  const titleStyle =
    titleFont || typeof titleFontSize === "number" || typeof titleBold === "boolean"
      ? ({
          ...(titleFont ? { fontFamily: titleFont } : {}),
          ...(typeof titleFontSize === "number" && Number.isFinite(titleFontSize)
            ? { fontSize: Math.max(14, Math.min(120, titleFontSize)) }
            : {}),
          ...(typeof titleBold === "boolean" ? { fontWeight: titleBold ? 900 : 400 } : {}),
        } as const)
      : undefined;

  const subtitleStyle =
    descriptionFont || typeof descriptionFontSize === "number" || typeof descriptionBold === "boolean"
      ? ({
          ...(descriptionFont ? { fontFamily: descriptionFont } : {}),
          ...(typeof descriptionFontSize === "number" && Number.isFinite(descriptionFontSize)
            ? { fontSize: Math.max(10, Math.min(120, descriptionFontSize)) }
            : {}),
          ...(typeof descriptionBold === "boolean" ? { fontWeight: descriptionBold ? 700 : 400 } : {}),
        } as const)
      : undefined;

  const transitionSeconds = Number(album?.transition);
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

  // 🖼 Banner with images
  if (banners.length > 0) {
    return (
      <section
        style={{
          position: "relative",
          minHeight: 420,
          overflow: "hidden",
        }}
      >
        {/* Background Images */}
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
                animationClass ? "animate__animated" : "",
                animationClass ? `animate__${animationClass}` : "",
              ].filter(Boolean).join(" ")}
              style={{
                position: "absolute",
                inset: 0,
                ...(isVideoBanner(banner) ? {} : { backgroundImage: `url(${banner.image_url})` }),
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: isActive || isExiting ? 1 : 0,
                transform: isActive ? "scale(1)" : "scale(1.02)",
                zIndex: isExiting ? 2 : isActive ? 1 : 0,
                ["--animate-duration" as any]: `${animationDurationMs}ms`,
              }}
            >
              {isVideoBanner(banner) && (
                <video
                  src={banner.image_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>
          );
        })}

        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35), rgba(0,0,0,0.55))",
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div
          className="container text-center text-white"
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: 420,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          {bannerTitle && (
            <div
              className="mb-3"
              style={{
                textShadow: "0 3px 16px rgba(0,0,0,0.58)",
                ...(titleStyle || {}),
              }}
            >
              {bannerTitle}
            </div>
          )}

          <h1
            className="fw-bold mb-3"
            style={{
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="lead mb-3"
              style={{
                maxWidth: 720,
                margin: "0 auto",
                opacity: 0.95,
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              {subtitle}
            </p>
          )}

          {bannerDescription && (
            <p
              className="lead mb-0"
              style={{
                maxWidth: 720,
                margin: "0 auto",
                opacity: 0.95,
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                ...(subtitleStyle || {}),
              }}
            >
              {bannerDescription}
            </p>
          )}
        </div>
      </section>
    );
  }

  // 🔁 Fallback (no images)
  return (
    <section
      className="text-white"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #102f5f 100%)",
      }}
    >
      <div
          className="container text-center text-white"
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: 420,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
        <h1 className="fw-bold">{title}</h1>
      </div>
    </section>
  );
}
