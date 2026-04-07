const iosSpec = {
  device: 'iPhone 6.9"',
  frameDevice: 'iPhone 15 Pro Max',
  width: 1320,
  height: 2868,
  ratio: '1320 × 2868',
  previewScale: 0.17,
};

const slides = [
  {
    id: '01',
    key: 'kanban',
    label: 'Kanban',
    layout: 'feature-phone',
    primary: '#9ed4ff',
    secondary: '#bfdcff',
    accent: '#dff4ff',
    highlight: 'rgba(194, 172, 255, 0.42)',
    bloom: 'rgba(255, 214, 242, 0.34)',
    imageSrc: './assets/ios_screen/kanban.png',
    screenBackground: '#ffffff',
  },
  {
    id: '02',
    key: 'assistant',
    label: 'Assistant',
    layout: 'feature-phone',
    primary: '#ffd1de',
    secondary: '#f3d8ff',
    accent: '#ffe8d9',
    highlight: 'rgba(255, 160, 202, 0.38)',
    bloom: 'rgba(190, 173, 255, 0.28)',
    imageSrc: './assets/ios_screen/assistant.png',
    screenBackground: '#ffffff',
  },
  {
    id: '03',
    key: 'filter',
    label: 'Filter',
    layout: 'filter-stack',
    primary: '#8ecff0',
    secondary: '#a7dcf7',
    accent: '#4f86c8',
    highlight: 'rgba(196, 186, 255, 0.26)',
    bloom: 'rgba(214, 235, 255, 0.24)',
    topImageSrc: './assets/ios_screen/filter1.jpg',
    bottomImageSrc: './assets/ios_screen/filter2.jpg',
    screenBackground: '#ffffff',
  },
  {
    id: '04',
    key: 'graph',
    label: 'Graph',
    layout: 'feature-phone',
    primary: '#efd0ff',
    secondary: '#ffd5e7',
    accent: '#e7d8ff',
    highlight: 'rgba(255, 145, 204, 0.34)',
    bloom: 'rgba(174, 209, 255, 0.22)',
    imageSrc: './assets/ios_screen/graph.png',
    screenBackground: '#ffffff',
  },
  {
    id: '05',
    key: 'localFirst',
    label: 'Local first',
    layout: 'corner-phone',
    primary: '#d9f0e6',
    secondary: '#d7ebff',
    accent: '#eef6cf',
    highlight: 'rgba(214, 235, 149, 0.34)',
    bloom: 'rgba(157, 211, 255, 0.22)',
    imageSrc: './assets/ios_screen/sync.jpg',
    screenBackground: '#ffffff',
  },
];

let currentLanguage = 'en';

const canvas = document.getElementById('workspace-canvas');
const badge = document.getElementById('workspace-badge');
const exportCurrentButton = document.getElementById('export-current-button');
const exportAllButton = document.getElementById('export-all-button');
const languageSelector = document.getElementById('language-selector');
const exportFolderName = 'iOS';
const imageSourceCache = new Map();
const exportFontFamily = '"SF Pro Display", "Helvetica Neue", Arial, sans-serif';
const deviceAspectRatio = 926 / 430;
const deviceShellColor = '#f7f2fa';
const deviceBorderColor = 'rgba(214, 203, 232, 0.96)';
const screenBorderColor = 'rgba(226, 218, 239, 0.95)';

function getSlideText(slide, lang) {
  const language = lang ?? currentLanguage;
  const t = slideTranslations[slide.key]?.[language];

  if (t) {
    return { title: t.title, description: t.description, tags: t.tags };
  }

  const en = slideTranslations[slide.key]?.en;

  if (en) {
    return { title: en.title, description: en.description, tags: en.tags };
  }

  return { title: slide.label, description: '', tags: [] };
}

function initLanguageSelector() {
  SUPPORTED_LANGUAGES.forEach((lang) => {
    const option = document.createElement('option');

    option.value = lang.code;
    option.textContent = `${lang.name}`;
    languageSelector.appendChild(option);
  });

  languageSelector.value = currentLanguage;
}

function setExportState({ badgeText, currentButtonText, allButtonText, busy }) {
  badge.textContent = badgeText;

  if (currentButtonText != null) {
    exportCurrentButton.textContent = currentButtonText;
  }

  if (allButtonText != null) {
    exportAllButton.textContent = allButtonText;
  }

  exportCurrentButton.disabled = busy;
  exportAllButton.disabled = busy;
  languageSelector.disabled = busy;
}

function buildExportFilename(slide) {
  const safeLabel = slide.label.replace(/\s+/g, '-');
  return `${slide.id}-${safeLabel}.png`;
}

