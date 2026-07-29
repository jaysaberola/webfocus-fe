import AdminLayout from "@/components/Layout/AdminLayout";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createPage } from "@/services/pageService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import { extractGrapesParts } from "@/lib/grapesContent";
import Tooltip from "@/components/UI/Tooltip";
import PageEditorToolbar from "@/components/Pages/PageEditorToolbar";
import PageEditorSettingsPanel from "@/components/Pages/PageEditorSettingsPanel";
import { getAlbumsCached, getMenusCached, scheduleIdleTask } from "@/lib/referenceDataCache";

const TinyEditor = dynamic(() => import("@/components/UI/Editor"), {
  ssr: false,
  loading: () => <div className="page-editor__editor-placeholder">Loading editor...</div>,
});

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), {
  ssr: false,
  loading: () => <div className="page-editor__editor-placeholder">Loading visual builder...</div>,
});

const DEFAULT_CONTENT = ``;

type PageSnapshot = {
  title: string;
  label: string;
  tinyContent: string;
  grapesContent: string;
  editorType: "tinymce" | "grapesjs";
  visibility: boolean;
  albumId: number | "";
  menuId: number | "";
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

const emptySnapshot = (): PageSnapshot => ({
  title: "",
  label: "",
  tinyContent: DEFAULT_CONTENT,
  grapesContent: DEFAULT_CONTENT,
  editorType: "grapesjs",
  visibility: true,
  albumId: "",
  menuId: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
});

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
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [tinyContent, setTinyContent] = useState(DEFAULT_CONTENT);
  const [grapesContent, setGrapesContent] = useState(DEFAULT_CONTENT);
  const [editorType, setEditorType] = useState<"tinymce" | "grapesjs">("grapesjs");
  const [visibility, setVisibility] = useState(true);
  const [albumId, setAlbumId] = useState<number | "">("");
  const [albums, setAlbums] = useState<any[]>([]);
  const [menuId, setMenuId] = useState<number | "">("");
  const [menus, setMenus] = useState<any[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  const buildSnapshot = useCallback(
    (): PageSnapshot => ({
      title,
      label,
      tinyContent,
      grapesContent,
      editorType,
      visibility,
      albumId,
      menuId,
      seoTitle,
      seoDescription,
      seoKeywords,
    }),
    [title, label, tinyContent, grapesContent, editorType, visibility, albumId, menuId, seoTitle, seoDescription, seoKeywords],
  );

  const isDirty = useMemo(() => {
    return JSON.stringify(emptySnapshot()) !== JSON.stringify(buildSnapshot());
  }, [buildSnapshot]);

  const handleEditorTypeChange = (nextType: "tinymce" | "grapesjs") => {
    if (nextType === "tinymce" && !tinyContent && grapesContent) {
      setTinyContent(grapesContent);
    }
    if (nextType === "grapesjs" && !grapesContent && tinyContent) {
      setGrapesContent(tinyContent);
    }
    setEditorType(nextType);
  };

  useEffect(() => {
    const cancel = scheduleIdleTask(() => {
      Promise.all([getAlbumsCached(), getMenusCached()])
        .then(([albumRows, menuRows]) => {
          setAlbums(albumRows);
          setMenus(menuRows);
        })
        .catch(() => {
          setAlbums([]);
          setMenus([]);
        });
    });
    return cancel;
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

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
        grapesParts.grapes_html?.trim() || grapesParts.grapes_css?.trim() || grapesParts.grapes_js?.trim(),
      );

      const response = await createPage({
        name: title,
        label: label || undefined,
        album_id: albumId || undefined,
        menu_id: menuId || undefined,
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

      const createdPage = response.data?.data ?? response.data;
      const newPageId = Number(createdPage?.id);

      toast.success("Page created successfully");

      if (Number.isFinite(newPageId) && newPageId > 0) {
        router.push(`/pages/edit/${newPageId}`);
      } else {
        router.push("/pages");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(getPageSaveErrorMessage(error, "create"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("Discard this new page and go back?")) return;
    router.push("/pages");
  };

  return (
    <div className="container-fluid px-4 pt-3 page-editor">
      <PageEditorToolbar
        mode="create"
        pageTitle={title}
        isSaving={loading}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <div className="page-editor__layout">
        <div className="page-editor__main">
          <div className="page-editor__canvas-card" data-cms-tour="page-editor-canvas">
            <div className="page-editor__canvas-header">
              <h4>Page Content</h4>
              <div className="page-editor__editor-toggle" data-cms-tour="page-editor-toggle">
                <div className="form-check form-check-inline">
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
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="editorType"
                    id="editorGrapes"
                    checked={editorType === "grapesjs"}
                    onChange={() => handleEditorTypeChange("grapesjs")}
                  />
                  <label className="form-check-label" htmlFor="editorGrapes">
                    Visual Builder
                  </label>
                </div>
              </div>
            </div>
            <div className="page-editor__canvas-body">
              <div className="page-editor__editor-shell">
                {editorType === "tinymce" ? (
                  <TinyEditor value={tinyContent} onChange={setTinyContent} />
                ) : (
                  <GrapesEditor value={grapesContent} onChange={setGrapesContent} />
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="page-editor__sidebar" data-cms-tour="page-editor-sidebar">
          <div className="page-editor__settings-stack">
            <PageEditorSettingsPanel title="Page Details" tourId="page-editor-details">
              <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    Page Title
                    <Tooltip text="Main title of the page. This is used for generating the page slug and identifying the page." />
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
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
                    onChange={(event) => setLabel(event.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    Album (optional)
                    <Tooltip text="Attach this page to an album to group related pages like galleries or portfolios." />
                  </label>
                  <select
                    className="form-select"
                    value={albumId}
                    onChange={(event) => setAlbumId(event.target.value ? Number(event.target.value) : 0)}
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
                    <Tooltip text="Select a menu group if you want this page to appear in the website navigation." />
                  </label>
                  <select
                    className="form-select"
                    value={menuId}
                    onChange={(event) => setMenuId(event.target.value ? Number(event.target.value) : 0)}
                  >
                    <option value="0">— No Menu —</option>
                    {menus.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={visibility}
                    onChange={() => setVisibility(!visibility)}
                  />
                  <label className="form-check-label d-flex align-items-center">
                    {visibility ? "Published" : "Private"}
                    <Tooltip text="Published pages are visible to visitors. Private pages remain hidden." />
                  </label>
                </div>
            </PageEditorSettingsPanel>

            <PageEditorSettingsPanel title="SEO Settings" defaultOpen={false} tourId="page-editor-seo">
              <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    SEO Title
                    <Tooltip text="Title displayed in search engine results and browser tabs. Recommended length: 50–60 characters." />
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={seoTitle}
                    onChange={(event) => setSeoTitle(event.target.value)}
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
                    onChange={(event) => setSeoDescription(event.target.value)}
                  />
                </div>

                <div className="mb-0">
                  <label className="form-label d-flex align-items-center">
                    SEO Keywords
                    <Tooltip text="Optional keywords related to the page. Separate multiple keywords with commas." />
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={seoKeywords}
                    onChange={(event) => setSeoKeywords(event.target.value)}
                />
              </div>
            </PageEditorSettingsPanel>
          </div>
        </aside>
      </div>

      <button
        type="button"
        className="btn btn-primary page-editor__mobile-save"
        data-cms-tour="page-editor-mobile-save"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Page"}
      </button>
    </div>
  );
}

CreatePage.Layout = AdminLayout;
