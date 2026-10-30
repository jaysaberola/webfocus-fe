import {
  CMS_INQUIRY_TYPE_OPTIONS,
  CMS_PREFERRED_SERVICE_OPTIONS,
} from "@/lib/cmsContactFormConstants";

const fieldStyle =
  "width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(15,23,42,.14);background:#fff;font-size:15px;box-sizing:border-box;";
const labelStyle =
  "display:block;margin-bottom:6px;font-size:13px;font-weight:700;color:#0f172a;";

function inquirySelect() {
  const options = ['<option value="">Select inquiry type</option>']
    .concat(CMS_INQUIRY_TYPE_OPTIONS.map((o) => `<option value="${o}">${o}</option>`))
    .join("");
  return `
    <div style="margin-bottom:14px;">
      <label style="${labelStyle}" for="cms_inquiry_type">Inquiry Type <span style="color:#dc2626">*</span></label>
      <select id="cms_inquiry_type" name="inquiry_type" required style="${fieldStyle}" class="form-select">
        ${options}
      </select>
    </div>`;
}

function preferredServices() {
  const items = CMS_PREFERRED_SERVICE_OPTIONS.map(
    (service) => `
      <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#334155;margin:0;">
        <input type="checkbox" name="preferred_services" value="${service}" data-cms-preferred-service="1" />
        <span>${service}</span>
      </label>`,
  ).join("");
  return `
    <div style="margin-bottom:14px;" data-cms-contact-preferred-services="1">
      <span style="${labelStyle}">Preferred Services <span style="font-weight:500;color:#64748b">(Optional)</span></span>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px;">${items}</div>
    </div>`;
}

/** Live Contact Us form — field names match POST /api/contact. */
export function buildCmsContactFormMarkup(options?: { title?: string; hint?: string }) {
  const title = options?.title ?? "Send Us a Message";
  const hint =
    options?.hint ?? "Fill out the form below and our team will get back to you shortly.";

  return `
<form
  data-cms-contact-form="1"
  class="cms-wsi-contact-form"
  novalidate
  style="display:block;margin:0;"
>
  <h2 style="margin:0 0 8px;font-size:26px;line-height:1.2;color:#0f172a;">${title}</h2>
  <p style="margin:0 0 18px;color:#64748b;line-height:1.6;font-size:15px;">${hint}</p>
  <div data-cms-contact-alert style="display:none;margin-bottom:14px;padding:12px 14px;border-radius:10px;font-size:14px;"></div>
  ${inquirySelect()}
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:14px;">
    <div>
      <label style="${labelStyle}" for="cms_first_name">First Name <span style="color:#dc2626">*</span></label>
      <input id="cms_first_name" name="first_name" type="text" required autocomplete="given-name" style="${fieldStyle}" class="form-control" />
    </div>
    <div>
      <label style="${labelStyle}" for="cms_last_name">Last Name <span style="color:#dc2626">*</span></label>
      <input id="cms_last_name" name="last_name" type="text" required autocomplete="family-name" style="${fieldStyle}" class="form-control" />
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:14px;">
    <div>
      <label style="${labelStyle}" for="cms_email">Email <span style="color:#dc2626">*</span></label>
      <input id="cms_email" name="email" type="email" required autocomplete="email" style="${fieldStyle}" class="form-control" />
    </div>
    <div>
      <label style="${labelStyle}" for="cms_contact_number">Mobile number <span style="color:#dc2626">*</span></label>
      <input id="cms_contact_number" name="contact_number" type="tel" inputmode="numeric" autocomplete="tel" placeholder="e.g. 09171234567" required style="${fieldStyle}" class="form-control" data-cms-ph-mobile="1" />
      <div data-cms-contact-phone-error style="display:none;margin-top:6px;font-size:12px;color:#dc2626;"></div>
    </div>
  </div>
  <div style="margin-bottom:14px;">
    <label style="${labelStyle}" for="cms_message">Message <span style="color:#dc2626">*</span></label>
    <textarea id="cms_message" name="message" rows="5" required style="${fieldStyle}resize:vertical;min-height:120px;" class="form-control"></textarea>
  </div>
  ${preferredServices()}
  <div style="margin-bottom:16px;" data-cms-contact-recaptcha="1"></div>
  <button type="submit" data-cms-contact-submit="1" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;border:0;background:#2563eb;color:#fff;font-weight:700;font-size:15px;cursor:pointer;">
    Submit Message
  </button>
</form>`;
}