async function loadExportImage(rawSrc) {
  if (!rawSrc) {
    return null;
  }

  const absoluteSrc = new URL(rawSrc, document.baseURI).href;

  if (!imageSourceCache.has(absoluteSrc)) {
    imageSourceCache.set(
      absoluteSrc,
      new Promise((resolve, reject) => {
        const image = new Image();

        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`图片加载失败: ${absoluteSrc}`));
        image.src = absoluteSrc;
      }),
    );
  }

  return imageSourceCache.get(absoluteSrc);
}

function roundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function fillRoundedRect(context, x, y, width, height, radius, fillStyle) {
  context.save();
  context.fillStyle = fillStyle;
  roundedRectPath(context, x, y, width, height, radius);
  context.fill();
  context.restore();
}

function drawRadialGlow(context, x, y, radius, color) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawArtboardBackground(context, slide) {
  const background = context.createLinearGradient(0, 0, 0, iosSpec.height);
  background.addColorStop(0, slide.primary);
  background.addColorStop(0.54, slide.secondary);
  background.addColorStop(1, slide.accent);
  context.fillStyle = background;
  context.fillRect(0, 0, iosSpec.width, iosSpec.height);

  drawRadialGlow(context, iosSpec.width * 0.14, iosSpec.height * 0.1, 360, 'rgba(255,255,255,0.78)');
  drawRadialGlow(context, iosSpec.width * 0.78, iosSpec.height * 0.18, 420, slide.highlight);
  drawRadialGlow(context, iosSpec.width * 0.26, iosSpec.height * 0.74, 420, slide.bloom);
  drawRadialGlow(context, iosSpec.width * 0.88, iosSpec.height * 0.78, 340, 'rgba(255,255,255,0.34)');

  const veil = context.createLinearGradient(0, 0, iosSpec.width, iosSpec.height);
  veil.addColorStop(0, 'rgba(255,255,255,0.68)');
  veil.addColorStop(0.34, 'rgba(255,255,255,0.12)');
  veil.addColorStop(0.58, 'rgba(255,255,255,0)');
  context.fillStyle = veil;
  context.fillRect(0, 0, iosSpec.width, iosSpec.height);
}

