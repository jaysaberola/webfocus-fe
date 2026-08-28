export type CmsHelpStepPlacement = "top" | "bottom" | "left" | "right" | "center";

export type CmsHelpStep = {
  title: string;
  body: string;
  details?: string[];
  tip?: string;
  /** Optional screenshot or diagram URL shown in the guide library */
  image?: string;
  /** CSS selector for the on-page element to highlight during live tour */
  target?: string;
  /** Optional visual preset override: "layout:highlight" e.g. "page-editor:grapes-bar" */
  visual?: string;
  /** Navigate here before highlighting (if user is on another page) */
  route?: string;
  placement?: CmsHelpStepPlacement;
  /** Skip this step when the target is not on screen (TinyMCE vs Visual Builder). */
  skipIfMissing?: boolean;
};

export type CmsHelpGuide = {
  id: string;
  group: string;
  title: string;
  icon: string;
  summary: string;
  steps: CmsHelpStep[];
};
