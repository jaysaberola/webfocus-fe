"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getAllPages,
  getMenuById,
  updateMenu,
} from "@/services/menuService";
import PagesPanel from "@/components/MenuBuilder/PagesPanel";
import StructurePanel from "@/components/MenuBuilder/StructurePanel";
import { Page, MenuItem, FlatItem } from "@/components/MenuBuilder/types";
import { toast } from "@/lib/toast";
import {
  flattenTree,
  buildTree,
  serializeMenuTree,
} from "@/components/MenuBuilder/treeUtils";
import CustomUrlPanel from "@/components/MenuBuilder/CustomUrlPanel";

function EditMenu() {
  const router = useRouter();
  const { id } = router.query;

  const [menuName, setMenuName] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [checked, setChecked] = useState<number[]>([]);
  const [tree, setTree] = useState<MenuItem[]>([]);

  /* ================= FETCH PAGES ================= */
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


  /* ================= FETCH MENU ================= */
  useEffect(() => {
    if (!id) return;

    getMenuById(Number(id))
      .then((res) => {
        setMenuName(res.data.data.name);
        setTree(res.data.data.items || []);
      })
      .finally(() => setLoadingMenu(false));
  }, [id]);

  const flatItems = flattenTree(tree);

  /* ================= PAGE SELECTION ================= */
  const togglePage = (id: number) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

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
        target: `${FRONTEND_URL}/public/${p.slug}`,
        children: [],
      }));

    setTree((prev) => [...prev, ...newItems]);
    setChecked([]);
  };

  /* ================= STRUCTURE ================= */
  const handleStructureChange = (flat: FlatItem[]) => {
    setTree(buildTree(flat));
  };

  /* ================= UPDATE MENU ================= */
  const saveMenu = async () => {
    if (!menuName.trim()) {
      toast.error("Menu name is required");
      return;
    }

    try {
      await updateMenu(Number(id), {
        name: menuName,
        items: serializeMenuTree(tree),
        //is_active: true,
      });

      toast.success("Menu updated!");
      //router.push("/menu");
    } catch (error) {
      toast.error("Failed to update menu");
      console.error(error);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Edit Menu</h3>

      {loadingPages && <div className="text-muted">Loading pages...</div>}

      <div className="mb-3">
        <label className="form-label">
          Menu Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
        />
      </div>

      <div className="row">
        <div className="col-md-4">
          <PagesPanel
            pages={pages}
            checked={checked}
            onToggle={togglePage}
            onAdd={addPages}
          />
          <CustomUrlPanel
            onAdd={(item) =>
              setTree((prev) => [...prev, item])
            }
          />
        </div>

        <div className="col-md-8">
          <StructurePanel
            flatItems={flatItems}
            onChange={handleStructureChange}
          />
        </div>
      </div>

      <div className="btn-group mt-3">
        <button
          className="btn btn-primary"
          onClick={saveMenu}
          disabled={!menuName.trim() || tree.length === 0}
        >
          Update Menu
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => router.push("/menu")}
        >
          Cancel
        </button>
      </div>

      <pre className="mt-4 bg-dark text-white p-3">
        {JSON.stringify(tree, null, 2)}
      </pre>
    </div>
  );
}

EditMenu.Layout = AdminLayout;
export default EditMenu;
