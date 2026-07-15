"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useState, useEffect } from "react";
import { axiosInstance } from "@/services/axios";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { toast } from "@/lib/toast";
import { useRouter } from "next/router";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CategoryRow = {
  id: string | number;
  name: string;
  created_at?: any;
  order?: number;
  position?: number;
  sort_order?: number;
};

function normalizeNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function getCategorySortKey(c: any): number | undefined {
  return (
    normalizeNumber(c?.order) ??
    normalizeNumber(c?.sort_order) ??
    normalizeNumber(c?.position) ??
    normalizeNumber(c?.display_order) ??
    normalizeNumber(c?.sequence) ??
    normalizeNumber(c?.ordering) ??
    normalizeNumber(c?.sort) ??
    undefined
  );
}

function getCategoryApiId(c: any): string | number {
  return c?.id ?? c?.category_id ?? c?.service_category_id ?? c?.slug ?? c?.name ?? "";
}

function SortableCategoryItem({ category, children, disabled }: { category: CategoryRow; children: React.ReactNode; disabled?: boolean }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: String(category.id), disabled });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.85 : 1 };
  return (
    <li ref={setNodeRef} style={style} className="list-group-item d-flex justify-content-between align-items-center">
      <div className="me-2" {...attributes} {...listeners} style={{ cursor: disabled ? "not-allowed" : "grab" }}>☰</div>
      {children}
    </li>
  );
}

