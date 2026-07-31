export function normalizeBannerAnimationName(value: unknown) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return "";
  return raw.replace(/^animate__/, "").replace(/[^a-zA-Z0-9_-]/g, "");
}

export function resolveBannerTransitionClass(
  album: Record<string, unknown> | null | undefined,
  direction: "in" | "out"
) {
  if (!album) return "";

  const resolved =
    (direction === "in"
      ? album.transition_in_value ?? album.transitionInValue
      : album.transition_out_value ?? album.transitionOutValue) ??
    (direction === "in"
      ? album.transition_in ?? album.transitionIn
      : album.transition_out ?? album.transitionOut);

  return normalizeBannerAnimationName(resolved);
}

export function bannerAnimationClasses(animationName: string, enabled: boolean) {
  if (!enabled || !animationName) return [];
  return ["animate__animated", `animate__${animationName}`];
}

export const BANNER_ANIMATION_DURATION_MS = 900;

export function resolveBannerSlideInterval(transitionSeconds: unknown, fallbackMs = 5000) {
  const seconds = Number(transitionSeconds);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }
  return fallbackMs;
}
