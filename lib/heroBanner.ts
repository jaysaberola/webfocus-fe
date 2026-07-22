import type { PublicAlbum } from "@/services/publicPageService";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";

const DEFAULT_HERO_IMAGE = "/images/homescreenify-sA3wymYqyaI-unsplash.jpg";

export function getHeroPreloadImage(album?: PublicAlbum | null) {
  if (!album || album.type !== "main_banner") return null;

  const first = album.banners?.[0];
  if (!first) return DEFAULT_HERO_IMAGE;

  return (
    resolveStorageAssetUrl(first.image_url) ||
    resolveStorageAssetUrl(first.image_path) ||
    DEFAULT_HERO_IMAGE
  );
}
