import { useState, ChangeEvent } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect } from "react";
import { websiteService } from "@/services/websiteService";
import { toast } from "@/lib/toast";
import TinyEditor from "@/components/UI/Editor";
import { notifyWebsiteSettingsUpdated, storeWebsiteSettings } from "@/lib/websiteSettings";

type TabKey = "website" | "contact" | "social" | "privacy";

function WebsiteSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("website");

  /* =======================
     Website tab state
  ======================= */
  const [companyName, setCompanyName] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [copyright, setCopyright] = useState("");
  const [logoName, setLogoName] = useState("");
  const [faviconName, setFaviconName] = useState("");
  const [analytics, setAnalytics] = useState("");
  const [googleMap, setGoogleMap] = useState("");
  const [recaptcha, setRecaptcha] = useState("");
  const [navAlignment, setNavAlignment] = useState<'left' | 'center' | 'right'>('center');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  /* =======================
     Contact tab state
  ======================= */
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [fax, setFax] = useState("");
  const [telephone, setTelephone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [privacyTitle, setPrivacyTitle] = useState("");
  const [privacyPopup, setPrivacyPopup] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");

  type SocialRow = {
    name: string;
    media_account: string;
  };

  const [socials, setSocials] = useState<SocialRow[]>([
    { name: "", media_account: "" },
  ]);

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoName(file.name);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFaviconFile(file);
      setFaviconName(file.name);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };


  /* =======================
     Handlers
  ======================= */
  const handleFileName = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void
  ) => {
    if (e.target.files?.[0]) {
      setter(e.target.files[0].name);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const s = await websiteService.getSettings();

      // Normalize response: some backends return { setting: {...} }, others return the object directly.
      const data = s?.setting ?? s ?? {};

      setCompanyName(data.company_name ?? data.website_name ?? "");
      setWebsiteName(data.website_name ?? "");
      setCopyright(data.copyright ?? "");
      setAnalytics(data.google_analytics ?? "");
      setGoogleMap(data.google_map ?? "");
      setRecaptcha(data.google_recaptcha_sitekey ?? "");
      setNavAlignment(data.nav_alignment ?? 'center');

      setAddress(data.company_address ?? "");
      setMobile(data.mobile_no ?? "");
      setFax(data.fax_no ?? "");
      setTelephone(data.tel_no ?? "");
      setContactEmail(data.email ?? "");

      // Privacy fields: support both nested `data_privacy` object and flat keys
      setPrivacyTitle(data.data_privacy_title ?? data.data_privacy?.name ?? "");
      setPrivacyPopup(data.data_privacy_popup_content ?? data.data_privacy?.popup_content ?? "");
      setPrivacyContent(data.data_privacy_content ?? data.data_privacy?.contents ?? data.data_privacy?.content ?? "");

      if (data.company_logo) {
        setLogoPreview(`${process.env.NEXT_PUBLIC_API_URL}/storage/${data.company_logo}`);
        setLogoName(String(data.company_logo));
      }

      if (data.website_favicon) {
        setFaviconPreview(`${process.env.NEXT_PUBLIC_API_URL}/storage/${data.website_favicon}`);
        setFaviconName(String(data.website_favicon));
      }

    };
    const loadSocials = async () => {
      try {
        const res = await websiteService.getSocials();
        if (res.data.length > 0) {
          setSocials(res.data);
        }
      } catch (err) {
        console.error("Failed to load social media accounts", err);
      }
    };

    loadSocials();
    loadSettings();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      if (faviconPreview?.startsWith("blob:")) URL.revokeObjectURL(faviconPreview);
    };
  }, [logoPreview, faviconPreview]);


  const saveWebsite = async () => {
    try {
      const fd = new FormData();

      fd.append("company_name", companyName);
      fd.append("website_name", websiteName);
      fd.append("copyright", copyright);
      fd.append("google_analytics", analytics);
      fd.append("google_map", googleMap);
      fd.append("google_recaptcha_sitekey", recaptcha);
      fd.append("nav_alignment", navAlignment);

      if (logoFile) fd.append("company_logo", logoFile);
      if (faviconFile) fd.append("website_favicon", faviconFile);

      await websiteService.updateWebsite(fd);

      // Refresh cached settings so other UI (topbar, etc.) updates immediately.
      try {
        const s = await websiteService.getSettings();
        storeWebsiteSettings(s);
        notifyWebsiteSettingsUpdated();
      } catch {
        // ignore
      }

      toast.success("Website settings saved");
    } catch (err: any) {
      console.error("Failed to save website settings", err);

      toast.error(
        err?.response?.data?.message ||
          "Failed to save website settings. Please try again."
      );
    }
  };

  const handleSocialChange = (
    index: number,
    field: keyof SocialRow,
    value: string
  ) => {
    const updated = [...socials];
    updated[index][field] = value;
    setSocials(updated);
  };

  const addSocialRow = () => {
    setSocials([...socials, { name: "", media_account: "" }]);
  };

  const removeSocialRow = (index: number) => {
    setSocials(socials.filter((_, i) => i !== index));
  };

  const handleSaveSocials = async () => {
    try {
      await websiteService.updateSocials(
        socials.filter(
          (s) => s.name && s.media_account
        )
      );
      toast.success("Social media accounts saved successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save social media accounts");
    }
  };


  const handleSaveContact = async () => {
    try {
      await websiteService.updateContact({
        company_address: address,
        mobile_no: mobile,
        fax_no: fax,
        tel_no: telephone,
        email: contactEmail,
      });

      toast.success("Contact settings saved successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save contact settings");
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await websiteService.updatePrivacy({
        data_privacy_title: privacyTitle,
        data_privacy_popup_content: privacyPopup,
        data_privacy_content: privacyContent,
      });

      toast.success("Data privacy settings saved successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save data privacy settings");
    }
  };




  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Website Settings</h3>

      <div className="card">
        {/* Tabs */}
        <div className="card-header bg-white border-0 pb-0">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "website" ? "active" : ""}`}
                onClick={() => setActiveTab("website")}
              >
                Website
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "contact" ? "active" : ""}`}
                onClick={() => setActiveTab("contact")}
              >
                Contact
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "social" ? "active" : ""}`}
                onClick={() => setActiveTab("social")}
              >
                Social Media
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "privacy" ? "active" : ""}`}
                onClick={() => setActiveTab("privacy")}
              >
                Data Privacy
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {/* =======================
             WEBSITE TAB
          ======================= */}
          {activeTab === "website" && (
            <div style={{ maxWidth: 600 }}>
              <div className="mb-3">
                <label className="form-label">Company Name *</label>
                <input
                  className="form-control"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Website Name *</label>
                <input
                  className="form-control"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Copyright Year *</label>
                <input
                  className="form-control"
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Logo</label>

                {logoPreview && (
                  <div className="mb-2">
                    <img
                      src={logoPreview}
                      alt="Website Logo"
                      style={{
                        maxHeight: 100,
                        maxWidth: "100%",
                        border: "1px solid #e1e5ee",
                        padding: 6,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                )}

                <div className="input-group">
                  <input className="form-control" value={logoName} readOnly />
                  <label className="input-group-text">
                    Browse
                    <input
                      type="file"
                      hidden
                      accept=".png,.jpg,.jpeg,.svg"
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>

                <small className="text-muted">
                  PNG, JPG, SVG • Max 1MB
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Favicon</label>

                {faviconPreview && (
                  <div className="mb-2">
                    <img
                      src={faviconPreview}
                      alt="Website Favicon"
                      style={{
                        height: 48,
                        width: 48,
                        border: "1px solid #e1e5ee",
                        padding: 6,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                )}

                <div className="input-group">
                  <input className="form-control" value={faviconName} readOnly />
                  <label className="input-group-text">
                    Browse
                    <input
                      type="file"
                      hidden
                      accept=".ico,.png"
                      onChange={handleFaviconChange}
                    />
                  </label>
                </div>

                <small className="text-muted">
                  128×128 ICO • Max 100KB
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Google Analytics Code</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={analytics}
                  onChange={(e) => setAnalytics(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Google Map</label>
                <textarea
                  rows={4}
                  className="form-control"
                  value={googleMap}
                  onChange={(e) => setGoogleMap(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Google reCaptcha Site Key *</label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={recaptcha}
                  onChange={(e) => setRecaptcha(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Navigation Alignment</label>
                <div className="d-flex gap-2">
                  {(['left', 'center', 'right'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`btn ${navAlignment === opt ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setNavAlignment(opt)}
                    >
                      {opt === 'left' && '⬅ Left'}
                      {opt === 'center' && '↔ Center'}
                      {opt === 'right' && '➡ Right'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={saveWebsite}
              >
                Save Settings
              </button>

            </div>
          )}

          {/* =======================
             CONTACT TAB
          ======================= */}
          {activeTab === "contact" && (
            <div style={{ maxWidth: 600 }}>
              <div className="mb-3">
                <label className="form-label">Company Address *</label>
                <textarea
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mobile Number *</label>
                <input
                  className="form-control"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Fax Number</label>
                <input
                  className="form-control"
                  value={fax}
                  onChange={(e) => setFax(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Telephone Number *</label>
                <input
                  className="form-control"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSaveContact}
              >
                Save Settings
              </button>
            </div>
          )}

          {/* =======================
             SOCIAL MEDIA TAB
          ======================= */}
          {activeTab === "social" && (
            <div style={{ maxWidth: 600 }}>
              <p className="text-muted mb-3">
                Add your social media links
              </p>

              {socials.map((social, index) => (
                <div className="d-flex gap-2 mb-2" key={index}>
                  <select
                    className="form-control"
                    value={social.name}
                    onChange={(e) =>
                      handleSocialChange(index, "name", e.target.value)
                    }
                  >
                    <option value="">Choose</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">Youtube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="google">Google</option>
                  </select>

                  <input
                    className="form-control"
                    placeholder="URL"
                    value={social.media_account}
                    onChange={(e) =>
                      handleSocialChange(index, "media_account", e.target.value)
                    }
                  />

                  <button
                    className="btn btn-outline-danger"
                    onClick={() => removeSocialRow(index)}
                    disabled={socials.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                className="btn btn-outline-primary mb-3"
                onClick={addSocialRow}
              >
                + Add
              </button>

              <br />

              <button
                className="btn btn-primary"
                onClick={handleSaveSocials}
              >
                Save Settings
              </button>
            </div>
          )}

          {/* =======================
             DATA PRIVACY TAB
          ======================= */}
          {activeTab === "privacy" && (
            <div>
              <div className="mb-3">
                <label className="form-label">Page Title *</label>
                <input
                  className="form-control"
                  value={privacyTitle}
                  onChange={(e) => setPrivacyTitle(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Pop-up Content *</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={privacyPopup}
                  onChange={(e) => setPrivacyPopup(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Content *</label>
                <TinyEditor
                  value={privacyContent}
                  onChange={setPrivacyContent}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSavePrivacy}
              >
                Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

WebsiteSettingsPage.Layout = AdminLayout;
export default WebsiteSettingsPage;
