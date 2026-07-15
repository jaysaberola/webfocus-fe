"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useState, useEffect } from "react";
import TinyEditor from "@/components/UI/Editor";
import { toast } from "@/lib/toast";
import { createArticle, fetchArticleCategories, ArticleCategory } from "@/services/articleService";
import { useRouter } from "next/router";

export default function CreateNews() {
  const router = useRouter();
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

  const handleSubmit = async () => {
    if (!title || !date || !content || !teaser || !banner ||!thumbnail ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    try {
      await createArticle({
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

      toast.success("News saved successfully");
      router.push("/news");
    } catch (err: any) {
      toast.error("Failed to save news");
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [bannerPreview, thumbnailPreview]);

  useEffect(() => {
    fetchArticleCategories()
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoadingCategories(false));
  }, []);


  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Create a News</h3>

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
                {loadingCategories ? "Loading categories..." : "-- Select Category --"}
              </option>

              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Article Banner Upload */}
          <div className="mb-3">
            <label className="form-label">
              Article Banner <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setBanner(file);

                if (file) {
                  setBannerPreview(URL.createObjectURL(file));
                } else {
                  setBannerPreview(null);
                }
              }}
            />

            {bannerPreview && (
              <div className="mt-2">
                <img
                  src={bannerPreview}
                  alt="Banner Preview"
                  className="img-fluid rounded border"
                  style={{ maxHeight: 200 }}
                />
              </div>
            )}
          </div>

          {/* Article Thumbnail Upload */}
          <div className="mb-3">
            <label className="form-label">
              Article Thumbnail <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setThumbnail(file);

                if (file) {
                  setThumbnailPreview(URL.createObjectURL(file));
                } else {
                  setThumbnailPreview(null);
                }
              }}
            />

            {thumbnailPreview && (
              <div className="mt-2">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  className="img-fluid rounded border"
                  style={{ maxHeight: 150 }}
                />
              </div>
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
                id="visibilitySwitch"
                checked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
              />
              <label className="form-check-label" htmlFor="visibilitySwitch">
                {isPublished ? "Published" : "Private"}
              </label>
            </div>
          </div>

          {/* Featured */}
          <div className="mb-3">
            <label className="form-label">
              Display (Max Featured: 3)
            </label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="featuredSwitch"
                checked={isFeatured}
                onChange={() => setIsFeatured(!isFeatured)}
              />
              <label className="form-check-label" htmlFor="featuredSwitch">
                Featured
              </label>
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
          Save News
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

CreateNews.Layout = AdminLayout;
