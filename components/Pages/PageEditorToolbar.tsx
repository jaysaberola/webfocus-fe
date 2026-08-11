import Link from "next/link";
import PageSwitcher from "./PageSwitcher";
import { useCmsHelp } from "@/lib/cmsHelp/CmsHelpContext";
import { syncAuthTokenCookieFromStorage } from "@/lib/authToken";

type PageEditorToolbarProps = {
  mode?: "edit" | "create";
  pageId?: number;
  pageTitle: string;
  pageSlug?: string;
  isDirty?: boolean;
  isSaving: boolean;
  onSave: () => void;
  onPageSelect?: (pageId: number) => void;
  onCancel?: () => void;
};

export default function PageEditorToolbar({
  mode = "edit",
  pageId,
  pageTitle,
  pageSlug,
  isDirty = false,
  isSaving,
  onSave,
  onPageSelect,
  onCancel,
}: PageEditorToolbarProps) {
  const { openHelp } = useCmsHelp();
  const isCreate = mode === "create";
  const saveLabel = "Save Page";
  const savingLabel = "Saving...";
  const guideId = isCreate ? "pages-create" : "pages-edit";

  return (
    <div className="page-editor-toolbar" data-cms-tour="page-editor-toolbar">
      <div className="page-editor-toolbar__left">
        <nav className="page-editor-toolbar__breadcrumb" aria-label="Breadcrumb" data-cms-tour="page-editor-breadcrumb">
          <Link href="/pages" className="page-editor-toolbar__crumb">
            <i className="fa-solid fa-table-list" aria-hidden="true" />
            Manage Pages
          </Link>
          <span className="page-editor-toolbar__sep" aria-hidden="true">
            /
          </span>
          <span className="page-editor-toolbar__current">{isCreate ? "Create" : "Edit"}</span>
        </nav>

        {isCreate ? (
          <div className="page-editor-toolbar__new-page" data-cms-tour="page-editor-page-switcher">
            <span className="page-editor-toolbar__new-page-label">New page</span>
            <strong>{pageTitle.trim() || "Untitled page"}</strong>
          </div>
        ) : (
          <div data-cms-tour="page-editor-page-switcher">
            <PageSwitcher
              currentPageId={pageId!}
              currentTitle={pageTitle}
              onSelect={onPageSelect!}
            />
          </div>
        )}

        {!isCreate ? (
          isDirty ? (
            <span
              className="page-editor-toolbar__status page-editor-toolbar__status--dirty"
              data-cms-tour="page-editor-status"
            >
              <i className="fa-solid fa-circle" aria-hidden="true" />
              Unsaved changes
            </span>
          ) : (
            <span
              className="page-editor-toolbar__status page-editor-toolbar__status--saved"
              data-cms-tour="page-editor-status"
            >
              <i className="fa-solid fa-check" aria-hidden="true" />
              Saved
            </span>
          )
        ) : null}
      </div>

      <div className="page-editor-toolbar__actions" data-cms-tour="page-editor-actions">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary page-editor-toolbar__btn page-editor-toolbar__btn--guide"
          data-cms-tour="page-editor-guide"
          onClick={() => openHelp(guideId)}
          title="Open page editor guide"
        >
          <i className="fa-solid fa-circle-question" aria-hidden="true" />
          <span className="d-none d-md-inline">Guide</span>
        </button>

        {!isCreate ? (
          <Link href="/pages/create" className="btn btn-sm btn-outline-primary page-editor-toolbar__btn">
            <i className="fa-solid fa-plus" aria-hidden="true" />
            New Page
          </Link>
        ) : null}

        {!isCreate && pageId ? (
          <a
            href={`/pages/preview/${pageId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-secondary page-editor-toolbar__btn"
            data-cms-tour="page-editor-preview"
            onClick={() => syncAuthTokenCookieFromStorage()}
          >
            <i className="fa-solid fa-eye" aria-hidden="true" />
            Preview
          </a>
        ) : null}

        {!isCreate && pageSlug ? (
          <a
            href={`/public/${pageSlug.replace(/^\/+/, "").replace(/^public\//, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-secondary page-editor-toolbar__btn d-none d-lg-inline-flex"
          >
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
            Live
          </a>
        ) : null}

        {isCreate && onCancel ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary page-editor-toolbar__btn"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        ) : null}

        <button
          type="button"
          className="btn btn-sm btn-primary page-editor-toolbar__btn page-editor-toolbar__btn--save"
          data-cms-tour="page-editor-save"
          onClick={onSave}
          disabled={isSaving}
        >
          <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
          {isSaving ? savingLabel : saveLabel}
        </button>
      </div>
    </div>
  );
}
