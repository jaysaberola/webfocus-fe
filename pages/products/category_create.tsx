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
    normalizeNumber(c?.sort_index) ??
    normalizeNumber(c?.sortIndex) ??
    normalizeNumber(c?.order_index) ??
    normalizeNumber(c?.orderIndex) ??
    normalizeNumber(c?.rank) ??
    undefined
  );
}

function getCategoryApiId(c: any): string | number {
  return (
    c?.id ??
    c?.category_id ??
    c?.product_category_id ??
    c?.productCategoryId ??
    c?.slug ??
    c?.name ??
    ""
  );
}

function SortableCategoryItem({
  category,
  children,
  disabled,
}: {
  category: CategoryRow;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: String(category.id),
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="list-group-item d-flex justify-content-between align-items-center">
      <div className="me-2" {...attributes} {...listeners} style={{ cursor: disabled ? "not-allowed" : "grab" }}>
        ☰
      </div>
      {children}
    </li>
  );
}

export default function CreateProductCategory() {
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

  const localOrderKey = `cms4.productCategories.order:${process.env.NEXT_PUBLIC_API_URL || ""}`;

  const readLocalOrder = () => {
    try {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(localOrderKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return parsed.map((x) => String(x));
    } catch {
      return null;
    }
  };

  const writeLocalOrder = (ids: string[]) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(localOrderKey, JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  const clearLocalOrder = () => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(localOrderKey);
    } catch {
      // ignore
    }
  };

  const loadCategories = async (opts?: { resetDirty?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const endpoints = ["/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
      let list: any[] = [];
      for (const ep of endpoints) {
        try {
          const res = await (await import('@/services/axios')).axiosInstance.get(ep, { headers: { 'X-No-Loading': true } });
          const data = res.data?.data ?? res.data ?? [];
          if (Array.isArray(data) && data.length) { list = data; break; }
        } catch (e) {
          // try next
        }
      }
      const mapped: CategoryRow[] = list.map((c: any) => ({
        id: getCategoryApiId(c),
        name: c.name ?? c.title ?? String(c),
        created_at: c.created_at ?? c.createdAt ?? c.created_at_formatted ?? c.created,
        order: getCategorySortKey(c),
        sort_order: normalizeNumber(c?.sort_order),
        position: normalizeNumber(c?.position),
      }));

      // Sort by explicit order if present; otherwise use locally-saved order (if any).
      const hasAnyOrder = mapped.some((c) => typeof c.order === "number");
      let nextCategories = hasAnyOrder
        ? [...mapped].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : mapped;

      if (!hasAnyOrder) {
        const localIds = readLocalOrder();
        if (localIds && localIds.length) {
          const byId = new Map(nextCategories.map((c) => [String(getCategoryApiId(c)), c]));
          const ordered: CategoryRow[] = [];

          for (const id of localIds) {
            const row = byId.get(String(id));
            if (row) {
              ordered.push(row);
              byId.delete(String(id));
            }
          }

          // Append any categories not in local list (new ones, etc.)
          for (const row of byId.values()) ordered.push(row);

          // Only apply if it actually reorders the list
          if (ordered.length === nextCategories.length) nextCategories = ordered;
        }
      }

      setCategories(nextCategories);
      if (opts?.resetDirty !== false) setOrderDirty(false);
      return nextCategories;
    } catch (e: any) {
      console.error('Failed to load categories', e);
      setError(e?.message || 'Failed to load categories');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const persistCategoryOrder = async (next: CategoryRow[]) => {
    setSavingOrder(true);
    const failures: string[] = [];

    const headers = { headers: { "X-No-Loading": true } };

    const expectedIds = next.map((c) => String(getCategoryApiId(c)));
    const orderPairs = next.map((c, idx) => ({ id: getCategoryApiId(c), order: idx + 1 }));

    const verifyAndToast = async () => {
      const reloaded = await loadCategories({ resetDirty: false });
      const actualIds = (reloaded ?? []).map((c) => String(getCategoryApiId(c)));

      const matches =
        actualIds.length === expectedIds.length &&
        actualIds.every((id, idx) => id === expectedIds[idx]);

      if (matches) {
        setOrderDirty(false);
        toast.success("Category order saved");
        return true;
      }

      // Backend didn't return the same order (either it didn't persist, or it doesn't sort by it).
      // Store locally so refresh keeps the chosen order in this browser.
      writeLocalOrder(expectedIds);
      setOrderDirty(false);
      toast.warning(
        "Order was not retained after reload. Saved locally in this browser; backend may not persist/sort category positions yet."
      );
      return false;
    };

    // NOTE:
    // We intentionally do NOT attempt “bulk reorder” endpoints here.
    // Many backends don’t implement them, which causes 404/405 spam and can trigger 429 rate limits.

    const tryUpdateOrder = async (category: CategoryRow, order: number) => {
      const id = category.id;

      // Prefer the resource endpoint used elsewhere in this page.
      // (We keep this list short to avoid hammering the API.)
      const endpoints = [`/product-categories/${id}`];

      const orderKey: "order" | "sort_order" | "position" =
        typeof category.sort_order === "number"
          ? "sort_order"
          : typeof category.position === "number"
            ? "position"
            : "order";

      // Some backends validate strictly; try one key at a time.
      const bodies: any[] = [
        // strict backends might require name/title on update
        { name: category.name, title: category.name, [orderKey]: order },
        { [orderKey]: order },
      ];

      for (const ep of endpoints) {
        for (const body of bodies) {
          try {
            await axiosInstance.patch(ep, body, headers);
            return true;
          } catch {
            // ignore
          }

          try {
            await axiosInstance.put(ep, body, headers);
            return true;
          } catch {
            // ignore
          }

          try {
            await axiosInstance.post(ep, { ...body, _method: "PUT" }, headers);
            return true;
          } catch {
            // ignore
          }
        }
      }

      return false;
    };

    try {
      // Persist as 1-based ordering
      for (let index = 0; index < next.length; index++) {
        const c = next[index];
        const order = index + 1;
        const ok = await tryUpdateOrder(c, order);
        if (!ok) failures.push(String(c.name ?? c.id));
      }

      if (failures.length) {
        toast.error(`Failed to save order for: ${failures.join(", ")}`);
        // Reload from server so UI stays consistent with what backend supports
        await loadCategories({ resetDirty: true });
        return false;
      }

      // Verification reload can still help, but avoid forcing dirty=false if API doesn't reflect order.
      return await verifyAndToast();
    } catch (e: any) {
      console.error("Save category order error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to save category order");
      await loadCategories({ resetDirty: true });
      return false;
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => String(c.id) === String(active.id));
    const newIndex = categories.findIndex((c) => String(c.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(categories, oldIndex, newIndex).map((c, idx) => ({
      ...c,
      order: idx + 1,
      sort_order: idx + 1,
      position: idx + 1,
    }));
    setCategories(next);
    setOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    const next = categories.map((c, idx) => ({
      ...c,
      order: idx + 1,
      sort_order: idx + 1,
      position: idx + 1,
    }));
    setCategories(next);
    const ok = await persistCategoryOrder(next);
    if (!ok) setOrderDirty(true);
    return ok;
  };

  const handleSubmit = async () => {
    if (!name) return toast.error("Please provide category name");

    const endpoints = ["/product-categories"];
    let created: any = null;
    try {
      for (const ep of endpoints) {
        try {
          const res = await (await import('@/services/axios')).axiosInstance.post(ep, { name: name.trim(), title: name.trim() });
          const data = res.data?.data ?? res.data ?? {};
          created = data;
          break;
        } catch (e) {
          // try next endpoint
        }
      }

      if (!created) {
        toast.error("Failed to create category: no endpoint succeeded");
        return;
      }

      toast.success("Category created");
      router.push("/products");
    } catch (e: any) {
      console.error("Create category error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to create category");
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Create Product Category</h3>

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Category Name</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <button className="btn btn-primary" onClick={handleSubmit}>Save Category</button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <h5 className="mb-0">Existing Categories</h5>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              type="button"
              onClick={() => {
                clearLocalOrder();
                loadCategories();
              }}
              disabled={loading || savingOrder}
              title="Reload categories and discard locally-saved order"
            >
              Reset
            </button>
            <button
              className="btn btn-sm btn-primary"
              type="button"
              onClick={handleSaveOrder}
              disabled={!orderDirty || savingOrder || !!editingId}
              title={editingId ? "Finish editing before saving order" : "Save the current drag order"}
            >
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
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => String(c.id))}
                  strategy={verticalListSortingStrategy}
                >
                <ul className="list-group">
                {categories.map((c: any, idx: number) => (
                  <SortableCategoryItem key={String(c.id)} category={c} disabled={savingOrder || !!editingId}>
                    <div style={{ flex: 1 }}>
                      <span className="badge bg-secondary me-2">{idx + 1}</span>
                      {editingId === c.id ? (
                        <div className="d-flex gap-2">
                          <input className="form-control form-control-sm" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                          <button className="btn btn-sm btn-primary" onClick={async () => {
                            if (!editingName.trim()) return toast.error('Name required');
                            try {
                              const id = c.id;
                              const nextName = editingName.trim();
                              let ok = false;
                              let lastErr: any = null;

                              const attempts: Array<() => Promise<any>> = [
                                // Try REST-style update first (if backend supports it)
                                () => axiosInstance.put(`/product-categories/${id}`, { name: nextName, title: nextName }),
                                () => axiosInstance.patch(`/product-categories/${id}`, { name: nextName, title: nextName }),
                                () => axiosInstance.post(`/product-categories/${id}`, { name: nextName, title: nextName, _method: 'PUT' } as any),
                              ];

                              for (const attempt of attempts) {
                                try {
                                  await attempt();
                                  ok = true;
                                  break;
                                } catch (e) {
                                  lastErr = e;
                                }
                              }

                              if (!ok) {
                                const status = lastErr?.response?.status;
                                const message = lastErr?.response?.data?.message || lastErr?.message || 'Failed to update category';
                                toast.error(
                                  status === 405
                                    ? 'Update failed: backend does not support updating product categories.'
                                    : message
                                );
                                return;
                              }
                              toast.success('Category updated');
                              setEditingId(null); setEditingName('');
                              await loadCategories();
                            } catch (err: any) {
                              console.error('Update category error', err);
                              toast.error(err?.response?.data?.message || err?.message || 'Failed to update category');
                            }
                          }}>Save</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => { setEditingId(null); setEditingName(''); }}>Cancel</button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <div className="fw-bold">{c.name}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{(c.created_at && new Date(c.created_at).toLocaleString()) ?? '-'}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ms-3 d-flex gap-2">
                      {editingId !== c.id && (
                        <>
                          <button className="btn btn-sm btn-outline-secondary" title="Edit" onClick={() => { setEditingId(c.id); setEditingName(c.name); }}><i className="fas fa-edit" /></button>
                          <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => setShowDeleteConfirmId(c.id)}><i className="fas fa-trash" /></button>
                        </>
                      )}
                    </div>
                  </SortableCategoryItem>
                ))}
              </ul>
              </SortableContext>
              </DndContext>
            )}
            {!loading && categories.length > 0 && (
              <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                Drag ☰ to reorder. Click <strong>Save order</strong> to apply changes.
                {orderDirty ? " (Unsaved changes)" : ""}
              </div>
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
            const endpoints = [`/product-categories/${id}`];
            let ok = false;
            let lastErr: any = null;

            const attempts: Array<() => Promise<any>> = [];

            // Standard REST-style endpoints
            for (const ep of endpoints) {
              attempts.push(() => axiosInstance.delete(ep));
              attempts.push(() => axiosInstance.post(ep, { _method: "DELETE" }));

              // Some servers accept DELETE with request body
              attempts.push(() => axiosInstance.delete(ep, { data: { id } } as any));
            }

            for (const attempt of attempts) {
              try {
                await attempt();
                ok = true;
                break;
              } catch (e) {
                lastErr = e;
              }
            }

            if (!ok) {
              const status = lastErr?.response?.status;
              const message = lastErr?.response?.data?.message || lastErr?.message || 'Failed to delete category';
              const validationNameRequired =
                typeof message === "string" && message.toLowerCase().includes("name") && message.toLowerCase().includes("required");
              // Many backends in this project expose only GET/POST for /product-categories (no /:id route)
              toast.error(
                status === 404
                  ? 'Delete failed: backend has no delete route for product categories (needs something like DELETE /product-categories/{id}).'
                  : status === 422 && validationNameRequired
                  ? 'Delete failed: backend treated this request like “create/update” (requires name). A dedicated delete endpoint is missing.'
                  : message
              );
              setShowDeleteConfirmId(null);
              return;
            }
            toast.success('Category deleted');
            setShowDeleteConfirmId(null);
            await loadCategories();
          } catch (e: any) {
            console.error('Delete category error', e);
            toast.error(e?.response?.data?.message || e?.message || 'Failed to delete category');
            setShowDeleteConfirmId(null);
          }
        }}
        onCancel={() => setShowDeleteConfirmId(null)}
      />
    </div>
  );
}

CreateProductCategory.Layout = AdminLayout;
