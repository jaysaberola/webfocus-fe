"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { axiosInstance } from "@/services/axios";

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string | number; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("active");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const svc = await import("@/services/productService");
        const res = await svc.getProduct(id as string);
        const data = res?.data ?? res ?? {};
        if (!mounted) return;

        setName(data.name ?? data.title ?? "");
        setPrice(String(data.price ?? data.amount ?? ""));
        setDescription(data.description ?? "");
        setStatus(data.status ?? "active");
        setSelectedCategory(String(data.category_id ?? data.category?.id ?? ""));

        const img = data.image_url ?? data.image;
        if (img) {
          setImagePreview(`${process.env.NEXT_PUBLIC_API_URL}/storage/${img}`);
        }

        // Load categories
        try {
          const catRes = await axiosInstance.get("/fetch-product-categories", {
            headers: { "X-No-Loading": true },
          });
          const catData = catRes.data?.data ?? catRes.data ?? [];
          if (Array.isArray(catData) && catData.length) {
            setCategories(
              catData.map((c: any) => ({
                id: c.id ?? c.slug ?? c.name,
                name: c.name ?? c.title ?? String(c),
              }))
            );
          }
        } catch (e) {
          // ignore category load failure
        }
      } catch (e) {
        console.error("Failed to load product", e);
        toast.error("Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Please provide a product name");
    setSubmitting(true);

    try {
      let categoryId: string | number | null = null;

      // Create new category if entered
      if (newCategory?.trim()) {
        const endpoints = ["/product-categories", "/create-product-category", "/categories"];
        for (const ep of endpoints) {
          try {
            const res = await axiosInstance.post(
              ep,
              { name: newCategory.trim(), title: newCategory.trim() },
              { headers: { "X-No-Loading": true } }
            );
            const d = res.data?.data ?? res.data ?? {};
            const cid = d?.id ?? d?.category_id ?? d?.data?.id;
            if (cid) {
              categoryId = cid;
              break;
            }
          } catch (e) {
            // try next endpoint
          }
        }

        // If no id returned, look up by name
        if (!categoryId) {
          const lookupEndpoints = [
            "/fetch-product-categories",
            "/product-categories",
            "/categories?type=product",
            "/categories",
          ];
          for (const lep of lookupEndpoints) {
            try {
              const r = await axiosInstance.get(lep, { headers: { "X-No-Loading": true } });
              const list = r.data?.data ?? r.data ?? [];
              if (Array.isArray(list) && list.length) {
                const found = list.find(
                  (c: any) =>
                    String(c.name ?? c.title ?? c.slug ?? c).toLowerCase() ===
                    newCategory.trim().toLowerCase()
                );
                if (found) {
                  categoryId = found.id ?? found.slug ?? found.name;
                  break;
                }
              }
            } catch (e) {
              // try next
            }
          }
        }
      }

      if (!categoryId && selectedCategory) categoryId = selectedCategory;
      if (categoryId) setSelectedCategory(String(categoryId));

      const svc = await import("@/services/productService");

      if (image) {
        // Has new image — send as multipart FormData
        const form = new FormData();
        form.append("name", name.trim());
        form.append("price", price);
        form.append("description", description);
        form.append("status", status);
        form.append("is_active", status === "active" ? "1" : "0");
        if (categoryId) {
          form.append("category_id", String(categoryId));
          form.append("category", String(categoryId));
        }
        form.append("image", image);

        const resp = await svc.updateProduct(id as string, form);
        toast.success(resp?.message ?? "Product updated");
      } else {
        // No new image — send as plain JSON
        const payload: any = {
          name: name.trim(),
          price,
          description,
          status,
          is_active: status === "active" ? 1 : 0,
        };
        if (categoryId) {
          payload.category_id = categoryId;
          payload.category = categoryId;
        }

        const resp = await svc.updateProduct(id as string, payload);
        toast.success(resp?.message ?? "Product updated");
      }

      router.push("/products");
    } catch (e: any) {
      console.error("Update product error", e);
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to update product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      const svc = await import("@/services/productService");
      await svc.deleteProduct(id as string);
      toast.success("Product deleted");
      router.push("/products");
    } catch (e: any) {
      console.error("Delete error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete product");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Edit Product</h3>
        <div>
          <Link href="/products" className="btn btn-outline-secondary">
            Back to Manage
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 text-muted">Loading product…</p>
            </div>
          )}

          {!loading && (
            <>
              <div className="mb-3">
                <label className="form-label fw-semibold">Product Name</label>
                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Price</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Category</label>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">-- Select category --</option>
                  {categories.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <small className="form-text text-muted">
                  Or enter a new category below
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  New Category <span className="text-muted fw-normal">(optional)</span>
                </label>
                <input
                  className="form-control"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter new category name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description"
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setImage(f);
                    if (f) setImagePreview(URL.createObjectURL(f));
                  }}
                />
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-muted small mb-1">
                      {image ? "New image preview:" : "Current image:"}
                    </p>
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="img-fluid rounded border"
                      style={{ maxWidth: 300, maxHeight: 200, objectFit: "cover" }}
                    />
                    {image && (
                      <div className="mt-1">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setImage(null);
                            // Restore original preview from server
                            const origImg = imagePreview.startsWith("blob:") ? null : imagePreview;
                            setImagePreview(origImg);
                          }}
                        >
                          Remove new image
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Updating…
                    </>
                  ) : (
                    "Update Product"
                  )}
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={submitting}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        show={showDeleteConfirm}
        title="Delete product"
        message={
          <span>
            Are you sure you want to delete this product? This action cannot be undone.
          </span>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

EditProduct.Layout = AdminLayout;