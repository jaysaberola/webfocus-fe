"use client";

import { useCmsHelp } from "@/lib/cmsHelp/CmsHelpContext";
import CmsHelpGuideAvatar from "@/components/Help/CmsHelpGuideAvatar";
import { CMS_GUIDE_NAME } from "@/lib/cmsHelp/guideVoice";

export default function CmsHelpLauncher() {
  const { mode, openBrowse } = useCmsHelp();

  if (mode !== "closed") return null;

  return (
    <button
      type="button"
      className="cms-help-launcher"
      aria-label={`Open ${CMS_GUIDE_NAME} CMS guide`}
      title={`${CMS_GUIDE_NAME} — CMS Guide Library`}
      onClick={() => openBrowse()}
    >
      <CmsHelpGuideAvatar size="sm" />
    </button>
  );
}
