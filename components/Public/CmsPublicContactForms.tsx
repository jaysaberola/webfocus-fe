import { initCmsContactForms } from "@/lib/initCmsContactForms";
import { websiteService } from "@/services/websiteService";
import { useEffect, useState } from "react";

type Props = {
  recaptchaSiteKey?: string;
  rootRef?: React.RefObject<HTMLElement | null>;
};

export default function CmsPublicContactForms({ recaptchaSiteKey = "", rootRef }: Props) {
  const [siteKey, setSiteKey] = useState(recaptchaSiteKey);

  useEffect(() => {
    if (recaptchaSiteKey) {
      setSiteKey(recaptchaSiteKey);
      return;
    }

    let alive = true;
    websiteService
      .getPublicBranding()
      .then((branding) => {
        if (!alive) return;
        setSiteKey(branding?.google_recaptcha_sitekey ?? "");
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [recaptchaSiteKey]);

  useEffect(() => {
    const root = rootRef?.current ?? document;
    return initCmsContactForms({ root, recaptchaSiteKey: siteKey });
  }, [siteKey, rootRef]);

  return null;
}
