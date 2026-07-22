import { useEffect, useState } from "react";
import Script from "next/script";
import {
  FreshchatConfig,
  getFreshchatConfigFromEnv,
  normalizeScriptSrc,
} from "@/lib/freshchatConfig";
import { getPublicFreshchatConfig } from "@/services/publicFreshchatService";

let missingConfigWarned = false;

function toRuntimeConfig(data: {
  token: string | null;
  host: string;
  direction: "ltr" | "rtl";
  fwc_script_src: string | null;
  css_class: string;
  css_right: string;
  css_bottom: string;
}): FreshchatConfig | null {
  if (!data.token && !data.fwc_script_src) return null;

  return {
    token: data.token || "",
    host: data.host,
    direction: data.direction,
    fwcScriptSrc: data.fwc_script_src,
    cssClass: data.css_class,
    cssRight: data.css_right,
    cssBottom: data.css_bottom,
  };
}

export default function FreshchatWidget() {
  const [config, setConfig] = useState<FreshchatConfig | null>(() => getFreshchatConfigFromEnv());

  useEffect(() => {
    if (config) return;

    let alive = true;

    (async () => {
      try {
        const remote = await getPublicFreshchatConfig();
        if (!alive) return;
        setConfig(toRuntimeConfig(remote));
      } catch {
        if (!alive || missingConfigWarned) return;
        missingConfigWarned = true;
        console.warn(
          "Freshchat: unable to load chat config. Set FWC_SCRIPT_SRC or FRESHCHAT_TOKEN in webfocus-be/.env."
        );
      }
    })();

    return () => {
      alive = false;
    };
  }, [config]);

  if (!config) return null;

  return (
    <>
      {config.token ? (
        <Script id="freshchat-widget" strategy="lazyOnload">
          {`
            window.fcSettings = {
              token: ${JSON.stringify(config.token)},
              host: ${JSON.stringify(config.host)},
              config: {
                headerProperty: {
                  direction: ${JSON.stringify(config.direction)}
                }
              }
            };
            window.fcWidgetMessengerConfig = {
              config: {
                cssNames: {
                  widget: ${JSON.stringify(config.cssClass)}
                }
              }
            };
            (function () {
              var script = document.createElement("script");
              script.src = ${JSON.stringify(`${config.host}/js/widget.js`)};
              script.async = true;
              document.body.appendChild(script);
            })();
          `}
        </Script>
      ) : null}

      {config.fwcScriptSrc ? (
        <Script
          id="freshworks-chat-widget"
          src={normalizeScriptSrc(config.fwcScriptSrc)}
          strategy="lazyOnload"
          {...({ chat: "true" } as Record<string, string>)}
        />
      ) : null}
    </>
  );
}
