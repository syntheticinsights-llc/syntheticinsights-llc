const captureRoot = document.getElementById('capture-root');

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

function getRequestedLanguage(params) {
  const requestedLanguage = params.get('lang') ?? currentLanguage;
  const supportedLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === requestedLanguage);

  if (!supportedLanguage) {
    throw new Error(`未知语言: ${requestedLanguage}`);
  }

  return supportedLanguage.code;
}

function getRequestedPlatformCode(params) {
  const platformCode = params.get('platform') ?? 'ios';

  getExportPlatform(platformCode);
  return platformCode;
}

function getRequestedSlide(params) {
  const slideKey = params.get('slide') ?? slides[0]?.key;
  const slide = slides.find((item) => item.key === slideKey);

  if (!slide) {
    throw new Error(`未知画板: ${slideKey}`);
  }

  return slide;
}

function getCaptureMeta() {
  return {
    languages: SUPPORTED_LANGUAGES.map(({ code, name }) => ({ code, name })),
    platforms: Object.values(exportPlatforms).map(({ code, label, folderName }) => ({
      code,
      label,
      folderName,
    })),
    slides: slides.map(({ id, key, label }) => ({ id, key, label })),
  };
}

function getDeviceImages(root) {
  const frames = root.querySelectorAll('iphone-device-frame, android-device-frame');

  return [...frames]
    .map((frame) => frame.shadowRoot?.querySelector('.screen-image'))
    .filter(Boolean);
}

async function waitForImage(image) {
  if (!image.getAttribute('src')) {
    return;
  }

  if (!image.complete) {
    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener(
        'error',
        () => reject(new Error(`图片加载失败: ${image.currentSrc || image.src}`)),
        { once: true },
      );
    });
  }

  if (typeof image.decode === 'function') {
    await image.decode().catch(() => {});
  }
}

async function waitForCaptureReady(root) {
  const frameTags = [...root.querySelectorAll('iphone-device-frame, android-device-frame')]
    .map((frame) => frame.tagName.toLowerCase());

  await Promise.all([...new Set(frameTags)].map((tagName) => customElements.whenDefined(tagName)));
  await document.fonts.ready;
  await Promise.all(getDeviceImages(root).map(waitForImage));
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function renderCapture() {
  const params = getSearchParams();
  const lang = getRequestedLanguage(params);
  const platformCode = getRequestedPlatformCode(params);
  const slide = getRequestedSlide(params);
  const platform = getExportPlatform(platformCode);
  const text = getSlideText(slide, lang);

  window.captureReady = false;
  window.captureError = null;
  window.storePromotionCaptureMeta = getCaptureMeta();

  captureRoot.innerHTML = renderStandaloneArtboard(slide, platform.spec, platformCode, text);
  document.title = `Capture ${platformCode} ${lang} ${slide.key}`;

  await waitForCaptureReady(captureRoot);

  window.captureReady = true;
}

async function bootCapture() {
  try {
    await renderCapture();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Capture 渲染失败';

    window.captureError = message;
    window.captureReady = false;
    captureRoot.innerHTML = `<pre class="capture-error">${message}</pre>`;
    console.error(error);
  }
}

bootCapture();
