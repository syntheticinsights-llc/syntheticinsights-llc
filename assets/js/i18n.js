// Locale selection shared by the landing pages and the account pages.
// Mirrors the app: zh with the Hant script or a HK/MO/TW region is Traditional Chinese,
// other zh is Simplified, and anything unsupported falls back to English.
const LOCALES = ["en", "de", "es", "fr", "id", "it", "ja", "ko", "pt", "ru", "tr", "zh-hans", "zh-hant"];
const LOCALE_STORAGE_KEY = "smartodo-locale";
const TRADITIONAL_CHINESE_REGIONS = new Set(["HK", "MO", "TW"]);
const CRAWLER_PATTERN = /bot|crawl|spider|slurp|preview/i;

const matchLocale = (tag) => {
  if (!tag) return null;
  if (LOCALES.includes(tag)) return tag;
  const locale = new Intl.Locale(tag.replace("_", "-"));
  if (locale.language === "zh") {
    return locale.script === "Hant" || TRADITIONAL_CHINESE_REGIONS.has(locale.region) ? "zh-hant" : "zh-hans";
  }
  return LOCALES.includes(locale.language) ? locale.language : null;
};

const storedLocale = () => matchLocale(localStorage.getItem(LOCALE_STORAGE_KEY));

const browserLocale = () => navigator.languages.map(matchLocale).find(Boolean) ?? "en";

const preferredLocale = () => storedLocale() ?? browserLocale();

const landingPath = (locale) => (locale === "en" ? "./" : `${locale}/`);

// Landing pages: the language menu remembers the choice, and a first visit to the
// English root page moves to the visitor's language. Crawlers stay on the page they asked for.
if (document.documentElement.dataset.locale) {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-locale]");
    if (link) localStorage.setItem(LOCALE_STORAGE_KEY, link.dataset.locale);
    for (const menu of document.querySelectorAll(".lang-menu[open]")) {
      if (!menu.contains(event.target)) menu.open = false;
    }
  });

  const locale = preferredLocale();
  if (
    document.documentElement.dataset.locale === "en" &&
    locale !== "en" &&
    !CRAWLER_PATTERN.test(navigator.userAgent)
  ) {
    location.replace(`${landingPath(locale)}${location.hash}`);
  }
}

// Account pages: ?lang= from the app wins, then the saved choice, then the browser.
// Elements name their text with a data-i18n-* attribute, as "key" for shared text or
// "page.key" for this page's text. data-i18n writes HTML into the element, the others
// set a plain attribute.
const I18N_ATTRIBUTES = [
  ["i18n", (element, value) => (element.innerHTML = value)],
  ["i18nPlaceholder", (element, value) => (element.placeholder = value)],
  ["i18nAlt", (element, value) => (element.alt = value)],
  ["i18nAriaLabel", (element, value) => element.setAttribute("aria-label", value)],
  ["i18nTitle", (element, value) => (element.title = value)],
];

const applyAccountText = (page) => {
  const locale = matchLocale(new URLSearchParams(location.search).get("lang")) ?? preferredLocale();
  const shared = ACCOUNT_TEXT[locale];
  const text = { ...shared, ...shared[page] };
  const lookup = (key) => {
    const [scope, name] = key.includes(".") ? key.split(".") : [null, key];
    return scope ? shared[scope][name] : shared[name];
  };
  document.documentElement.lang = shared.htmlLang;
  document.title = text.title;
  for (const [dataKey, apply] of I18N_ATTRIBUTES) {
    const selector = `[data-${dataKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}]`;
    for (const element of document.querySelectorAll(selector)) {
      apply(element, lookup(element.dataset[dataKey]));
    }
  }
  for (const link of document.querySelectorAll("[data-landing-link]")) {
    link.href = `${landingPath(locale)}${link.dataset.landingLink}`;
  }
  return text;
};
