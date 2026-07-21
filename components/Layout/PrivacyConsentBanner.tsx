import { useEffect, useState } from "react";
import LegalContentModal from "@/components/Layout/LegalContentModal";
import {
  DEFAULT_PRIVACY_HTML,
  DEFAULT_PRIVACY_POPUP,
  DEFAULT_PRIVACY_TITLE,
} from "@/lib/defaultPrivacyContent";
import { getPublicLegalContent, type PublicLegalContent } from "@/services/publicLegalService";

const CONSENT_STORAGE_KEY = "webfocus.publicConsent.v1";
const LEGAL_MODAL_TITLE = "Privacy Policy & Terms of Use";

const FALLBACK_LEGAL: PublicLegalContent = {
  title: DEFAULT_PRIVACY_TITLE,
  popup_content: DEFAULT_PRIVACY_POPUP,
  html: DEFAULT_PRIVACY_HTML,
  terms_title: "Terms of Use",
};

export default function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [legalContent, setLegalContent] = useState<PublicLegalContent>(FALLBACK_LEGAL);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVisible(localStorage.getItem(CONSENT_STORAGE_KEY) !== "1");
  }, []);

  useEffect(() => {
    getPublicLegalContent()
      .then((content) => setLegalContent({ ...FALLBACK_LEGAL, ...content }))
      .catch(() => setLegalContent(FALLBACK_LEGAL));
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.classList.toggle("has-privacy-consent-banner", visible);
    return () => {
      document.body.classList.remove("has-privacy-consent-banner");
    };
  }, [visible]);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "1");
    setVisible(false);
    setModalOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="privacy-consent-banner" role="dialog" aria-label="Privacy and terms agreement">
        <div className="privacy-consent-banner__inner">
          <p className="privacy-consent-banner__text">
            By using the site, you agree to our{" "}
            <button type="button" className="privacy-consent-banner__link" onClick={() => setModalOpen(true)}>
              Privacy Policy &amp; Terms of Use
            </button>
            .
          </p>
          <button type="button" className="privacy-consent-banner__btn" onClick={handleAccept}>
            I Agree
          </button>
        </div>
      </div>

      <LegalContentModal
        open={modalOpen}
        title={LEGAL_MODAL_TITLE}
        html={legalContent.html}
        onClose={() => setModalOpen(false)}
        onAccept={handleAccept}
      />
    </>
  );
}
