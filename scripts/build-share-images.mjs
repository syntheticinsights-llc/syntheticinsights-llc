// Renders the social share cards for every locale from
// scripts/share-preview.template.html. Run: npm run share-preview
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = join(ROOT, "i18n/locales");
const TEMPLATE = join(ROOT, "scripts/share-preview.template.html");
const ICON = join(ROOT, "assets/img/icon.svg");
const OUTPUT_DIR = join(ROOT, "assets/img/share");
const WIDTH = 1200;
const HEIGHT = 630;

const BROWSER_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const chipsOf = (page) =>
  [page.graphTitle, page.agentTitle, page.filtersTitle, page.localTitle]
    .map((label) => `<span class="chip"><span class="chip__dot"></span>${escapeHtml(label)}</span>`)
    .join("\n          ");

const renderCard = (template, icon, page) =>
  template
    .replace("__ICON__", icon)
    .replace("__TITLE__", escapeHtml(page.heroTitle.replace(/\s+/g, " ").trim()))
    .replace("__CHIPS__", chipsOf(page));

const findBrowser = () => {
  const executablePath = process.env.CHROME_PATH;
  if (executablePath) return executablePath;
  const found = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("No Chromium browser found. Set CHROME_PATH to its executable.");
  return found;
};

const template = await readFile(TEMPLATE, "utf8");
const icon = await readFile(ICON, "utf8");
const localeFiles = (await readdir(LOCALES_DIR)).filter((name) => name.endsWith(".json")).sort();
const locales = localeFiles
  .map((name) => name.replace(/\.json$/, ""))
  .sort((left, right) => (right === "en" ? 1 : left === "en" ? -1 : left.localeCompare(right)));

await mkdir(OUTPUT_DIR, { recursive: true });
const workDir = await mkdtemp(join(tmpdir(), "smartodo-share-"));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });

try {
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: WIDTH, height: HEIGHT } });

  for (const locale of locales) {
    const text = JSON.parse(await readFile(join(LOCALES_DIR, `${locale}.json`), "utf8"));
    const htmlPath = join(workDir, `${locale}.html`);
    await writeFile(htmlPath, renderCard(template, icon, text.page));
    await page.goto(`file://${htmlPath}`);
    await page.screenshot({ path: join(OUTPUT_DIR, `smartodo-${locale}.png`), clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  }
} finally {
  await browser.close();
  await rm(workDir, { recursive: true, force: true });
}

console.log(`Rendered ${locales.length} share cards into assets/img/share: ${locales.join(", ")}`);