function drawMultilineText(context, {
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  align = 'center',
  color = '#20181b',
  font,
}) {
  context.save();
  context.font = font;
  context.fillStyle = color;
  context.textAlign = align;
  context.textBaseline = 'top';

  const chars = [...text];
  const lines = [];
  let currentLine = '';

  for (const char of chars) {
    const nextLine = currentLine + char;

    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  context.restore();
  return lines.length;
}

function drawDeviceFrame(context, {
  x,
  y,
  width,
  background = '#ffffff',
  image = null,
}) {
  const height = width * deviceAspectRatio;
  const shellRadius = width * (80 / 612);
  const screenInsetX = width * 0.042;
  const screenInsetY = height * 0.0195;
  const screenX = x + screenInsetX;
  const screenY = y + screenInsetY;
  const screenWidth = width - screenInsetX * 2;
  const screenHeight = height - screenInsetY * 2;
  const screenRadius = width * (64 / 612);

  context.save();
  context.shadowColor = 'rgba(13, 8, 4, 0.18)';
  context.shadowBlur = 48;
  context.shadowOffsetY = 28;
  fillRoundedRect(context, x, y, width, height, shellRadius, deviceShellColor);
  context.restore();

  context.save();
  context.lineWidth = 1.5;
  context.strokeStyle = deviceBorderColor;
  roundedRectPath(context, x, y, width, height, shellRadius);
  context.stroke();
  context.restore();

  fillRoundedRect(context, screenX, screenY, screenWidth, screenHeight, screenRadius, background);

  if (image) {
    context.save();
    roundedRectPath(context, screenX, screenY, screenWidth, screenHeight, screenRadius);
    context.clip();

    const scale = Math.max(screenWidth / image.width, screenHeight / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = screenX + (screenWidth - drawWidth) / 2;
    const drawY = screenY + (screenHeight - drawHeight) / 2;

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    context.restore();
  }

  context.save();
  context.lineWidth = 1.5;
  context.strokeStyle = screenBorderColor;
  roundedRectPath(context, screenX, screenY, screenWidth, screenHeight, screenRadius);
  context.stroke();
  context.restore();
}

async function renderArtboardToPng(slide, lang) {
  const text = getSlideText(slide, lang);
  const outputCanvas = document.createElement('canvas');
  const context = outputCanvas.getContext('2d');

  if (!context) {
    throw new Error('画布上下文创建失败');
  }

  outputCanvas.width = iosSpec.width;
  outputCanvas.height = iosSpec.height;

  drawArtboardBackground(context, slide);

  if (slide.layout === 'filter-stack') {
    const [topImage, bottomImage] = await Promise.all([
      loadExportImage(slide.topImageSrc),
      loadExportImage(slide.bottomImageSrc),
    ]);

    drawDeviceFrame(context, {
      x: (iosSpec.width - 920) / 2,
      y: -660,
      width: 920,
      background: slide.screenBackground,
      image: topImage,
    });

    context.save();
    context.font = `700 122px ${exportFontFamily}`;
    context.fillStyle = '#20181b';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(text.title, iosSpec.width / 2, 1040);
    context.restore();

    drawMultilineText(context, {
      text: text.description,
      x: iosSpec.width / 2,
      y: 1228,
      maxWidth: 980,
      lineHeight: 84,
      align: 'center',
      color: 'rgba(49, 37, 42, 0.74)',
      font: `400 62px ${exportFontFamily}`,
    });

    drawDeviceFrame(context, {
      x: (iosSpec.width - 920) / 2,
      y: 1848,
      width: 920,
      background: slide.screenBackground,
      image: bottomImage,
    });
  } else if (slide.layout === 'corner-phone') {
    const image = await loadExportImage(slide.imageSrc);

    context.save();
    context.font = `700 124px ${exportFontFamily}`;
    context.fillStyle = '#20181b';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(text.title, iosSpec.width / 2, 150);
    context.restore();

    drawMultilineText(context, {
      text: text.description,
      x: iosSpec.width / 2,
      y: 316,
      maxWidth: 900,
      lineHeight: 84,
      align: 'center',
      color: 'rgba(49, 37, 42, 0.74)',
      font: `400 62px ${exportFontFamily}`,
    });

    drawRadialGlow(context, 1080, 2320, 440, 'rgba(255,255,255,0.42)');
    drawDeviceFrame(context, {
      x: 480,
      y: 806,
      width: 1060,
      background: slide.screenBackground,
      image,
    });
  } else {
    const image = await loadExportImage(slide.imageSrc);

    context.save();
    context.font = `700 124px ${exportFontFamily}`;
    context.fillStyle = '#20181b';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(text.title, iosSpec.width / 2, 150);
    context.restore();

    drawMultilineText(context, {
      text: text.description,
      x: iosSpec.width / 2,
      y: 316,
      maxWidth: 1020,
      lineHeight: 86,
      align: 'center',
      color: 'rgba(49, 37, 42, 0.74)',
      font: `400 62px ${exportFontFamily}`,
    });

    drawDeviceFrame(context, {
      x: (iosSpec.width - 940) / 2,
      y: 712,
      width: 940,
      background: slide.screenBackground,
      image,
    });
  }

  return await new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG 导出失败'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

async function exportSlidesForLanguage(exportDirectory, lang, progress) {
  const langDirectory = await exportDirectory.getDirectoryHandle(lang, {
    create: true,
  });

  await Promise.all(slides.map(async (slide) => {
    const pngBlob = await renderArtboardToPng(slide, lang);
    const fileHandle = await langDirectory.getFileHandle(buildExportFilename(slide), {
      create: true,
    });
    const writable = await fileHandle.createWritable();

    await writable.write(pngBlob);
    await writable.close();

    if (progress) {
      progress.done += 1;
      badge.textContent = `正在导出 ${progress.done}/${progress.total}`;
    }
  }));
}

async function exportCurrentLanguage() {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error('当前浏览器不支持目录选择');
  }

  await document.fonts.ready;
  const parentDirectory = await window.showDirectoryPicker({ mode: 'readwrite' });
  const exportDirectory = await parentDirectory.getDirectoryHandle(exportFolderName, {
    create: true,
  });

  const progress = { done: 0, total: slides.length };

  setExportState({
    badgeText: `正在导出 0/${progress.total}`,
    busy: true,
  });

  await exportSlidesForLanguage(exportDirectory, currentLanguage, progress);

  const langName = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.name ?? currentLanguage;

  setExportState({
    badgeText: `${langName} ${slides.length} 张已导出`,
    currentButtonText: '再次导出当前语言',
    allButtonText: '导出全部语言',
    busy: false,
  });
}

async function exportAllLanguages() {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error('当前浏览器不支持目录选择');
  }

  await document.fonts.ready;
  const parentDirectory = await window.showDirectoryPicker({ mode: 'readwrite' });
  const exportDirectory = await parentDirectory.getDirectoryHandle(exportFolderName, {
    create: true,
  });

  const total = SUPPORTED_LANGUAGES.length * slides.length;
  const progress = { done: 0, total };

  setExportState({
    badgeText: `正在导出 0/${total}`,
    busy: true,
  });

  await Promise.all(SUPPORTED_LANGUAGES.map((lang) =>
    exportSlidesForLanguage(exportDirectory, lang.code, progress),
  ));

  setExportState({
    badgeText: `${SUPPORTED_LANGUAGES.length} 种语言 × ${slides.length} 张已导出`,
    currentButtonText: '导出当前语言',
    allButtonText: '再次导出全部语言',
    busy: false,
  });
}

function renderSlide(slide) {
  const text = getSlideText(slide);
  const column = document.createElement('section');
  column.className = 'slide-column';
  const deviceBlock = slide.layout === 'filter-stack'
    ? `
        <div class="device-stage device-stage-top">
          <iphone-device-frame
            class="promotion-device"
            image-src="${slide.topImageSrc ?? ''}"
            screen-background="${slide.screenBackground}"
          ></iphone-device-frame>
        </div>

        <div class="artboard-copy">
          <h3>${text.title}</h3>
          <p>${text.description}</p>
        </div>

        <div class="device-stage device-stage-bottom">
          <iphone-device-frame
            class="promotion-device"
            image-src="${slide.bottomImageSrc ?? ''}"
            screen-background="${slide.screenBackground}"
          ></iphone-device-frame>
        </div>
      `
    : slide.layout === 'corner-phone'
    ? `
        <div class="artboard-copy">
          <h3>${text.title}</h3>
          <p>${text.description}</p>
        </div>

        <div class="device-stage">
          <iphone-device-frame
            class="promotion-device"
            image-src="${slide.imageSrc ?? ''}"
            screen-background="${slide.screenBackground}"
          ></iphone-device-frame>
        </div>
      `
    : `
        <div class="artboard-copy">
          <h3>${text.title}</h3>
          <p>${text.description}</p>
        </div>

        <div class="device-stage">
          <iphone-device-frame
            class="promotion-device"
            image-src="${slide.imageSrc ?? ''}"
            screen-background="${slide.screenBackground}"
          ></iphone-device-frame>
        </div>

        <div class="footer-strip">
          <div class="feature-tags">
            ${text.tags
              .map((tag) => `<span class="feature-tag">${tag}</span>`)
              .join('')}
          </div>
          <div class="footer-mark">${iosSpec.frameDevice}</div>
        </div>
      `;
  column.innerHTML = `
    <div class="slide-meta">
      <strong>#${slide.id} ${slide.label}</strong>
      <span>${iosSpec.ratio}</span>
    </div>
    <div class="preview-frame">
      <article
        class="artboard ${slide.layout ?? ''}"
        style="
          --slide-primary: ${slide.primary};
          --slide-secondary: ${slide.secondary};
          --slide-accent: ${slide.accent};
          --slide-highlight: ${slide.highlight};
          --slide-bloom: ${slide.bloom};
        "
      >
        <div class="artboard-content">
          ${deviceBlock}
        </div>
      </article>
    </div>
  `;
  return column;
}

function renderAllSlides() {
  canvas.innerHTML = '';

  slides.forEach((slide) => {
    canvas.appendChild(renderSlide(slide));
  });
}

initLanguageSelector();
renderAllSlides();

badge.textContent = `${slides.length} 张待导出`;
document.documentElement.style.setProperty(
  '--preview-scale',
  String(iosSpec.previewScale),
);
document.documentElement.style.setProperty(
  '--artboard-width-px',
  `${iosSpec.width}px`,
);
document.documentElement.style.setProperty(
  '--artboard-height-px',
  `${iosSpec.height}px`,
);
document.documentElement.style.setProperty(
  '--preview-width-px',
  `${iosSpec.width * iosSpec.previewScale}px`,
);
document.documentElement.style.setProperty(
  '--preview-height-px',
  `${iosSpec.height * iosSpec.previewScale}px`,
);

languageSelector.addEventListener('change', () => {
  currentLanguage = languageSelector.value;
  renderAllSlides();
  badge.textContent = `${slides.length} 张待导出`;
});

function handleExport(exportFn) {
  return async () => {
    setExportState({
      badgeText: '准备导出',
      currentButtonText: '导出中...',
      allButtonText: '导出中...',
      busy: true,
    });

    try {
      await exportFn();
    } catch (error) {
      const message =
        error?.name === 'AbortError'
          ? '已取消导出'
          : error instanceof Error
          ? error.message
          : '导出失败';

      setExportState({
        badgeText: message,
        currentButtonText: '导出当前语言',
        allButtonText: '导出全部语言',
        busy: false,
      });
      console.error(error);
    }
  };
}

exportCurrentButton.addEventListener('click', handleExport(exportCurrentLanguage));
exportAllButton.addEventListener('click', handleExport(exportAllLanguages));
