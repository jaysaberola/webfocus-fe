import { PublicAlbum } from "@/services/publicPageService";
import MainBanner from "./MainBanner";
import PageBanner from "./PageBanner";

interface BannerProps {
  title?: string;
  subtitle?: string;
  album?: PublicAlbum | null;
}

export default function Banner({
  title,
  subtitle,
  album,
}: BannerProps) {
  if (album?.type === "main_banner") {
    return <MainBanner album={album} />;
  }

  return (
    <PageBanner
      title={title}
      subtitle={subtitle}
      album={album}
    />
  );
}
