"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "@/lib/toast";
import { createArticle, fetchArticleCategories, ArticleCategory } from "@/services/articleService";
import { useRouter } from "next/router";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import {
  CmsSettingsField,
  CmsSettingsFileField,
  CmsSettingsFooter,
  CmsSettingsGrid,
  CmsSettingsLayout,
  CmsSettingsSection,
} from "@/components/Modules/CmsSettingsForm";

const TinyEditor = dynamic(() => import("@/components/UI/Editor"), {
  ssr: false,
  loading: () => <div className="page-editor__editor-placeholder">Loading editor...</div>,
});

function CreateNews() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
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
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date || !content || !teaser || !banner || !thumbnail) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    try {
      setSaving(true);
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
        meta_title: seoTitle || title,
        meta_keyword: seoKeywords,
        meta_description: seoDescription || teaser,
      });

      toast.success("News saved successfully");
      router.push("/news");
    } catch (err: any) {
      toast.error("Failed to save news");
      console.error(err);
    } finally {
      setSaving(false);
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

  const fillSeoFromDetails = () => {
    if (!seoTitle.trim()) setSeoTitle(title);
    if (!seoDescription.trim()) setSeoDescription(teaser);
  };

  return (
    <CmsModuleShell
      title="Create News"
      description="Write and publish a news article with banner, thumbnail, content, and SEO settings."
      icon="fa-solid fa-newspaper"
      stats={[
        { label: "Status", value: isPublished ? "Published" : "Private", tone: isPublished ? "published" : "private" },
        { label: "Featured", value: isFeatured ? "Yes" : "No", tone: isFeatured ? "accent" : "default" },
        { label: "Category", value: categories.find((item) => String(item.id) === category)?.name || "—" },
      ]}
    >
      <CmsSettingsLayout>
        <CmsSettingsSection
          title="News Details"
          description="Basic article information and visibility settings."
          icon="fa-solid fa-file-lines"
        >
          <CmsSettingsGrid columns={2}>
            <CmsSettingsField label="Title" required span={2}>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={fillSeoFromDetails}
                placeholder="Enter news title"
              />
            </CmsSettingsField>
            <CmsSettingsField label="Date" required>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </CmsSettingsField>
            <CmsSettingsField label="Category" required>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? "Loading categories..." : "Select category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </CmsSettingsField>
            <CmsSettingsField label="Visibility">
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
            </CmsSettingsField>
            <CmsSettingsField label="Featured" hint="Maximum of 3 featured news items on the public site.">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="featuredSwitch"
                  checked={isFeatured}
                  onChange={() => setIsFeatured(!isFeatured)}
                />
                <label className="form-check-label" htmlFor="featuredSwitch">
                  Mark as featured
                </label>
              </div>
            </CmsSettingsField>
            <CmsSettingsField label="Teaser" required span={2} hint="Short summary shown in news listings.">
              <textarea
                className="form-control"
                rows={3}
                value={teaser}
                onChange={(e) => setTeaser(e.target.value)}
                onBlur={fillSeoFromDetails}
                placeholder="Write a short teaser for this article"
              />
            </CmsSettingsField>
          </CmsSettingsGrid>
        </CmsSettingsSection>

        <CmsSettingsSection
          title="Media"
          description="Upload the banner and thumbnail images for this article."
          icon="fa-solid fa-image"
        >
          <CmsSettingsGrid columns={2}>
            <CmsSettingsFileField
              label="Article Banner"
              previewUrl={bannerPreview}
              fileName={banner?.name}
              hint="Recommended wide image • JPG or PNG"
              accept="image/*"
              previewVariant="logo"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setBanner(file);
                setBannerPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            <CmsSettingsFileField
              label="Article Thumbnail"
              previewUrl={thumbnailPreview}
              fileName={thumbnail?.name}
              hint="Square or listing image • JPG or PNG"
              accept="image/*"
              previewVariant="favicon"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setThumbnail(file);
                setThumbnailPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </CmsSettingsGrid>
        </CmsSettingsSection>

        <CmsSettingsSection
          title="Content"
          description="Write the full article body."
          icon="fa-solid fa-align-left"
        >
          <TinyEditor value={content} onChange={setContent} />
        </CmsSettingsSection>

        <CmsSettingsSection
          title="SEO Settings"
          description="Search engine title, description, and keywords."
          icon="fa-solid fa-magnifying-glass"
        >
          <CmsSettingsGrid columns={1}>
            <CmsSettingsField label="SEO Title" hint="Leave blank to use the article title.">
              <input
                type="text"
                className="form-control"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </CmsSettingsField>
            <CmsSettingsField label="SEO Description" hint="Leave blank to use the teaser.">
              <textarea
                className="form-control"
                rows={4}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </CmsSettingsField>
            <CmsSettingsField label="SEO Keywords">
              <input
                type="text"
                className="form-control"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="news, updates, company"
              />
            </CmsSettingsField>
          </CmsSettingsGrid>
        </CmsSettingsSection>

        <CmsSettingsFooter onSave={handleSubmit} saveLabel="Save News" saving={saving}>
          <button
            type="button"
            className="btn btn-outline-secondary cms-module__toolbar-btn"
            onClick={() => router.push("/news")}
          >
            Cancel
          </button>
        </CmsSettingsFooter>
      </CmsSettingsLayout>
    </CmsModuleShell>
  );
}

CreateNews.Layout = AdminLayout;
export default CreateNews;
