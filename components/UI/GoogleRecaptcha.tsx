import Script from "next/script";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

type GoogleRecaptchaProps = {
  siteKey: string;
  onChange: (token: string | null) => void;
  className?: string;
};

export type GoogleRecaptchaHandle = {
  reset: () => void;
};

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    __recaptchaOnLoad?: () => void;
  }
}

const GoogleRecaptcha = forwardRef<GoogleRecaptchaHandle, GoogleRecaptchaProps>(
  function GoogleRecaptcha({ siteKey, onChange, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const onChangeRef = useRef(onChange);
    const [scriptReady, setScriptReady] = useState(false);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
        onChangeRef.current(null);
      },
    }));

    useEffect(() => {
      window.__recaptchaOnLoad = () => setScriptReady(true);
      if (window.grecaptcha) {
        setScriptReady(true);
      }

      return () => {
        delete window.__recaptchaOnLoad;
      };
    }, []);

    useEffect(() => {
      if (!scriptReady || !siteKey || !containerRef.current || !window.grecaptcha) {
        return;
      }

      if (widgetIdRef.current !== null) {
        return;
      }

      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onChangeRef.current(token),
        "expired-callback": () => onChangeRef.current(null),
        "error-callback": () => onChangeRef.current(null),
      });
    }, [scriptReady, siteKey]);

    if (!siteKey) {
      return null;
    }

    return (
      <>
        <Script
          src="https://www.google.com/recaptcha/api.js?onload=__recaptchaOnLoad&render=explicit"
          strategy="afterInteractive"
        />
        <div ref={containerRef} className={className} />
      </>
    );
  }
);

export default GoogleRecaptcha;
