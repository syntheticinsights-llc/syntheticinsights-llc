(() => {
  const link = document.querySelector("[data-app-store-link]");
  if (!link) return;

  // Apple drops the app path for mainland China visitors when the link has no
  // storefront prefix, so they land on the storefront home page instead of the
  // app. The /cn/ URL resolves correctly there, and elsewhere it still opens
  // the local storefront.
  const MAINLAND_CHINA_TIME_ZONES = new Set([
    "Asia/Shanghai",
    "Asia/Chongqing",
    "Asia/Harbin",
    "Asia/Urumqi",
  ]);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isSimplifiedChinesePage = document.documentElement.dataset.locale === "zh-hans";

  if (!isSimplifiedChinesePage && !MAINLAND_CHINA_TIME_ZONES.has(timeZone)) return;

  const appId = link.href.match(/id(\d+)/)?.[1];
  if (appId) link.href = `https://apps.apple.com/cn/app/id${appId}`;
})();