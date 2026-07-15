import { PublicAlbum } from "@/services/publicPageService";

export const articleToAlbum = (article: any): PublicAlbum | null => {
  if (!article?.image_url) return null;

  return {
    id: article.id,
    name: article.name,
    type: "single",
    banner_type: "image",
    banners: [
      {
        id: article.id,
        title: article.name,
        description: article.teaser,
        alt: article.name,
        image_url: `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.image_url}`,
        order: 1,
      },
    ],
  };
};
