import LandingPageLayout from "@/components/Layout/GuestLayout";
import GoogleRecaptcha, { GoogleRecaptchaHandle } from "@/components/UI/GoogleRecaptcha";
import { getPublicPageBySlug, sendContactMessage } from "@/services/publicPageService";
import { websiteService } from "@/services/websiteService";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/styles/contactPage.module.css";

const OFFICE = {
  addressLines: [
    "Unit 907-909, Antel Global Corporate Center,",
    "Julia Vargas Avenue, Ortigas Center,",
    "Pasig City, Philippines",
  ],
  phone: "+63 (2) 8706-5796",
  phoneHref: "tel:+63287065796",
  email: "customercare@webfocus.ph",
  mapQuery: "Antel+Global+Corporate+Center+Julia+Vargas+Avenue+Ortigas+Center+Pasig+City",
};

const PREFERRED_SERVICE_OPTIONS = [
  "Hosting",
  "Web Design",
  "Domains",
  "DMS",
  "SSL / Security",
  "Other",
];

type ContactUsPageProps = {
  recaptchaSiteKey?: string;
};

export default function ContactUsPage({ recaptchaSiteKey = "" }: ContactUsPageProps) {
  const [form, setForm] = useState({
    inquiry_type: "",
    first_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    message: "",
  });
  const [preferredServices, setPreferredServices] = useState<string[]>([]);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState("");
  const servicesRef = useRef<HTMLDivElement>(null);
  const recaptchaRef = useRef<GoogleRecaptchaHandle>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePreferredService = (service: string) => {
    setPreferredServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  };

  const handleRecaptchaChange = useCallback((token: string | null) => {
    setRecaptchaToken(token);
    if (token) {
      setRecaptchaError("");
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setRecaptchaError("");

    if (!recaptchaSiteKey) {
      setRecaptchaError("reCAPTCHA is not configured. Please contact the site administrator.");
      return;
    }

    if (!recaptchaToken) {
      setRecaptchaError("Please complete the reCAPTCHA verification before submitting.");
      return;
    }

    setLoading(true);

    try {
      await sendContactMessage({
        ...form,
        preferred_services: preferredServices.length ? preferredServices : undefined,
        recaptcha_token: recaptchaToken,
      });
      setSuccess("Thank you! Your message has been sent successfully.");
      setForm({
        inquiry_type: "",
        first_name: "",
        last_name: "",
        email: "",
        contact_number: "",
        message: "",
      });
      setPreferredServices([]);
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
      setServicesOpen(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again later."
      );
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const preferredServicesLabel = preferredServices.length
    ? preferredServices.join(", ")
    : "Select preferred services";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.intro}>
          <div className={styles.introAccent} aria-hidden="true" />
          <div className={styles.introGlow} aria-hidden="true" />

          <div className={styles.introBody}>
            <div className={styles.introCopy}>
              <span className={styles.introBadge}>WebFocus Solutions, Inc.</span>
              <h1 className={styles.introTitle}>Contact Us</h1>
              <p className={styles.introText}>
                Reach our Pasig office for sales inquiries, customer support, partnerships, or
                general questions. Our team will respond as soon as possible.
              </p>
            </div>
          </div>
        </header>

        <div className={styles.grid}>
          <aside className={styles.infoStack}>
            <section className={styles.infoCard} aria-label="Office information">
              <h2 className={styles.infoCardTitle}>Our Office</h2>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon} aria-hidden="true">
                  <i className="fa-solid fa-location-dot" />
                </span>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Address</span>
                  <p className={styles.infoValue}>
                    {OFFICE.addressLines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon} aria-hidden="true">
                  <i className="fa-solid fa-phone" />
                </span>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Phone</span>
                  <p className={styles.infoValue}>
                    <a href={OFFICE.phoneHref} className={styles.infoLink}>
                      {OFFICE.phone}
                    </a>
                  </p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoIcon} aria-hidden="true">
                  <i className="fa-solid fa-envelope" />
                </span>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Email</span>
                  <p className={styles.infoValue}>
                    <a href={`mailto:${OFFICE.email}`} className={styles.infoLink}>
                      {OFFICE.email}
                    </a>
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.hoursCard}>
              <strong>Business Hours</strong>
              <p>Monday – Friday, 8:00 AM – 5:00 PM (Philippine Standard Time)</p>
            </section>
          </aside>

          <div className={styles.rightColumn}>
            <section className={styles.mapCard} aria-label="Office map">
              <iframe
                className={styles.mapFrame}
                title="WebFocus office location"
                src={`https://www.google.com/maps?q=${OFFICE.mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </section>

            <section className={styles.formCard}>
              <h2 className={styles.formTitle}>Send Us a Message</h2>
              <p className={styles.formHint}>
                Fill out the form below and our team will get back to you shortly.
              </p>

              {success ? <p className={styles.alertSuccess}>{success}</p> : null}
              {error ? <p className={styles.alertError}>{error}</p> : null}

              <form onSubmit={submit}>
                <div className={styles.formGrid}>
                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor="inquiry_type">
                      Inquiry Type <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="inquiry_type"
                      className={styles.select}
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

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="first_name">
                      First Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="first_name"
                      className={styles.input}
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="last_name">
                      Last Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="last_name"
                      className={styles.input}
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="email">
                      Email <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={styles.input}
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="contact_number">
                      Contact Number <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="contact_number"
                      className={styles.input}
                      name="contact_number"
                      value={form.contact_number}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor="message">
                      Message <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      id="message"
                      className={styles.textarea}
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label} htmlFor="preferred_services">
                      Preferred Services <span className={styles.optional}>(Optional)</span>
                    </label>
                    <div className={styles.multiSelectWrap} ref={servicesRef}>
                      <button
                        id="preferred_services"
                        type="button"
                        className={`${styles.multiSelectBtn} ${
                          preferredServices.length ? styles.multiSelectBtnActive : ""
                        }`}
                        aria-haspopup="listbox"
                        aria-expanded={servicesOpen}
                        onClick={() => setServicesOpen((open) => !open)}
                      >
                        <span
                          className={
                            preferredServices.length ? undefined : styles.multiSelectPlaceholder
                          }
                        >
                          {preferredServicesLabel}
                        </span>
                        <i
                          className={`fa-solid fa-chevron-down ${styles.multiSelectChevron}`}
                          aria-hidden="true"
                        />
                      </button>

                      {servicesOpen ? (
                        <div className={styles.multiSelectPanel} role="listbox" aria-multiselectable>
                          {PREFERRED_SERVICE_OPTIONS.map((service) => (
                            <label key={service} className={styles.multiSelectItem}>
                              <input
                                type="checkbox"
                                checked={preferredServices.includes(service)}
                                onChange={() => togglePreferredService(service)}
                              />
                              <span>{service}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={styles.captchaRow}>
                  {recaptchaSiteKey ? (
                    <GoogleRecaptcha
                      ref={recaptchaRef}
                      siteKey={recaptchaSiteKey}
                      onChange={handleRecaptchaChange}
                      className={styles.recaptchaWidget}
                    />
                  ) : (
                    <p className={styles.captchaMissing}>
                      reCAPTCHA is not configured for this site.
                    </p>
                  )}
                  {recaptchaError ? <p className={styles.captchaError}>{recaptchaError}</p> : null}
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? "Sending..." : "Submit Message"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  let pageData = { slug: "contact-us", title: "Contact Us" };
  let recaptchaSiteKey = "";

  try {
    const res = await getPublicPageBySlug("contact-us");
    pageData = res.data;
  } catch {
    // use fallback page data
  }

  try {
    const branding = await websiteService.getPublicBranding();
    recaptchaSiteKey = branding?.google_recaptcha_sitekey ?? "";
  } catch {
    // reCAPTCHA widget stays hidden if keys are unavailable
  }

  return {
    props: {
      pageData,
      recaptchaSiteKey,
      layout: { hideBanner: true, fullWidth: true },
    },
  };
}

ContactUsPage.Layout = LandingPageLayout;
