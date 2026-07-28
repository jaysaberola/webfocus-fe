import { useState, ChangeEvent, useMemo } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { websiteService } from "@/services/websiteService";
import { toast } from "@/lib/toast";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";
import {
  DEFAULT_PRIVACY_HTML,
  DEFAULT_PRIVACY_POPUP,
  DEFAULT_PRIVACY_TITLE,
} from "@/lib/defaultPrivacyContent";
import { notifyWebsiteSettingsUpdated, storeWebsiteSettings } from "@/lib/websiteSettings";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import {
  CmsSettingsChoicePills,
  CmsSettingsField,
  CmsSettingsFileField,
  CmsSettingsFooter,
  CmsSettingsGrid,
  CmsSettingsLayout,
  CmsSettingsSection,
} from "@/components/Modules/CmsSettingsForm";

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), {
  ssr: false,
  loading: () => <div className="p-4 text-muted">Loading visual builder...</div>,
});

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
      const response = await websiteService.getSettings();
      const data = response?.setting ?? response ?? {};
      const privacyPage = response?.data_privacy ?? null;

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

      const privacyTitleValue = data.data_privacy_title ?? privacyPage?.name ?? DEFAULT_PRIVACY_TITLE;
      const privacyPopupValue =
        data.data_privacy_popup_content ?? DEFAULT_PRIVACY_POPUP;
      const hasGrapesFields = Boolean(privacyPage?.grapes_html || privacyPage?.grapes_css || privacyPage?.grapes_js);
      const privacyHtml = hasGrapesFields
        ? composeContentFromGrapes({
            grapes_html: privacyPage?.grapes_html || privacyPage?.contents || "",
            grapes_css: privacyPage?.grapes_css || "",
            grapes_js: privacyPage?.grapes_js || "",
          })
        : data.data_privacy_content || privacyPage?.contents || DEFAULT_PRIVACY_HTML;

      setPrivacyTitle(privacyTitleValue);
      setPrivacyPopup(privacyPopupValue);
      setPrivacyContent(privacyHtml || DEFAULT_PRIVACY_HTML);

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
        const response = await websiteService.getSettings();
        storeWebsiteSettings(response?.setting ?? response);
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
      const parts = extractGrapesParts(privacyContent);

      await websiteService.updatePrivacy({
        data_privacy_title: privacyTitle,
        data_privacy_popup_content: privacyPopup,
        data_privacy_content: privacyContent,
        grapes_html: parts.grapes_html,
        grapes_css: parts.grapes_css,
        grapes_js: parts.grapes_js,
      });

      toast.success("Data privacy settings saved successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save data privacy settings");
    }
  };




  const activeSocialCount = useMemo(
    () => socials.filter((social) => social.name && social.media_account).length,
    [socials]
  );

  const websiteTabLabels: Record<TabKey, string> = {
    website: "Website",
    contact: "Contact",
    social: "Social Media",
    privacy: "Data Privacy",
  };

  return (
    <CmsModuleShell
      title="Manage Website Settings"
      description="Configure your public website details, contact information, social links, and data privacy content."
      icon="fa-solid fa-globe"
      stats={[
        { label: "Company", value: companyName || websiteName || "—" },
        { label: "Navigation", value: navAlignment, tone: "accent" },
        { label: "Social Links", value: activeSocialCount },
        { label: "Section", value: websiteTabLabels[activeTab] },
      ]}
      toolbar={(
        <div className="cms-settings-tabs" role="tablist" aria-label="Website settings sections">
          {([
            ["website", "fa-solid fa-globe", "Website"],
            ["contact", "fa-solid fa-address-book", "Contact"],
            ["social", "fa-solid fa-share-nodes", "Social Media"],
            ["privacy", "fa-solid fa-shield", "Data Privacy"],
          ] as const).map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={`cms-settings-tabs__btn${activeTab === key ? " is-active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <i className={icon} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}
    >
      <div className="cms-settings-panel">
        <CmsSettingsLayout>
          {activeTab === "website" && (
            <>
              <CmsSettingsSection
                title="General Information"
                description="Basic website identity shown across the public site."
                icon="fa-solid fa-building"
              >
                <CmsSettingsGrid columns={2}>
                  <CmsSettingsField label="Company Name" required>
                    <input
                      className="form-control"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Website Name" required>
                    <input
                      className="form-control"
                      value={websiteName}
                      onChange={(e) => setWebsiteName(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Copyright Year" required>
                    <input
                      className="form-control"
                      value={copyright}
                      onChange={(e) => setCopyright(e.target.value)}
                    />
                  </CmsSettingsField>
                </CmsSettingsGrid>
              </CmsSettingsSection>

              <CmsSettingsSection
                title="Branding"
                description="Upload your logo and favicon for the public website."
                icon="fa-solid fa-image"
              >
                <CmsSettingsGrid columns={2}>
                  <CmsSettingsFileField
                    label="Logo"
                    previewUrl={logoPreview}
                    fileName={logoName}
                    hint="PNG, JPG, SVG • Max 1MB"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={handleLogoChange}
                    previewVariant="logo"
                  />
                  <CmsSettingsFileField
                    label="Favicon"
                    previewUrl={faviconPreview}
                    fileName={faviconName}
                    hint="128×128 ICO or PNG • Max 100KB"
                    accept=".ico,.png"
                    onChange={handleFaviconChange}
                    previewVariant="favicon"
                  />
                </CmsSettingsGrid>
              </CmsSettingsSection>

              <CmsSettingsSection
                title="Integrations"
                description="Analytics, maps, and security keys used on the public site."
                icon="fa-solid fa-plug"
              >
                <CmsSettingsGrid columns={1}>
                  <CmsSettingsField label="Google Analytics Code" hint="Paste your tracking snippet or measurement ID.">
                    <textarea
                      rows={3}
                      className="form-control"
                      value={analytics}
                      onChange={(e) => setAnalytics(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Google Map" hint="Embed code or map URL for your contact page.">
                    <textarea
                      rows={4}
                      className="form-control"
                      value={googleMap}
                      onChange={(e) => setGoogleMap(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Google reCaptcha Site Key" required>
                    <textarea
                      rows={2}
                      className="form-control"
                      value={recaptcha}
                      onChange={(e) => setRecaptcha(e.target.value)}
                    />
                  </CmsSettingsField>
                </CmsSettingsGrid>
              </CmsSettingsSection>

              <CmsSettingsSection
                title="Navigation"
                description="Choose how the main menu is aligned on the public site."
                icon="fa-solid fa-bars"
              >
                <CmsSettingsChoicePills
                  label="Navigation Alignment"
                  value={navAlignment}
                  onChange={setNavAlignment}
                  options={[
                    { value: "left", label: "Left", icon: "fa-solid fa-align-left" },
                    { value: "center", label: "Center", icon: "fa-solid fa-align-center" },
                    { value: "right", label: "Right", icon: "fa-solid fa-align-right" },
                  ]}
                />
              </CmsSettingsSection>

              <CmsSettingsFooter onSave={saveWebsite} saveLabel="Save Website Settings" />
            </>
          )}

          {activeTab === "contact" && (
            <>
              <CmsSettingsSection
                title="Contact Details"
                description="Company contact information shown on the public website."
                icon="fa-solid fa-address-book"
              >
                <CmsSettingsGrid columns={2}>
                  <CmsSettingsField label="Company Address" required span={2}>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Mobile Number" required>
                    <input
                      className="form-control"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Telephone Number" required>
                    <input
                      className="form-control"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Fax Number">
                    <input
                      className="form-control"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Email Address" required>
                    <input
                      type="email"
                      className="form-control"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </CmsSettingsField>
                </CmsSettingsGrid>
              </CmsSettingsSection>

              <CmsSettingsFooter onSave={handleSaveContact} saveLabel="Save Contact Settings" />
            </>
          )}

          {activeTab === "social" && (
            <>
              <CmsSettingsSection
                title="Social Media Links"
                description="Add links to your social profiles for the public website."
                icon="fa-solid fa-share-nodes"
              >
                {socials.map((social, index) => (
                  <div className="cms-settings-social-row" key={index}>
                    <select
                      className="form-select"
                      value={social.name}
                      onChange={(e) => handleSocialChange(index, "name", e.target.value)}
                    >
                      <option value="">Choose platform</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">Youtube</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="google">Google</option>
                    </select>

                    <input
                      className="form-control"
                      placeholder="https://..."
                      value={social.media_account}
                      onChange={(e) => handleSocialChange(index, "media_account", e.target.value)}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-danger cms-settings-social-row__remove"
                      onClick={() => removeSocialRow(index)}
                      disabled={socials.length === 1}
                      title="Remove link"
                    >
                      <i className="fa-solid fa-trash" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </CmsSettingsSection>

              <CmsSettingsFooter onSave={handleSaveSocials} saveLabel="Save Social Links">
                <button
                  type="button"
                  className="btn btn-outline-primary cms-module__toolbar-btn"
                  onClick={addSocialRow}
                >
                  <i className="fa-solid fa-plus me-1" aria-hidden="true" />
                  Add Link
                </button>
              </CmsSettingsFooter>
            </>
          )}

          {activeTab === "privacy" && (
            <>
              <CmsSettingsSection
                title="Data Privacy Page"
                description="Configure the consent popup and full privacy policy content."
                icon="fa-solid fa-shield"
              >
                <CmsSettingsGrid columns={1}>
                  <CmsSettingsField label="Page Title" required>
                    <input
                      className="form-control"
                      value={privacyTitle}
                      onChange={(e) => setPrivacyTitle(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField
                    label="Pop-up Content"
                    required
                    hint="Short summary shown in consent areas. The full policy opens in a modal on the public site."
                  >
                    <textarea
                      rows={3}
                      className="form-control"
                      value={privacyPopup}
                      onChange={(e) => setPrivacyPopup(e.target.value)}
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Policy Content" required span={2}>
                    <GrapesEditor value={privacyContent} onChange={setPrivacyContent} height={640} />
                  </CmsSettingsField>
                </CmsSettingsGrid>
              </CmsSettingsSection>

              <CmsSettingsFooter onSave={handleSavePrivacy} saveLabel="Save Privacy Settings" />
            </>
          )}
        </CmsSettingsLayout>
      </div>
    </CmsModuleShell>
  );
}

WebsiteSettingsPage.Layout = AdminLayout;
export default WebsiteSettingsPage;
