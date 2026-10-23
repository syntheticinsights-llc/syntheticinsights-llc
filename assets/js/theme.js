// Theme management for the Smartodo website.
// Loaded synchronously in <head> so the theme is set before the first paint, which
// means nothing here may wait for DOMContentLoaded to apply it.
(() => {
  const STORAGE_KEY = "smartodo-theme";
  const systemQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  // Storage can be blocked (site-data settings, sandboxed frames). The theme then
  // follows the system preference, and the rest of the page keeps working.
  const getStoredTheme = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const getEffectiveTheme = () => getStoredTheme() || (systemQuery?.matches ? "dark" : "light");

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    // The logo image follows the theme through CSS; the favicon is a head link and
    // needs to be swapped here. This script is loaded after that link, so it exists.
    const favicon = document.querySelector('link[rel="icon"]');
    const href = favicon?.getAttribute("href");
    if (href) {
      const next = theme === "dark" ? href.replace("icon.svg", "icon_dark.svg") : href.replace("icon_dark.svg", "icon.svg");
      if (next !== href) favicon.setAttribute("href", next);
    }
  };

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
  };

  applyTheme(getEffectiveTheme());

  document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-theme-toggle]")) toggleTheme();
    });
  });

  // Keep following the system until the visitor chooses a theme themselves.
  systemQuery?.addEventListener?.("change", (event) => {
    if (!getStoredTheme()) applyTheme(event.matches ? "dark" : "light");
  });
})();