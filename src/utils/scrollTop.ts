export const scrollToTop = (behavior: ScrollBehavior = "auto") => {
  if (typeof window === "undefined") return;

  window.scrollTo({ top: 0, left: 0, behavior });
};
