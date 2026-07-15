import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useRouter } from "next/router";
import { getCustomer, updateCustomer } from "@/services/customerService";
import { toast } from "@/lib/toast";
import { readCustomerDetailCache, writeCustomerDetailCache } from "@/lib/customerCache";

function EditCustomer() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const customerId = Number(id);
    const cachedCustomer = readCustomerDetailCache(customerId);
    if (cachedCustomer) setForm(cachedCustomer);

    getCustomer(customerId, { silent: Boolean(cachedCustomer) })
      .then((customer) => {
        setForm(customer);
        writeCustomerDetailCache(customer);
      })
      .catch(() => toast.error("Failed to load customer"));
  }, [id]);

  const submit = async () => {
    try {
      setLoading(true);
      await updateCustomer(Number(id), form);
      writeCustomerDetailCache({ ...form, id: Number(id) });
      toast.success("Customer updated");
      router.push("/customers");
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Edit Customer</h3>

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

      <div className="form-group mb-4">
        <label className="col-form-label">Type</label>
        <input className="form-control" value={form.type ?? "Customer"} disabled />
      </div>

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

EditCustomer.Layout = AdminLayout;
export default EditCustomer;
