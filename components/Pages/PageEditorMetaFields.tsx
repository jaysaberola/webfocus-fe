import Tooltip from "@/components/UI/Tooltip";
import PageEditorSettingsPanel from "@/components/Pages/PageEditorSettingsPanel";

type EditorType = "tinymce" | "grapesjs";

type AlbumRow = { id: number; name?: string };
type MenuRow = { id: number; name?: string };

type PageEditorMetaFieldsProps = {
  mode?: "create" | "edit";
  pageId?: number;
  title: string;
  onTitleChange: (value: string) => void;
  label: string;
  onLabelChange: (value: string) => void;
  albumId: number | "";
  onAlbumIdChange: (value: number | "") => void;
  albums: AlbumRow[];
  menuId: number | "";
  onMenuIdChange: (value: number | "") => void;
  menus: MenuRow[];
  visibility: boolean;
  onVisibilityChange: (value: boolean) => void;
  defaultPageLocked?: boolean;
  seoTitle: string;
  onSeoTitleChange: (value: string) => void;
  seoDescription: string;
  onSeoDescriptionChange: (value: string) => void;
  seoKeywords: string;
  onSeoKeywordsChange: (value: string) => void;
  editorType?: EditorType;
  onEditorTypeChange?: (next: EditorType) => void;
  showEditorToggle?: boolean;
};

export default function PageEditorMetaFields({
  mode = "edit",
  pageId,
  title,
  onTitleChange,
  label,
  onLabelChange,
  albumId,
  onAlbumIdChange,
  albums,
  menuId,
  onMenuIdChange,
  menus,
  visibility,
  onVisibilityChange,
  defaultPageLocked = false,
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
  seoKeywords,
  onSeoKeywordsChange,
  editorType,
  onEditorTypeChange,
  showEditorToggle = false,
}: PageEditorMetaFieldsProps) {
  const lockCoreFields = mode === "edit" && pageId === 1;
  const showRelations = mode === "create" || pageId !== 1;

  return (
    <div className="page-editor__settings-stack">
      {showEditorToggle && onEditorTypeChange ? (
        <PageEditorSettingsPanel title="Editor">
          <div className="page-editor__editor-toggle">
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="studioEditorType"
                id="studioEditorTinyMce"
                checked={editorType === "tinymce"}
                onChange={() => onEditorTypeChange("tinymce")}
              />
              <label className="form-check-label" htmlFor="studioEditorTinyMce">
                TinyMCE
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="studioEditorType"
                id="studioEditorGrapes"
                checked={editorType === "grapesjs"}
                onChange={() => onEditorTypeChange("grapesjs")}
              />
              <label className="form-check-label" htmlFor="studioEditorGrapes">
                Visual Builder
              </label>
            </div>
          </div>
        </PageEditorSettingsPanel>
      ) : null}

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
            disabled={lockCoreFields}
            onChange={(event) => onTitleChange(event.target.value)}
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
            disabled={lockCoreFields}
            onChange={(event) => onLabelChange(event.target.value)}
          />
        </div>

        {showRelations ? (
          <>
            <div className="mb-3">
              <label className="form-label d-flex align-items-center">
                Album (optional)
                <Tooltip text="Attach this page to an album to group related pages like galleries or portfolios." />
              </label>
              <select
                className="form-select"
                value={albumId}
                onChange={(event) => onAlbumIdChange(event.target.value ? Number(event.target.value) : 0)}
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
                onChange={(event) => onMenuIdChange(event.target.value ? Number(event.target.value) : 0)}
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
              onVisibilityChange(!visibility);
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
            onChange={(event) => onSeoTitleChange(event.target.value)}
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
            onChange={(event) => onSeoDescriptionChange(event.target.value)}
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
            onChange={(event) => onSeoKeywordsChange(event.target.value)}
          />
        </div>
      </PageEditorSettingsPanel>
    </div>
  );
}
