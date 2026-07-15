"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect, useState } from "react";
import TinyEditor from "@/components/UI/Editor";
import { toast } from "@/lib/toast";
import {
  updateArticle,
  getArticle,
  fetchArticleCategories,
  ArticleCategory,
} from "@/services/articleService";
import { useRouter } from "next/router";

export default function EditNews() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [teaser, setTeaser] = useState("");

  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  /* ======================
   * Load Article + Categories
   * ====================== */
  useEffect(() => {
    if (!id) return;

    Promise.all([
      getArticle(Number(id)),
      fetchArticleCategories(),
    ])
      .then(([article, cats]) => {
        setTitle(article.name);
        setDate(article.date); // ✅ correct day
        setCategory(article.category_id.toString());
        setContent(article.contents);
        setTeaser(article.teaser);

        setIsPublished(article.status === "published");
        setIsFeatured(!!article.is_featured);

        setSeoTitle(article.meta_title ?? "");
        setSeoDescription(article.meta_description ?? "");
        setSeoKeywords(article.meta_keyword ?? "");

        if (article.image_url) {
          setBannerPreview(
            `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.image_url}`
          );
        }

        if (article.thumbnail_url) {
          setThumbnailPreview(
            `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.thumbnail_url}`
          );
        }

        setCategories(cats);
      })
      .catch(() => toast.error("Failed to load article"))
      .finally(() => {
        setLoading(false);
        setLoadingCategories(false);
      });
  }, [id]);

  useEffect(() => {
    return () => {
      if (bannerPreview?.startsWith("blob:"))
        URL.revokeObjectURL(bannerPreview);
      if (thumbnailPreview?.startsWith("blob:"))
        URL.revokeObjectURL(thumbnailPreview);
    };
  }, [bannerPreview, thumbnailPreview]);

  const handleSubmit = async () => {
    if (!title || !date || !content || !teaser || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateArticle(Number(id), {
        title,
        date,
        category_id: Number(category),
        content,
        teaser,
        banner,
        thumbnail,
        status: isPublished ? "published" : "private",
        is_featured: isFeatured,
        meta_title: seoTitle,
        meta_keyword: seoKeywords,
        meta_description: seoDescription,
      });

      toast.success("News updated successfully");
      router.push("/news");
    } catch (err) {
      toast.error("Failed to update news");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-4 pt-3">
        <p>Loading article...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Edit News</h3>

      {/* ================= News Details ================= */}
      <div className="card mb-4">
        <div className="card-header fw-bold">News Details</div>
        <div className="card-body">
          {/* Title */}
          <div className="mb-3">
            <label className="form-label">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="mb-3">
            <label className="form-label">
              Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="mb-3">
            <label className="form-label">
              Category <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loadingCategories}
            >
              <option value="">
                {loadingCategories
                  ? "Loading categories..."
                  : "-- Select Category --"}
              </option>

              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Banner */}
          <div className="mb-3">
            <label className="form-label">Article Banner</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setBanner(file);
                setBannerPreview(
                  file ? URL.createObjectURL(file) : bannerPreview
                );
              }}
            />

            {bannerPreview && (
              <img
                src={bannerPreview}
                className="img-fluid rounded border mt-2"
                style={{ maxHeight: 200 }}
              />
            )}
          </div>

          {/* Thumbnail */}
          <div className="mb-3">
            <label className="form-label">Article Thumbnail</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setThumbnail(file);
                setThumbnailPreview(
                  file ? URL.createObjectURL(file) : thumbnailPreview
                );
              }}
            />

            {thumbnailPreview && (
              <img
                src={thumbnailPreview}
                className="img-fluid rounded border mt-2"
                style={{ maxHeight: 150 }}
              />
            )}
          </div>

          {/* Content */}
          <div className="mb-3">
            <label className="form-label">
              Content <span className="text-danger">*</span>
            </label>
            <TinyEditor value={content} onChange={setContent} />
          </div>

          {/* Teaser */}
          <div className="mb-3">
            <label className="form-label">
              Teaser <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={teaser}
              onChange={(e) => setTeaser(e.target.value)}
            />
          </div>

          {/* Visibility */}
          <div className="mb-3">
            <label className="form-label">Page Visibility</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
              />
              <label className="form-check-label">
                {isPublished ? "Published" : "Private"}
              </label>
            </div>
          </div>

          {/* Featured */}
          <div className="mb-3">
            <label className="form-label">Display (Max Featured: 3)</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={isFeatured}
                onChange={() => setIsFeatured(!isFeatured)}
              />
              <label className="form-check-label">Featured</label>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SEO ================= */}
      <div className="card mb-4">
        <div className="card-header fw-bold">News SEO</div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">SEO Title</label>
            <input
              type="text"
              className="form-control"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">SEO Description</label>
            <textarea
              className="form-control"
              rows={4}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">SEO Keywords</label>
            <input
              type="text"
              className="form-control"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="btn-group">
        <button className="btn btn-primary" onClick={handleSubmit}>
          Update News
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => router.push("/news")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

EditNews.Layout = AdminLayout;
