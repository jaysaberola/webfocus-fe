"use client";

import { useCmsHelp } from "@/lib/cmsHelp/CmsHelpContext";

export default function CmsHelpLauncher() {
  const { mode, openBrowse } = useCmsHelp();

  if (mode !== "closed") return null;

  return (
    <button
      type="button"
      className="cms-help-launcher"
      aria-label="Open CMS user guide"
      title="Guide Assistant — all topics & downloads"
      onClick={() => openBrowse()}
    >
      <i className="fa-solid fa-robot" aria-hidden="true" />
    </button>
  );
}
