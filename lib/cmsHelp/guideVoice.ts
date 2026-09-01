export const CMS_GUIDE_NAME = "Aria";
export const CMS_GUIDE_ROLE = "CMS Guide";

const STEP_CUES = [
  "Okay, look here first.",
  "Follow me — this is the next spot.",
  "Shift your eyes to this area.",
  "This part matters, so stay with me.",
  "Here’s what I want you to notice now.",
];

export function spokenWelcome(guideTitle: string) {
  return `Hi, I’m ${CMS_GUIDE_NAME}. I’ll walk you through ${guideTitle} like we’re sitting together. Watch the highlighted area, then do each step I call out.`;
}

export function spokenGuideIntro(title: string, summary: string) {
  return `We’re on ${title}. ${summary} I’ll show you where to click and what happens next.`;
}

export function spokenStepCue(stepIndex: number) {
  return STEP_CUES[stepIndex % STEP_CUES.length];
}

export function spokenTip(tip: string) {
  return `Quick tip from me: ${tip}`;
}

export function spokenStepScript(
  step: { title: string; body: string; details?: string[]; tip?: string },
  stepIndex: number,
  totalSteps: number
) {
  const lines = [
    spokenStepCue(stepIndex),
    `Step ${stepIndex + 1} of ${totalSteps}. ${step.title}.`,
    step.body,
  ];

  if (step.details && step.details.length > 0) {
    lines.push("Do this with me.");
    step.details.slice(0, 4).forEach((line, index) => {
      lines.push(`${index + 1}. ${line}`);
    });
  }

  if (step.tip) lines.push(spokenTip(step.tip));
  return lines.join(" ");
}
