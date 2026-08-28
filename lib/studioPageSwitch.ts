let studioPageSwitching = false;
let studioSwitchFromGrapes = false;

export function beginStudioPageSwitch(fromGrapes = true) {
  studioPageSwitching = true;
  studioSwitchFromGrapes = fromGrapes;
}

export function consumeStudioPageSwitch() {
  const active = studioPageSwitching;
  const fromGrapes = studioSwitchFromGrapes;
  studioPageSwitching = false;
  studioSwitchFromGrapes = false;
  return { active, fromGrapes };
}

export function isStudioPageSwitching() {
  return studioPageSwitching;
}
