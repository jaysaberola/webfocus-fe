"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { createArticleCategory } from "@/services/articleService";
import { toast } from "@/lib/toast";
import { useRouter } from "next/router";

function CreateNewsCategory() {
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);

      await createArticleCategory({
        name: categoryName.trim(),
      });

      toast.success("Category created successfully");
      router.push("/news/category_index"); // adjust if needed
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to create category"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Create News Category</h3>

      <div className="mb-3 col-sm-6">
        <label className="form-label">
          Category Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          disabled={saving}
        />
      </div>

      <div className="btn-group">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Category"}
        </button>

        <button
          className="btn btn-outline-secondary"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

CreateNewsCategory.Layout = AdminLayout;
export default CreateNewsCategory;
