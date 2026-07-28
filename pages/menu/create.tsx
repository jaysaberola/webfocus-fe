"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAllPages, createMenu } from "@/services/menuService";
import PagesPanel from "@/components/MenuBuilder/PagesPanel";
import StructurePanel from "@/components/MenuBuilder/StructurePanel";
import CustomUrlPanel from "@/components/MenuBuilder/CustomUrlPanel";
import { Page, MenuItem, FlatItem } from "@/components/MenuBuilder/types";
import { toast } from "@/lib/toast";
import {
  flattenTree,
  buildTree,
  serializeMenuTree,
} from "@/components/MenuBuilder/treeUtils";
import { buildPublicPageMenuTarget } from "@/lib/publicMenuLinks";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import {
  CmsSettingsField,
  CmsSettingsFooter,
  CmsSettingsGrid,
  CmsSettingsLayout,
  CmsSettingsSection,
} from "@/components/Modules/CmsSettingsForm";

function CreateMenu() {
  const [menuName, setMenuName] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);

  const [checked, setChecked] = useState<number[]>([]);
  const [tree, setTree] = useState<MenuItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    getAllPages()
      .then((res) =>
        setPages(
          res.map((p) => ({
            id: p.id,
            title: p.name,
            slug: p.slug,
          }))
        )
      )
      .finally(() => setLoadingPages(false));
  }, []);


  const flatItems = flattenTree(tree);

  const togglePage = (id: number) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const addPages = () => {
    const newItems: MenuItem[] = pages
      .filter(
        (p) =>
          checked.includes(p.id) &&
          !flatItems.some((i) => i.id === p.id)
      )
      .map((p) => ({
        id: p.id,
        label: p.title,
        type: "page",
        target: buildPublicPageMenuTarget(p.slug),
        children: [],
      }));

    setTree((prev) => [...prev, ...newItems]);
    setChecked([]);
  };


  const handleStructureChange = (flat: FlatItem[]) => {
    setTree(buildTree(flat));
  };

  const saveMenu = async () => {
    if (!menuName.trim()) {
      toast.error("Menu name is required");
      return;
    }

    if (tree.length === 0) {
      toast.error("Add at least one menu item");
      return;
    }

    try {
      await createMenu({
        name: menuName,
        items: serializeMenuTree(tree),
        is_active: false,
      });

      toast.success("Menu saved!");
      router.push("/menu");
    } catch (error) {
      toast.error("Failed to save menu");
      console.error(error);
    }
  };

  return (
    <CmsModuleShell
      title="Create a Menu"
      description="Build a navigation menu by adding pages, custom links, and organizing the structure with drag and drop."
      icon="fa-solid fa-bars"
      stats={[
        { label: "Menu Name", value: menuName.trim() || "Untitled" },
        { label: "Menu Items", value: flatItems.length, tone: "accent" },
        { label: "Pages Available", value: pages.length },
      ]}
    >
      <CmsSettingsLayout>
        <CmsSettingsSection
          title="Menu Details"
          description="Give your menu a name before adding items."
          icon="fa-solid fa-pen-to-square"
        >
          <CmsSettingsGrid columns={1}>
            <CmsSettingsField label="Menu Name" required>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Main Navigation"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
              />
            </CmsSettingsField>
          </CmsSettingsGrid>
        </CmsSettingsSection>

        {loadingPages ? (
          <div className="text-muted py-3">Loading pages...</div>
        ) : (
          <div className="cms-create-grid">
            <div className="d-flex flex-column gap-3">
              <PagesPanel
                pages={pages}
                checked={checked}
                onToggle={togglePage}
                onAdd={addPages}
              />
              <CustomUrlPanel onAdd={(item) => setTree((prev) => [...prev, item])} />
            </div>

            <StructurePanel flatItems={flatItems} onChange={handleStructureChange} />
          </div>
        )}

        <CmsSettingsFooter onSave={saveMenu} saveLabel="Save Menu">
          <button
            type="button"
            className="btn btn-outline-secondary cms-module__toolbar-btn"
            onClick={() => router.push("/menu")}
          >
            Cancel
          </button>
        </CmsSettingsFooter>
      </CmsSettingsLayout>
    </CmsModuleShell>
  );
}

CreateMenu.Layout = AdminLayout;
export default CreateMenu;
