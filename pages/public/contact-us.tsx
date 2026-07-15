import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug } from "@/services/publicPageService";
import { sendContactMessage } from "@/services/publicPageService";
import { useState } from "react";

export default function ContactUsPage() {
  const [form, setForm] = useState({
    inquiry_type: "",
    first_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      await sendContactMessage(form);
      setSuccess("Thank you! Your message has been sent successfully.");
      setForm({
        inquiry_type: "",
        first_name: "",
        last_name: "",
        email: "",
        contact_number: "",
        message: "",
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="p-t-80 p-b-80">

        <div className="row">

          {/* LEFT – CONTACT INFO */}
          <div className="col-md-4 col-lg-3">
            <div className="sidebar2 p-b-40">

              <h4 className="p-b-20">Our Office</h4>

              <p className="txt14 p-b-10">
                3rd Floor, ABC Building<br />
                J.P. Laurel Avenue, Bajada<br />
                Davao City, Philippines
              </p>

              <p className="txt14 p-b-10">
                📞 (+63) 82 295-1234<br />
                ✉ info@yourcompany.com
              </p>

              <p className="txt14">
                🕘 Mon – Fri<br />
                8:00 AM – 5:00 PM
              </p>

            </div>
          </div>

          {/* RIGHT – FORM + MAP */}
          <div className="col-md-8 col-lg-9">

            {/* MAP */}
            <div className="blo4 bo-rad-10 of-hidden m-b-40">
              <iframe
                src="https://www.google.com/maps?q=Davao%20City%2C%20Philippines&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>

            {/* FORM */}
            <div className="blo4 p-30">
              <h4 className="p-b-20">Send Us a Message</h4>

              {success && <p className="txt14 text-success p-b-10">{success}</p>}
              {error && <p className="txt14 text-danger p-b-10">{error}</p>}

              <form onSubmit={submit}>
                {/* INQUIRY TYPE */}
                <div className="row p-b-25">
                  <div className="col-md-6">
                    <label className="txt14 p-b-5 dis-block">Inquiry Type *</label>
                    <div className="size30 bo2 bo-rad-10">
                      <select
                        className="sizefull txt14 p-l-20 p-r-20"
                        name="inquiry_type"
                        value={form.inquiry_type}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select inquiry type</option>
                        <option>General Inquiry</option>
                        <option>Customer Support</option>
                        <option>Business Partnership</option>
                        <option>Careers</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* NAME */}
                <div className="row p-b-25">
                  <div className="col-md-6">
                    <label className="txt14 p-b-5 dis-block">First Name *</label>
                    <div className="size30 bo2 bo-rad-10">
                      <input
                        className="sizefull txt14 p-l-20 p-r-20"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="txt14 p-b-5 dis-block">Last Name *</label>
                    <div className="size30 bo2 bo-rad-10">
                      <input
                        className="sizefull txt14 p-l-20 p-r-20"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* CONTACT */}
                <div className="row p-b-25">
                  <div className="col-md-6">
                    <label className="txt14 p-b-5 dis-block">Email *</label>
                    <div className="size30 bo2 bo-rad-10">
                      <input
                        type="email"
                        className="sizefull txt14 p-l-20 p-r-20"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="txt14 p-b-5 dis-block">Contact Number *</label>
                    <div className="size30 bo2 bo-rad-10">
                      <input
                        className="sizefull txt14 p-l-20 p-r-20"
                        name="contact_number"
                        value={form.contact_number}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* MESSAGE */}
                <div className="p-b-30">
                  <label className="txt14 p-b-5 dis-block">Message *</label>
                  <div className="bo2 bo-rad-10">
                    <textarea
                      className="sizefull txt14 p-l-20 p-r-20 p-t-15"
                      rows={6}
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn3 flex-c-m size31 txt11 trans-0-4"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Submit Message"}
                </button>
              </form>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const res = await getPublicPageBySlug("contact-us");
    return { props: { pageData: res.data } };
  } catch {
    return { notFound: true };
  }
}

ContactUsPage.Layout = LandingPageLayout;
