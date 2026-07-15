import React, { useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { createCustomer } from "@/services/customerService";
import { toast } from "@/lib/toast";
import { useRouter } from "next/router";

function CreateCustomer() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      await createCustomer({
        fname: firstName,
        lname: lastName,
        email,
      });

      toast.success("Customer created successfully");
      router.push("/customers");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Create Customer</h3>

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
        <label>Role</label>
        <input className="form-control" value="customer" disabled />
      </div>

      <div className="btn-group mt-3">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Customer"}
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

CreateCustomer.Layout = AdminLayout;
export default CreateCustomer;
