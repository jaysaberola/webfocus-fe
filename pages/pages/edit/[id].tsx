import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect, useState } from "react";
import TinyEditor from "@/components/UI/Editor";
import { getPageById, updatePage } from "@/services/pageService";
import { useRouter } from "next/router";
import { getAlbums } from "@/services/albumService";
import { getMenus } from "@/services/menuService";
import { toast } from "@/lib/toast";
import AiAssistant from "@/components/AI/AiAssistant";
import SelectPreset from "@/components/UI/SelectPreset";
import dynamic from "next/dynamic";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";
import Tooltip from "@/components/UI/Tooltip";
import { isDefaultProtectedPage } from "@/lib/defaultPages";

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), { ssr: false });

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

function EditPage() {
  const router = useRouter();
  const { id } = router.query;

  // Page state
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [tinyContent, setTinyContent] = useState("");
  const [grapesContent, setGrapesContent] = useState("");
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

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [defaultPageLocked, setDefaultPageLocked] = useState(false);
  const [lockedStatus, setLockedStatus] = useState<"published" | "private" | "draft">("published");

  const handleEditorTypeChange = (nextType: "tinymce" | "grapesjs") => {
    if (nextType === "tinymce" && !tinyContent && grapesContent) {
      setTinyContent(grapesContent);
    }
    if (nextType === "grapesjs" && !grapesContent && tinyContent) {
      setGrapesContent(tinyContent);
    }
    setEditorType(nextType);
  };

  // ✅ Load page data
  useEffect(() => {
    if (!id) return;

    getPageById(Number(id))
      .then((res) => {
        const page = res.data;
        const hasGrapesFields = Boolean(page.grapes_html || page.grapes_css || page.grapes_js);
        const isGrapes = page.content_type === "grapes" || hasGrapesFields;
        const composedContent = isGrapes
          ? composeContentFromGrapes({
              grapes_html: page.grapes_html || page.contents || "",
              grapes_css: page.grapes_css || "",
              grapes_js: page.grapes_js || "",
            })
          : page.contents || "";

        setTitle(page.name);
        setLabel(page.label || "");
        setAlbumId(page.album_id ?? ""); // ✅ HERE
        setMenuId(page.menu_id ?? "");
        setTinyContent(composedContent);
        setGrapesContent(composedContent);
        setEditorType(isGrapes ? "grapesjs" : "tinymce");
        setVisibility(page.status === "published");
        setLockedStatus(page.status === "draft" ? "draft" : page.status === "private" ? "private" : "published");
        setDefaultPageLocked(
          isDefaultProtectedPage({
            slug: page.slug,
            label: page.label,
            title: page.name,
            url: page.url,
          })
        );
        setSeoTitle(page.meta_title || "");
        setSeoDescription(page.meta_description || "");
        setSeoKeywords(page.meta_keyword || "");
      })
      .finally(() => setInitialLoading(false));
  }, [id]);

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

      await updatePage(Number(id), {
        name: title,
        label: label || undefined,
        album_id: albumId, // ✅ ADD
        menu_id: menuId,
        contents: activeContent,
        content_type: isGrapes ? "grapes" : "tiny",
        grapes_html: isGrapes || hasGrapesData ? grapesParts.grapes_html : undefined,
        grapes_css: isGrapes || hasGrapesData ? grapesParts.grapes_css : undefined,
        grapes_js: isGrapes || hasGrapesData ? grapesParts.grapes_js : undefined,
        status: defaultPageLocked ? lockedStatus : visibility ? "published" : "private",
        meta_title: seoTitle || undefined,
        meta_description: seoDescription || undefined,
        meta_keyword: seoKeywords || undefined,
      });

      toast.success("Page updated successfully");
      router.push("/pages");

    } catch (error: any) {
      console.error(error);
      toast.error(getPageSaveErrorMessage(error, "update"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Edit Page</h3>

      <div className="card mb-4">
        <div className="card-header fw-bold">Page Details</div>
        <div className="card-body">

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Page Title
              <Tooltip text="Main title of the page. This is used for generating the page slug and identifying the page." />
            </label>
            <input
              type="text"
              className="form-control"
              value={title}
              disabled={Number(id) == 1}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Page Label
              <Tooltip text="Internal name used inside the CMS to help identify the page. It does not appear on the website." />
            </label>
            <input
              type="text"
              className="form-control"
              value={label}
              disabled={Number(id) == 1}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {Number(id) !== 1 && (
            <div className="mb-3">
              <label className="form-label d-flex align-items-center">
                Album (optional)
                <Tooltip text="Attach this page to an album to group related pages like galleries or portfolios." />
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
          )}
          {Number(id) !== 1 && (
            <div className="mb-3">
              <label className="form-label d-flex align-items-center">
                Menu Group (optional)
                <Tooltip text="Select a menu group if you want this page to appear in the website navigation." />
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
          )}

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              Layout Presets
              <Tooltip text="Apply a predefined layout template to quickly structure your page content." />
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
              <Tooltip text="Edit the main body of the page. You can choose between the visual builder or rich text editor." />
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
                <label className="form-check-label d-flex align-items-center" htmlFor="editorTinyMce">
                  TinyMCE
                  <Tooltip text="Simple rich text editor for writing articles and formatted text." />
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
                <label className="form-check-label d-flex align-items-center" htmlFor="editorGrapes">
                  GrapesJS
                  <Tooltip text="Drag-and-drop page builder for designing complex layouts visually." />
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
              disabled={defaultPageLocked}
              onChange={() => {
                if (defaultPageLocked) return;
                setVisibility(!visibility);
              }}
            />
            <label className="form-check-label d-flex align-items-center">
              {visibility ? "Published" : "Private"}
              <Tooltip text="Published pages are visible to visitors. Private pages remain hidden." />
            </label>
          </div>
          {defaultPageLocked && (
            <div className="small text-muted mb-3">Default pages cannot change visibility from the editor.</div>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header fw-bold">Manage SEO</div>
        <div className="card-body">

          <div className="mb-3">
            <label className="form-label d-flex align-items-center">
              SEO Title
              <Tooltip text="Title displayed in search engine results and browser tabs. Recommended length: 50–60 characters." />
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
              <Tooltip text="Optional keywords related to the page. Separate multiple keywords with commas." />
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
          {loading ? "Saving..." : "Update Page"}
        </button>

        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

EditPage.Layout = AdminLayout;

export async function getServerSideProps() {
  return { props: {} };
}

export default EditPage;
