import AdminLayout from "@/components/Layout/AdminLayout";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { getPageById, updatePage } from "@/services/pageService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";
import Tooltip from "@/components/UI/Tooltip";
import { isDefaultProtectedPage } from "@/lib/defaultPages";
import PageEditorToolbar from "@/components/Pages/PageEditorToolbar";
import PageEditorSettingsPanel from "@/components/Pages/PageEditorSettingsPanel";
import { getAlbumsCached, getMenusCached, scheduleIdleTask } from "@/lib/referenceDataCache";
import { prefetchPagesSwitcherList, invalidatePagesSwitcherListCache } from "@/lib/pagesListCache";

const TinyEditor = dynamic(() => import("@/components/UI/Editor"), {
  ssr: false,
  loading: () => <div className="page-editor__editor-placeholder">Loading editor...</div>,
});

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), {
  ssr: false,
  loading: () => <div className="page-editor__editor-placeholder">Loading visual builder...</div>,
});
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
  const pageId = Number(id);

  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [tinyContent, setTinyContent] = useState("");
  const [grapesContent, setGrapesContent] = useState("");
  const [editorType, setEditorType] = useState<"tinymce" | "grapesjs">("tinymce");
  const [visibility, setVisibility] = useState(true);
  const [albumId, setAlbumId] = useState<number | "">("");
  const [albums, setAlbums] = useState<any[]>([]);
  const [menuId, setMenuId] = useState<number | "">("");
  const [menus, setMenus] = useState<any[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [defaultPageLocked, setDefaultPageLocked] = useState(false);
  const [lockedStatus, setLockedStatus] = useState<"published" | "private" | "draft">("published");
  const [savedSnapshot, setSavedSnapshot] = useState<PageSnapshot | null>(null);

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
    if (!savedSnapshot) return false;
    return JSON.stringify(savedSnapshot) !== JSON.stringify(buildSnapshot());
  }, [savedSnapshot, buildSnapshot]);

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
    if (!id || !Number.isFinite(pageId)) return;

    setInitialLoading(true);
    getPageById(pageId)
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

        const nextTitle = page.name || "";
        const nextLabel = page.label || "";
        const nextAlbumId = page.album_id ?? "";
        const nextMenuId = page.menu_id ?? "";
        const nextEditorType = isGrapes ? "grapesjs" : "tinymce";
        const nextVisibility = page.status === "published";
        const nextSeoTitle = page.meta_title || "";
        const nextSeoDescription = page.meta_description || "";
        const nextSeoKeywords = page.meta_keyword || "";

        setTitle(nextTitle);
        setLabel(nextLabel);
        setPageSlug(page.slug || "");
        setAlbumId(nextAlbumId);
        setMenuId(nextMenuId);
        setTinyContent(composedContent);
        setGrapesContent(composedContent);
        setEditorType(nextEditorType);
        setVisibility(nextVisibility);
        setLockedStatus(page.status === "draft" ? "draft" : page.status === "private" ? "private" : "published");
        setDefaultPageLocked(
          isDefaultProtectedPage({
            slug: page.slug,
            label: page.label,
            title: page.name,
            url: page.url,
          }),
        );
        setSeoTitle(nextSeoTitle);
        setSeoDescription(nextSeoDescription);
        setSeoKeywords(nextSeoKeywords);
        setSavedSnapshot({
          title: nextTitle,
          label: nextLabel,
          tinyContent: composedContent,
          grapesContent: composedContent,
          editorType: nextEditorType,
          visibility: nextVisibility,
          albumId: nextAlbumId,
          menuId: nextMenuId,
          seoTitle: nextSeoTitle,
          seoDescription: nextSeoDescription,
          seoKeywords: nextSeoKeywords,
        });
      })
      .finally(() => setInitialLoading(false));
  }, [id, pageId]);

  useEffect(() => {
    const cancel = scheduleIdleTask(() => {
      prefetchPagesSwitcherList();
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

      await updatePage(pageId, {
        name: title,
        label: label || undefined,
        album_id: albumId,
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

      setSavedSnapshot(buildSnapshot());
      invalidatePagesSwitcherListCache();
      prefetchPagesSwitcherList();
      toast.success("Page updated successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(getPageSaveErrorMessage(error, "update"));
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = (nextId: number) => {
    if (nextId === pageId) return;
    if (isDirty && !window.confirm("You have unsaved changes on this page. Switch without saving?")) return;
    router.push(`/pages/edit/${nextId}`);
  };

  if (initialLoading) {
    return (
      <div className="container-fluid px-4 pt-3 page-editor">
        <div className="page-editor-toolbar">
          <div className="text-muted">Loading page editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 pt-3 page-editor">
      <PageEditorToolbar
        pageId={pageId}
        pageTitle={title}
        pageSlug={pageSlug}
        isDirty={isDirty}
        isSaving={loading}
        onSave={handleSave}
        onPageSelect={handlePageSelect}
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
                  <TinyEditor key={pageId} value={tinyContent} onChange={setTinyContent} />
                ) : (
                  <GrapesEditor key={pageId} value={grapesContent} onChange={setGrapesContent} />
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
                    disabled={pageId === 1}
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
                    disabled={pageId === 1}
                    onChange={(event) => setLabel(event.target.value)}
                  />
                </div>

                {pageId !== 1 ? (
                  <>
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
                  </>
                ) : null}

                <div className="form-check form-switch">
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
                {defaultPageLocked ? (
                  <div className="small text-muted mt-2">Default pages cannot change visibility from the editor.</div>
                ) : null}
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

EditPage.Layout = AdminLayout;

export async function getServerSideProps() {
  return { props: {} };
}

export default EditPage;