export default function CreateServiceCategory() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | number | null>(null);

  const localOrderKey = `cms4.serviceCategories.order:${process.env.NEXT_PUBLIC_API_URL || ""}`;

  const readLocalOrder = () => {
    try {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(localOrderKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((x) => String(x)) : null;
    } catch { return null; }
  };

  const writeLocalOrder = (ids: string[]) => {
    try { if (typeof window !== "undefined") window.localStorage.setItem(localOrderKey, JSON.stringify(ids)); } catch { /* ignore */ }
  };

  const clearLocalOrder = () => {
    try { if (typeof window !== "undefined") window.localStorage.removeItem(localOrderKey); } catch { /* ignore */ }
  };

  const loadCategories = async (opts?: { resetDirty?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const endpoints = ["/fetch-service-categories", "/service-categories", "/categories?type=service", "/categories"];
      let list: any[] = [];
      for (const ep of endpoints) {
        try {
          const res = await axiosInstance.get(ep, { headers: { "X-No-Loading": true } });
          const data = res.data?.data ?? res.data ?? [];
          if (Array.isArray(data) && data.length) { list = data; break; }
        } catch { /* try next */ }
      }

      const mapped: CategoryRow[] = list.map((c: any) => ({
        id: getCategoryApiId(c),
        name: c.name ?? c.title ?? String(c),
        created_at: c.created_at ?? c.createdAt,
        order: getCategorySortKey(c),
        sort_order: normalizeNumber(c?.sort_order),
        position: normalizeNumber(c?.position),
      }));

      const hasAnyOrder = mapped.some((c) => typeof c.order === "number");
      let nextCategories = hasAnyOrder ? [...mapped].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : mapped;

      if (!hasAnyOrder) {
        const localIds = readLocalOrder();
        if (localIds?.length) {
          const byId = new Map(nextCategories.map((c) => [String(getCategoryApiId(c)), c]));
          const ordered: CategoryRow[] = [];
          for (const id of localIds) {
            const row = byId.get(String(id));
            if (row) { ordered.push(row); byId.delete(String(id)); }
          }
          for (const row of byId.values()) ordered.push(row);
          if (ordered.length === nextCategories.length) nextCategories = ordered;
        }
      }

      setCategories(nextCategories);
      if (opts?.resetDirty !== false) setOrderDirty(false);
      return nextCategories;
    } catch (e: any) {
      setError(e?.message || "Failed to load categories");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const persistCategoryOrder = async (next: CategoryRow[]) => {
    setSavingOrder(true);
    const failures: string[] = [];

    const verifyAndToast = async () => {
      const reloaded = await loadCategories({ resetDirty: false });
      const expectedIds = next.map((c) => String(getCategoryApiId(c)));
      const actualIds = (reloaded ?? []).map((c) => String(getCategoryApiId(c)));
      const matches = actualIds.length === expectedIds.length && actualIds.every((id, idx) => id === expectedIds[idx]);
      if (matches) { setOrderDirty(false); toast.success("Category order saved"); return true; }
      writeLocalOrder(expectedIds);
      setOrderDirty(false);
      toast.warning("Order saved locally (backend may not persist positions).");
      return false;
    };

    const tryUpdateOrder = async (category: CategoryRow, order: number) => {
      const id = category.id;
      const orderKey = typeof category.sort_order === "number" ? "sort_order" : typeof category.position === "number" ? "position" : "order";
      const bodies = [{ name: category.name, title: category.name, [orderKey]: order }, { [orderKey]: order }];
      for (const body of bodies) {
        for (const method of ["patch", "put"] as const) {
          try { await axiosInstance[method](`/service-categories/${id}`, body, { headers: { "X-No-Loading": true } }); return true; } catch { /* try next */ }
        }
        try { await axiosInstance.post(`/service-categories/${id}`, { ...body, _method: "PUT" }, { headers: { "X-No-Loading": true } }); return true; } catch { /* try next */ }
      }
      return false;
    };

    try {
      for (let i = 0; i < next.length; i++) {
        const ok = await tryUpdateOrder(next[i], i + 1);
        if (!ok) failures.push(String(next[i].name ?? next[i].id));
      }
      if (failures.length) {
        toast.error(`Failed to save order for: ${failures.join(", ")}`);
        await loadCategories({ resetDirty: true });
        return false;
      }
      return await verifyAndToast();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to save category order");
      await loadCategories({ resetDirty: true });
      return false;
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => String(c.id) === String(active.id));
    const newIndex = categories.findIndex((c) => String(c.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(categories, oldIndex, newIndex).map((c, idx) => ({ ...c, order: idx + 1, sort_order: idx + 1, position: idx + 1 }));
    setCategories(next);
    setOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    const next = categories.map((c, idx) => ({ ...c, order: idx + 1, sort_order: idx + 1, position: idx + 1 }));
    setCategories(next);
    const ok = await persistCategoryOrder(next);
    if (!ok) setOrderDirty(true);
  };

  const handleSubmit = async () => {
    if (!name) return toast.error("Please provide category name");
    try {
      const endpoints = ["/service-categories", "/create-service-category"];
      let created: any = null;
      for (const ep of endpoints) {
        try {
          const res = await axiosInstance.post(ep, { name: name.trim(), title: name.trim() });
          created = res.data?.data ?? res.data ?? {};
          break;
        } catch { /* try next */ }
      }
      if (!created) { toast.error("Failed to create category: no endpoint succeeded"); return; }
      toast.success("Category created");
      setName("");
      await loadCategories();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to create category");
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Create Service Category</h3>

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Category Name</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter category name" />
          </div>
          <div>
            <button className="btn btn-primary" type="button" onClick={handleSubmit}>Save Category</button>
            <button className="btn btn-outline-secondary ms-2" type="button" onClick={() => router.push("/services")}>Back to Services</button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <h5 className="mb-0">Existing Categories</h5>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => { clearLocalOrder(); loadCategories(); }} disabled={loading || savingOrder}>Reset</button>
            <button className="btn btn-sm btn-primary" type="button" onClick={handleSaveOrder} disabled={!orderDirty || savingOrder || !!editingId}>
              {savingOrder ? "Saving…" : "Save order"}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            {loading && <div>Loading categories…</div>}
            {error && <div className="text-danger">{error}</div>}
            {!loading && categories.length === 0 && <div className="text-muted">No categories found.</div>}
            {!loading && categories.length > 0 && (
              <>
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={categories.map((c) => String(c.id))} strategy={verticalListSortingStrategy}>
                    <ul className="list-group">
                      {categories.map((c, idx) => (
                        <SortableCategoryItem key={String(c.id)} category={c} disabled={savingOrder || !!editingId}>
                          <div style={{ flex: 1 }}>
                            <span className="badge bg-secondary me-2">{idx + 1}</span>
                            {editingId === c.id ? (
                              <div className="d-flex gap-2">
                                <input className="form-control form-control-sm" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                                <button className="btn btn-sm btn-primary" type="button" onClick={async () => {
                                  if (!editingName.trim()) return toast.error("Name required");
                                  try {
                                    const id = c.id;
                                    const nextName = editingName.trim();
                                    let ok = false;
                                    for (const attempt of [
                                      () => axiosInstance.put(`/service-categories/${id}`, { name: nextName, title: nextName }),
                                      () => axiosInstance.patch(`/service-categories/${id}`, { name: nextName, title: nextName }),
                                      () => axiosInstance.post(`/service-categories/${id}`, { name: nextName, title: nextName, _method: "PUT" }),
                                    ]) {
                                      try { await attempt(); ok = true; break; } catch { /* try next */ }
                                    }
                                    if (!ok) { toast.error("Failed to update category"); return; }
                                    toast.success("Category updated");
                                    setEditingId(null); setEditingName("");
                                    await loadCategories();
                                  } catch (err: any) {
                                    toast.error(err?.response?.data?.message || err?.message || "Failed to update category");
                                  }
                                }}>Save</button>
                                <button className="btn btn-sm btn-secondary" type="button" onClick={() => { setEditingId(null); setEditingName(""); }}>Cancel</button>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center justify-content-between">
                                <div>
                                  <div className="fw-bold">{c.name}</div>
                                  <div className="text-muted" style={{ fontSize: 12 }}>{c.created_at ? new Date(c.created_at).toLocaleString() : "—"}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="ms-3 d-flex gap-2">
                            {editingId !== c.id && (
                              <>
                                <button className="btn btn-sm btn-outline-secondary" type="button" title="Edit" onClick={() => { setEditingId(c.id); setEditingName(c.name); }}><i className="fas fa-edit" /></button>
                                <button className="btn btn-sm btn-outline-danger" type="button" title="Delete" onClick={() => setShowDeleteConfirmId(c.id)}><i className="fas fa-trash" /></button>
                              </>
                            )}
                          </div>
                        </SortableCategoryItem>
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
                <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                  Drag ☰ to reorder. Click <strong>Save order</strong> to apply.{orderDirty ? " (Unsaved changes)" : ""}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        show={!!showDeleteConfirmId}
        title="Delete category"
        message={<span>Are you sure you want to delete this category? This action cannot be undone.</span>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={async () => {
          if (!showDeleteConfirmId) return;
          try {
            const id = showDeleteConfirmId;
            let ok = false;
            for (const attempt of [
              () => axiosInstance.delete(`/service-categories/${id}`),
              () => axiosInstance.post(`/service-categories/${id}`, { _method: "DELETE" }),
              () => axiosInstance.delete(`/service-categories/${id}`, { data: { id } } as any),
            ]) {
              try { await attempt(); ok = true; break; } catch { /* try next */ }
            }
            if (!ok) { toast.error("Failed to delete category"); setShowDeleteConfirmId(null); return; }
            toast.success("Category deleted");
            setShowDeleteConfirmId(null);
            await loadCategories();
          } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || "Failed to delete category");
            setShowDeleteConfirmId(null);
          }
        }}
        onCancel={() => setShowDeleteConfirmId(null)}
      />
    </div>
  );
}

CreateServiceCategory.Layout = AdminLayout;
