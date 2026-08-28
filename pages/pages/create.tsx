import AdminLayout from "@/components/Layout/AdminLayout";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createPage } from "@/services/pageService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import { extractGrapesParts } from "@/lib/grapesContent";
import PageEditorToolbar from "@/components/Pages/PageEditorToolbar";
import PageEditorMetaFields from "@/components/Pages/PageEditorMetaFields";
import { getAlbumsCached, getMenusCached, scheduleIdleTask } from "@/lib/referenceDataCache";
import { prefetchPagesSwitcherList } from "@/lib/pagesListCache";
import { beginStudioPageSwitch } from "@/lib/studioPageSwitch";

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
  const [settingsOpen, setSettingsOpen] = useState(true);

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

  const handleSave = async (opts?: { publish?: boolean }) => {
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
      const nextVisibility = opts?.publish ? true : visibility;

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
        status: nextVisibility ? "published" : "private",
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

  const handlePageSelect = (nextId: number) => {
    if (!nextId) return;
    if (isDirty && !window.confirm("You have unsaved changes on this new page. Switch without saving?")) return;
    beginStudioPageSwitch(editorType === "grapesjs");
    router.push(`/pages/edit/${nextId}`);
  };

  const metaFields = (
    <PageEditorMetaFields
      mode="create"
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

  if (editorType === "grapesjs") {
    return (
      <GrapesEditor
        fullScreen
        value={grapesContent}
        onChange={setGrapesContent}
        pageTitle={title}
        saveStatus={loading ? "saving" : isDirty ? "unsaved" : "saved"}
        onPageSelect={handlePageSelect}
        onBack={handleCancel}
        onSave={() => void handleSave()}
        onPublish={() => void handleSave({ publish: true })}
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
                <TinyEditor value={tinyContent} onChange={setTinyContent} />
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
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Page"}
      </button>
    </div>
  );
}

CreatePage.Layout = AdminLayout;
