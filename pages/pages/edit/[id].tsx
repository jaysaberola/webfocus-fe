import AdminLayout from "@/components/Layout/AdminLayout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getPageById, updatePage } from "@/services/pageService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";
import { isDefaultProtectedPage } from "@/lib/defaultPages";
import PageEditorToolbar from "@/components/Pages/PageEditorToolbar";
import PageEditorMetaFields from "@/components/Pages/PageEditorMetaFields";
import { getAlbumsCached, getMenusCached, scheduleIdleTask } from "@/lib/referenceDataCache";
import { prefetchPagesSwitcherList, invalidatePagesSwitcherListCache } from "@/lib/pagesListCache";
import { syncAuthTokenCookieFromStorage } from "@/lib/authToken";
import { beginStudioPageSwitch, consumeStudioPageSwitch } from "@/lib/studioPageSwitch";

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
  const [settingsOpen, setSettingsOpen] = useState(true);
  const pendingStudioSwitchRef = useRef(consumeStudioPageSwitch());
  const [pageSwitching, setPageSwitching] = useState(pendingStudioSwitchRef.current.active);
  const previousPageIdRef = useRef<number | null>(null);

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

    const isSwitch = previousPageIdRef.current != null && previousPageIdRef.current !== pageId;
    previousPageIdRef.current = pageId;
    setInitialLoading(true);
    if (isSwitch) setPageSwitching(true);

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
      .finally(() => {
        setInitialLoading(false);
        setPageSwitching(false);
      });
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

  const handleSave = async (opts?: { silent?: boolean; publish?: boolean }) => {
    if (!title.trim()) {
      if (!opts?.silent) toast.error("Page title is required");
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
      const nextVisibility = defaultPageLocked ? visibility : opts?.publish ? true : visibility;

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
        status: defaultPageLocked ? lockedStatus : nextVisibility ? "published" : "private",
        meta_title: seoTitle || undefined,
        meta_description: seoDescription || undefined,
        meta_keyword: seoKeywords || undefined,
      });

      if (!defaultPageLocked && opts?.publish) setVisibility(true);
      setSavedSnapshot({
        ...buildSnapshot(),
        visibility: nextVisibility,
      });
      invalidatePagesSwitcherListCache();
      prefetchPagesSwitcherList();
      if (!opts?.silent) toast.success(opts?.publish ? "Page published" : "Page updated successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(getPageSaveErrorMessage(error, "update"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!isDirty || initialLoading) return;
    const timer = window.setTimeout(() => {
      void handleSaveRef.current({ silent: true });
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [isDirty, grapesContent, tinyContent, title, label, visibility, albumId, menuId, seoTitle, seoDescription, seoKeywords, editorType, initialLoading]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handlePageSelect = (nextId: number) => {
    if (nextId === pageId) return;
    if (isDirty && !window.confirm("You have unsaved changes on this page. Switch without saving?")) return;
    beginStudioPageSwitch(editorType === "grapesjs");
    setPageSwitching(true);
    pendingStudioSwitchRef.current = { active: true, fromGrapes: editorType === "grapesjs" };
    router.push(`/pages/edit/${nextId}`);
  };

  const metaFields = (
    <PageEditorMetaFields
      mode="edit"
      pageId={pageId}
      title={title}
      onTitleChange={setTitle}
      label={label}
      onLabelChange={setLabel}
      albumId={albumId}
      onAlbumIdChange={setAlbumId}
      albums={albums}
      menuId={menuId}
      onMenuIdChange={setMenuId}
      menus={menus}
      visibility={visibility}
      onVisibilityChange={setVisibility}
      defaultPageLocked={defaultPageLocked}
      seoTitle={seoTitle}
      onSeoTitleChange={setSeoTitle}
      seoDescription={seoDescription}
      onSeoDescriptionChange={setSeoDescription}
      seoKeywords={seoKeywords}
      onSeoKeywordsChange={setSeoKeywords}
      editorType={editorType}
      onEditorTypeChange={handleEditorTypeChange}
      showEditorToggle
    />
  );

  const keepStudioVisible =
    editorType === "grapesjs" || (pageSwitching && pendingStudioSwitchRef.current.fromGrapes);

  if (initialLoading && !keepStudioVisible) {
    return (
      <div className="container-fluid px-4 pt-3 page-editor">
        <div className="page-editor-toolbar">
          <div className="text-muted">Loading page editor...</div>
        </div>
      </div>
    );
  }

  if (keepStudioVisible) {
    return (
      <GrapesEditor
        fullScreen
        value={grapesContent}
        onChange={setGrapesContent}
        pageTitle={title}
        saveStatus={loading ? "saving" : isDirty ? "unsaved" : "saved"}
        pageId={pageId}
        isPageLoading={initialLoading || pageSwitching}
        onPageSelect={handlePageSelect}
        onCreatePage={() => {
          if (isDirty && !window.confirm("You have unsaved changes on this page. Switch without saving?")) return;
          router.push("/pages/create");
        }}
        onBack={() => {
          if (isDirty && !window.confirm("You have unsaved changes. Leave this page anyway?")) return;
          router.push("/pages");
        }}
        onSave={() => void handleSave()}
        onPublish={() => void handleSave({ publish: true })}
        onPreviewPublic={() => {
          syncAuthTokenCookieFromStorage();
          window.open(`/pages/preview/${pageId}`, "_blank", "noopener,noreferrer");
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onCloseSettings={() => setSettingsOpen(false)}
        settingsOpen={settingsOpen}
        settingsPanel={metaFields}
      />
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
        onSave={() => void handleSave()}
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
                    checked
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
                    checked={false}
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
                <TinyEditor key={pageId} value={tinyContent} onChange={setTinyContent} />
              </div>
            </div>
          </div>
        </div>

        <aside className="page-editor__sidebar" data-cms-tour="page-editor-sidebar">
          {metaFields}
        </aside>
      </div>

      <button
        type="button"
        className="btn btn-primary page-editor__mobile-save"
        data-cms-tour="page-editor-mobile-save"
        onClick={() => void handleSave()}
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
