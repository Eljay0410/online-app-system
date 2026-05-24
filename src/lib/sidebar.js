export function getInitialSidebarCollapsed() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(max-width: 639px)").matches;
}

export function getSidebarContentPadding(collapsed) {
  return collapsed ? "pl-20" : "sm:pl-72";
}
