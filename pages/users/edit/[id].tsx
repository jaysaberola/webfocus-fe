import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useRouter } from "next/router";
import { getUser, updateUser } from "@/services/userService";
import { fetchRoles, Role } from "@/services/roleService";
import { toast } from "@/lib/toast";

function EditUser() {
  const router = useRouter();
  const { id } = router.query;

  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([getUser(Number(id)), fetchRoles()])
      .then(([user, roles]) => {
        setForm(user);
        setRoles(roles);
      })
      .catch(() => toast.error("Failed to load user"));
  }, [id]);

  const submit = async () => {
    try {
      setLoading(true);
      await updateUser(Number(id), form);
      toast.success("User updated");
      router.push("/users");
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
        <h3 className="mb-4">Edit User</h3>

        {/* First Name */}
        <div className="form-group mb-3">
            <label className="col-form-label">
            First Name <span className="text-danger">*</span>
            </label>
            <input
            type="text"
            className="form-control"
            value={form.fname || ""}
            onChange={(e) => setForm({ ...form, fname: e.target.value })}
            />
        </div>

        {/* Last Name */}
        <div className="form-group mb-3">
            <label className="col-form-label">
            Last Name <span className="text-danger">*</span>
            </label>
            <input
            type="text"
            className="form-control"
            value={form.lname || ""}
            onChange={(e) => setForm({ ...form, lname: e.target.value })}
            />
        </div>

        {/* Email */}
        <div className="form-group mb-3">
            <label className="col-form-label">
            Email <span className="text-danger">*</span>
            </label>
            <input
            type="email"
            className="form-control"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
        </div>

        {/* Role */}
        <div className="form-group mb-4">
            <label className="col-form-label">
            Role <span className="text-danger">*</span>
            </label>
            <select
            className="form-control"
            value={form.role || ""}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
            <option value="">Select role</option>
            {roles.map((r) => (
                <option key={r.id} value={r.name}>
                {r.name}
                </option>
            ))}
            </select>
        </div>

        {/* Actions */}
        <div className="btn-group">
            <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading}
            >
            {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
            className="btn btn-outline-secondary"
            onClick={() => window.history.back()}
            >
            Cancel
            </button>
        </div>
        </div>
  );
}

EditUser.Layout = AdminLayout;
export default EditUser;
