import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

export const DEFAULT_BASE_URL = 'http://127.0.0.1:8000/store_promotion/';
export const DEFAULT_OUTPUT_DIR = path.resolve('store_promotion/exports/playwright');
export const EXPORT_ROOT_FOLDER_NAME = 'StorePromotion';

const DEFAULT_VIEWPORT = { width: 1600, height: 3200 };
const MAC_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function pickRequestedItems(allItems, requestedCodes, label) {
  if (requestedCodes.length === 0) {
    return allItems;
  }

  return requestedCodes.map((code) => {
    const item = allItems.find((candidate) => candidate.code === code || candidate.key === code);

    if (!item) {
      throw new Error(`未知${label}: ${code}`);
    }

    return item;
  });
}

function buildCaptureUrl(baseUrl, platformCode, langCode, slideKey) {
  const captureUrl = new URL('capture.html', ensureTrailingSlash(baseUrl));

  captureUrl.searchParams.set('platform', platformCode);
  captureUrl.searchParams.set('lang', langCode);
  captureUrl.searchParams.set('slide', slideKey);
  return captureUrl.href;
}

async function getCaptureMeta(page, baseUrl) {
  const captureUrl = new URL('capture.html', ensureTrailingSlash(baseUrl)).href;

  await page.goto(captureUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.captureReady === true || window.captureError != null);

  const captureError = await page.evaluate(() => window.captureError);

  if (captureError) {
    throw new Error(captureError);
  }

  return page.evaluate(() => window.storePromotionCaptureMeta);
}

async function captureArtboard(page, options) {
  const { baseUrl, outputDir, platform, language, slide } = options;
  const captureUrl = buildCaptureUrl(baseUrl, platform.code, language.code, slide.key);

  await page.goto(captureUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.captureReady === true || window.captureError != null);

  const captureError = await page.evaluate(() => window.captureError);

  if (captureError) {
    throw new Error(captureError);
  }

  const artboard = page.locator('.artboard-standalone');
  const platformDirectory = path.join(outputDir, platform.folderName, language.code);

  await fs.mkdir(platformDirectory, { recursive: true });

  const filePath = path.join(platformDirectory, `${slide.id}-${slide.label.replace(/\s+/g, '-')}.png`);

  await artboard.screenshot({
    animations: 'disabled',
    path: filePath,
  });

  return filePath;
}

export async function exportStorePromotion(options = {}) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    outputDir = DEFAULT_OUTPUT_DIR,
    languages: requestedLanguages = [],
    platforms: requestedPlatforms = [],
    slides: requestedSlides = [],
    onProgress,
  } = options;

  const normalizedOutputDir = path.resolve(outputDir);
  const browser = await chromium.launch({
    executablePath: MAC_CHROME_PATH,
    headless: true,
  });

  try {
    const page = await browser.newPage({
      deviceScaleFactor: 1,
      viewport: DEFAULT_VIEWPORT,
    });
    const meta = await getCaptureMeta(page, baseUrl);
    const languages = pickRequestedItems(meta.languages, requestedLanguages, '语言');
    const platforms = pickRequestedItems(meta.platforms, requestedPlatforms, '平台');
    const slidesToExport = pickRequestedItems(meta.slides, requestedSlides, '画板');
    const files = [];
    let done = 0;
    const total = languages.length * platforms.length * slidesToExport.length;

    for (const platform of platforms) {
      for (const language of languages) {
        for (const slide of slidesToExport) {
          const filePath = await captureArtboard(page, {
            baseUrl,
            outputDir: normalizedOutputDir,
            platform,
            language,
            slide,
          });

          done += 1;
          files.push({
            path: filePath,
            platform: platform.code,
            language: language.code,
            slide: slide.key,
          });

          if (onProgress) {
            await onProgress({
              done,
              total,
              filePath,
              platform: platform.code,
              language: language.code,
              slide: slide.key,
            });
          }
        }
      }
    }

    return {
      outputDir: normalizedOutputDir,
      total,
      files,
      languages: languages.map((item) => item.code),
      platforms: platforms.map((item) => item.code),
      slides: slidesToExport.map((item) => item.key),
    };
  } finally {
    await browser.close();
  }
}
