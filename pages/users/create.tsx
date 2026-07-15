import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { createUser } from "@/services/userService";
import { fetchRoles, Role } from "@/services/roleService";
import { toast } from "@/lib/toast";
import { useRouter } from "next/router";

function CreateUser() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch(() => toast.error("Failed to load roles"));
  }, []);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !role) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      await createUser({
        fname: firstName,
        lname: lastName,
        email,
        role,
      });

      toast.success("User created successfully");
      router.push("/users");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Create a User</h3>

      <div className="form-group mb-3">
        <label>First Name *</label>
        <input
          className="form-control"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>

      <div className="form-group mb-3">
        <label>Last Name *</label>
        <input
          className="form-control"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <div className="form-group mb-3">
        <label>Email *</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group mb-3">
        <label>Role *</label>
        <select
          className="form-control"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={roles.length === 0}
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="btn-group mt-3">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

CreateUser.Layout = AdminLayout;
export default CreateUser;
