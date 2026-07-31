import { useEffect, useMemo, useState } from "react";
import { PublicAlbum } from "@/services/publicPageService";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import { BannerMediaType, resolveBannerMediaType } from "@/lib/bannerAssets";
import {
  BANNER_ANIMATION_DURATION_MS,
  bannerAnimationClasses,
  resolveBannerSlideInterval,
  resolveBannerTransitionClass,
} from "@/lib/bannerTransitions";

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
  const albumBannerType: BannerMediaType = album?.banner_type === "video" ? "video" : "image";
  const banners = useMemo(() => {
    return (album?.banners || []).filter((banner: any) => {
      const mediaType = resolveBannerMediaType(
        {
          image_path: banner?.image_path,
          image_url: banner?.image_url,
          media_type: banner?.media_type ?? banner?.mediaType,
        },
        albumBannerType
      );
      return mediaType === albumBannerType;
    });
  }, [album?.banners, album?.banner_type, albumBannerType]);

  const isVideoBanner = (banner: any) =>
    resolveBannerMediaType(
      {
        image_path: banner?.image_path,
        image_url: banner?.image_url,
        media_type: banner?.media_type ?? banner?.mediaType,
      },
      albumBannerType
    ) === "video";
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState<number | null>(null);

  const activeBanner: any = banners[current];
  const bannerTitle = activeBanner?.title?.trim() || "";
  const bannerDescription = activeBanner?.description?.trim() || "";
  const transitionInClass = resolveBannerTransitionClass(album as Record<string, unknown> | null | undefined, "in");
  const transitionOutClass = resolveBannerTransitionClass(album as Record<string, unknown> | null | undefined, "out");

  const goToBanner = (next: number) => {
    if (!banners.length || next === current) return;
    const outgoing = current;
    setExiting(outgoing);
    setCurrent(next);

    window.setTimeout(() => {
      setExiting((value) => (value === outgoing ? null : value));
    }, BANNER_ANIMATION_DURATION_MS);
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

  const interval = resolveBannerSlideInterval(album?.transition);

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
          const animationName = isExiting
            ? transitionOutClass
            : isActive
              ? transitionInClass
              : "";
          const shouldAnimate = Boolean(animationName && (isActive || isExiting));

          return (
            <div
              key={banner.id ?? index}
              className={bannerAnimationClasses(animationName, shouldAnimate).join(" ")}
              style={{
                position: "absolute",
                inset: 0,
                ...(isVideoBanner(banner) ? {} : { backgroundImage: `url(${resolveStorageAssetUrl(banner.image_url || banner.image_path) || ""})` }),
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: isActive || isExiting ? 1 : 0,
                transform: isActive ? "scale(1)" : "scale(1.02)",
                zIndex: isExiting ? 2 : isActive ? 1 : 0,
                ["--animate-duration" as any]: `${BANNER_ANIMATION_DURATION_MS}ms`,
              }}
            >
              {isVideoBanner(banner) && (
                <video
                  src={resolveStorageAssetUrl(banner.image_url || banner.image_path) || ""}
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
