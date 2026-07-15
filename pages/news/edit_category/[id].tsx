"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useRouter } from "next/router";
import {
  getArticleCategory,
  updateArticleCategory,
} from "@/services/articleService";
import { toast } from "@/lib/toast";

function EditNewsCategory() {
  const router = useRouter();
  const { id } = router.query;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ======================
   * Fetch Category
   * ====================== */
  const fetchCategory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getArticleCategory(Number(id));
      setName(data.name);
    } catch (err) {
      toast.error("Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [id]);

  /* ======================
   * Update
   * ====================== */
  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);

      await updateArticleCategory(Number(id), {
        name: name.trim(),
      });

      toast.success("Category updated successfully");
      router.push("/news/category_index");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update category"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Edit News Category</h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="mb-3 col-sm-6">
            <label className="form-label">
              Category Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="btn-group">
            <button
              className="btn btn-primary"
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? "Saving..." : "Update Category"}
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

EditNewsCategory.Layout = AdminLayout;
export default EditNewsCategory;
