import AdminLayout from "@/components/Layout/AdminLayout";
import { useState } from "react";
import TinyEditor from "@/components/UI/Editor";
import { createPage } from "@/services/pageService";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getAlbums } from "@/services/albumService";
import { getMenus } from "@/services/menuService";
import { toast } from "@/lib/toast";
import AiAssistant from "@/components/AI/AiAssistant";
import SelectPreset from "@/components/UI/SelectPreset";
import dynamic from "next/dynamic";
import { extractGrapesParts } from "@/lib/grapesContent";
import Tooltip from "@/components/UI/Tooltip";

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), { ssr: false });

const DEFAULT_CONTENT = ``;

const getPageSaveErrorMessage = (error: any, mode: "create" | "update") => {
  const apiMessage = error?.response?.data?.message;
  const fallback = mode === "create" ? "Failed to create page" : "Failed to update page";
  const source = [apiMessage, error?.message].filter(Boolean).join(" ");

  if (/pages_slug_unique|duplicate\s+entry|sqlstate\[23000\]/i.test(source)) {
    return "Page slug already exists. Please change Page Title or Label, then save again.";
  }

  if (/insert\s+into\s+`?pages`?|update\s+`?pages`?/i.test(source)) {
    return fallback;
  }

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }

  return fallback;
};

export default function CreatePage() {
  // Page state
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [tinyContent, setTinyContent] = useState(DEFAULT_CONTENT);
  const [grapesContent, setGrapesContent] = useState(DEFAULT_CONTENT);
  const [editorType, setEditorType] = useState<"tinymce" | "grapesjs">("tinymce");
  const [visibility, setVisibility] = useState(true);
  const [albumId, setAlbumId] = useState<number | "">("");
  const [albums, setAlbums] = useState<any[]>([]);
  const [menuId, setMenuId] = useState<number | "">("");
  const [menus, setMenus] = useState<any[]>([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  // UI
  const [loading, setLoading] = useState(false);

  const handleEditorTypeChange = (nextType: "tinymce" | "grapesjs") => {
    if (nextType === "tinymce" && !tinyContent && grapesContent) {
      setTinyContent(grapesContent);
    }
    if (nextType === "grapesjs" && !grapesContent && tinyContent) {
      setGrapesContent(tinyContent);
    }
    setEditorType(nextType);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Page title is required");
      return;
    }

    try {
      setLoading(true);
      const activeContent = editorType === "grapesjs" ? grapesContent : tinyContent;
      const grapesParts = extractGrapesParts(grapesContent);
      const isGrapes = editorType === "grapesjs";
      const hasGrapesData = Boolean(
        grapesParts.grapes_html?.trim() || grapesParts.grapes_css?.trim() || grapesParts.grapes_js?.trim()
      );

      await createPage({
        name: title,
        label: label || undefined,
        album_id: albumId || undefined,
        // menu_id: menuId || undefined,
        contents: activeContent,
        content_type: isGrapes ? "grapes" : "tiny",
        grapes_html: isGrapes || hasGrapesData ? grapesParts.grapes_html : undefined,
        grapes_css: isGrapes || hasGrapesData ? grapesParts.grapes_css : undefined,
        grapes_js: isGrapes || hasGrapesData ? grapesParts.grapes_js : undefined,
        status: visibility ? "published" : "private",
        meta_title: seoTitle || undefined,
        meta_description: seoDescription || undefined,
        meta_keyword: seoKeywords || undefined,
      });

      toast.success("Page created successfully");

      // ✅ Redirect to pages list
      router.push("/pages");

    } catch (error: any) {
      console.error(error);
      toast.error(getPageSaveErrorMessage(error, "create"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAlbums({ page: 1, per_page: 1000 })
      .then((res) => {
        setAlbums(res.data.data ?? res.data);
      })
      .catch(() => setAlbums([]));
    getMenus({ page: 1, per_page: 1000 })
      .then((res) => setMenus(res.data.data ?? res.data))
      .catch(() => setMenus([]));
  }, []);

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Create a Page</h3>

      <div className="card mb-4">
        <div className="card-header fw-bold">Page Details</div>
        <div className="card-body">

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Page Title
              <Tooltip text="This will appear as the main heading of the page and in browser tabs." />
            </label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Page Label
              <Tooltip text="Internal label used for identifying the page inside the CMS. It does not appear on the public website." />
            </label>
            <input
              type="text"
              className="form-control"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Album (optional)
              <Tooltip text="Attach this page to an album. Useful for grouping related pages like galleries, portfolios, or categories." />
            </label>
            <select
              className="form-select"
              value={albumId}
              onChange={(e) =>
                setAlbumId(e.target.value ? Number(e.target.value) : 0)
              }
            >
              <option value="0">— No Album —</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Menu Group (optional)
              <Tooltip text="Assign this page to a menu group so it can appear in your website navigation." />
            </label>
            <select
              className="form-select"
              value={menuId}
              onChange={(e) => setMenuId(e.target.value ? Number(e.target.value) : 0)}
            >
              <option value="0">— No Menu —</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Layout Presets
              <Tooltip text="Choose a pre-designed layout template to quickly build your page structure." />
            </label>
            <SelectPreset
              onSelect={(html) => {
                setTinyContent(html);
                setGrapesContent(html);
                toast.success("Layout preset applied");
              }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Page Content
              <Tooltip text="Create and edit the main content of the page. You can use either the visual builder or the rich text editor." />
            </label>
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name="editorType"
                  id="editorTinyMce"
                  checked={editorType === "tinymce"}
                  onChange={() => handleEditorTypeChange("tinymce")}
                />
                <label className="form-check-label" htmlFor="editorTinyMce">
                  TinyMCE
                  <Tooltip text="A simple rich text editor similar to Microsoft Word. Best for writing articles or basic content." />
                </label>
              </div>
              <div className="form-check form-check-inline mb-0">
                <input
                  className="form-check-input"
                  type="radio"
                  name="editorType"
                  id="editorGrapes"
                  checked={editorType === "grapesjs"}
                  onChange={() => handleEditorTypeChange("grapesjs")}
                />
                <label className="form-check-label" htmlFor="editorGrapes">
                  GrapesJS
                  <Tooltip text="A drag-and-drop page builder for creating complex layouts and visual designs." />
                </label>
              </div>
            </div>
            {/**
            <AiAssistant
              content={content}
              onApply={(html) => setContent(html)}
            />
             */}
            {editorType === "tinymce" ? (
              <TinyEditor
                value={tinyContent}
                onChange={setTinyContent}
              />
            ) : (
              <GrapesEditor
                value={grapesContent}
                onChange={setGrapesContent}
              />
            )}
          </div>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              checked={visibility}
              onChange={() => setVisibility(!visibility)}
            />
            <label className="form-check-label d-flex align-items-center">
              {visibility ? "Published" : "Private"}
              <Tooltip text="Published pages are visible on the website. Private pages are hidden from visitors." />
            </label>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header fw-bold">Manage SEO</div>
        <div className="card-body">

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              SEO Title
              <Tooltip text="The title shown in search engine results and browser tabs. Recommended length: 50–60 characters." />
            </label>
            <input
              type="text"
              className="form-control"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              SEO Description
              <Tooltip text="Short summary of the page used by search engines. Recommended length: 150–160 characters." />
            </label>
            <textarea
              rows={4}
              className="form-control"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              SEO Keywords
              <Tooltip text="Optional keywords related to the page content. Separate multiple keywords with commas." />
            </label>
            <input
              type="text"
              className="form-control"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Page"}
        </button>

        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

CreatePage.Layout = AdminLayout;
