"use client";

import AdminLayout from "@/components/Layout/AdminLayout";
import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { useRouter } from "next/router";
import { axiosInstance } from "@/services/axios";
import { createService } from "@/services/serviceService";

export default function CreateService() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [categories, setCategories] = useState<Array<{ id: string | number; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");

  const handleSubmit = async () => {
    if (!name) return toast.error("Please provide a service name");

    let categoryId: string | number | null = null;
    try {
      if (newCategory?.trim()) {
        const endpoints = ["/service-categories", "/create-service-category", "/categories"];
        for (const ep of endpoints) {
          try {
            const body = { name: newCategory.trim(), title: newCategory.trim() };
            const res = await axiosInstance.post(ep, body, { headers: { "X-No-Loading": true } });
            const d = res.data?.data ?? res.data ?? {};
            const id = d?.id ?? d?.category_id ?? d?.data?.id;
            if (id) { categoryId = id; setSelectedCategory(String(id)); break; }
          } catch { /* try next */ }
        }
        if (!categoryId) {
          const lookupEndpoints = ["/fetch-service-categories", "/service-categories", "/categories?type=service", "/categories"];
          for (const lep of lookupEndpoints) {
            try {
              const r = await axiosInstance.get(lep, { headers: { "X-No-Loading": true } });
              const list = r.data?.data ?? r.data ?? [];
              if (Array.isArray(list) && list.length) {
                const found = list.find((c: any) => String(c.name ?? c.title ?? "").toLowerCase() === newCategory.trim().toLowerCase());
                if (found) { categoryId = found.id ?? found.slug ?? found.name; setSelectedCategory(String(categoryId)); break; }
              }
            } catch { /* try next */ }
          }
        }
      }

      if (!categoryId && selectedCategory) categoryId = selectedCategory;

      const form = new FormData();
      form.append("name", name);
      form.append("price", price);
      form.append("description", description);
      if (categoryId) {
        form.append("category_id", String(categoryId));
        form.append("category", String(categoryId));
        form.append("categoryId", String(categoryId));
      }
      if (status) {
        form.append("status", String(status));
        form.append("is_active", status === "active" ? "1" : "0");
      }
      if (image) form.append("image", image);

      const resp = await createService(form);
      if (resp && resp.success === false) {
        const msg = resp.error?.message || resp.error?.error || (resp.error?.errors ? JSON.stringify(resp.error.errors) : null) || JSON.stringify(resp.error);
        toast.error(String(msg).slice(0, 200));
        return;
      }
      toast.success(resp?.message ?? "Service created");
      router.push("/services");
    } catch (e: any) {
      const resp = e?.response?.data ?? e?.response;
      if (resp) {
        const msg = resp?.message || resp?.error || (resp?.errors ? JSON.stringify(resp.errors) : null) || JSON.stringify(resp);
        toast.error(String(msg).slice(0, 200));
        return;
      }
      toast.error("Failed to create service");
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const endpoints = ["/fetch-service-categories", "/service-categories", "/categories?type=service", "/categories"];
      for (const ep of endpoints) {
        try {
          const res = await axiosInstance.get(ep, { headers: { "X-No-Loading": true } });
          const data = res.data?.data ?? res.data ?? [];
          if (Array.isArray(data) && data.length) {
            if (!mounted) return;
            setCategories(data.map((c: any) => ({ id: c.id ?? c.slug ?? c.name, name: c.name ?? c.title ?? String(c) })));
            return;
          }
        } catch { /* try next */ }
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Create Service</h3>

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Service Name <span className="text-danger">*</span></label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter service name" />
          </div>

          <div className="mb-3">
            <label className="form-label">Price</label>
            <input className="form-control" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Category</label>
            <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">-- Select category --</option>
              {categories.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            <small className="form-text text-muted">Or enter a new category below</small>
          </div>

          <div className="mb-3">
            <label className="form-label">New Category (optional)</label>
            <input className="form-control" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Enter category name" />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Service Image</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setImage(f);
                if (f) setImagePreview(URL.createObjectURL(f));
                else setImagePreview(null);
              }}
            />
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Service preview" className="img-fluid rounded" style={{ maxWidth: 300 }} />
              </div>
            )}
          </div>

          <div>
            <button className="btn btn-primary" type="button" onClick={handleSubmit}>Save Service</button>
            <button className="btn btn-outline-secondary ms-2" type="button" onClick={() => router.push("/services")}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

CreateService.Layout = AdminLayout;
