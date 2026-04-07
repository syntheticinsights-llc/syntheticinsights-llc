function loadExportImage(rawSrc) {
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

const baseArtboardCache = new Map();
const exportTaskConcurrency = Math.max(
  2,
  Math.min(4, Math.floor((navigator.hardwareConcurrency || 8) / 2)),
);

function buildExportFilename(slide) {
  const safeLabel = slide.label.replace(/\s+/g, '-');
  return `${slide.id}-${safeLabel}.png`;
}

function createExportScaler(spec) {
  const scaleX = spec.width / baseExportSpec.width;
  const scaleY = spec.height / baseExportSpec.height;

  return {
    x(value) {
      return value * scaleX;
    },
    y(value) {
      return value * scaleY;
    },
    w(value) {
      return value * scaleX;
    },
    h(value) {
      return value * scaleY;
    },
  };
}

function drawTitle(context, spec, scaler, text) {
  context.save();
  context.font = `700 ${Math.round(scaler.h(124))}px ${exportFontFamily}`;
  context.fillStyle = '#20181b';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText(text.title, spec.width / 2, scaler.y(150));
  context.restore();
}

function drawDescription(context, spec, scaler, text, options) {
  drawMultilineText(context, {
    text: text.description,
    x: spec.width / 2,
    y: scaler.y(options.y),
    maxWidth: scaler.w(options.maxWidth),
    lineHeight: scaler.h(options.lineHeight),
    align: 'center',
    color: 'rgba(49, 37, 42, 0.74)',
    font: `400 ${Math.round(scaler.h(62))}px ${exportFontFamily}`,
  });
}

function createExportCanvas(spec) {
  const outputCanvas = document.createElement('canvas');

  outputCanvas.width = spec.width;
  outputCanvas.height = spec.height;

  return outputCanvas;
}

function getCanvasContext(canvas) {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('画布上下文创建失败');
  }

  return context;
}

function drawFilterStackText(context, spec, scaler, text) {
  context.save();
  context.font = `700 ${Math.round(scaler.h(122))}px ${exportFontFamily}`;
  context.fillStyle = '#20181b';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText(text.title, spec.width / 2, scaler.y(1040));
  context.restore();

  drawDescription(context, spec, scaler, text, {
    y: 1228,
    maxWidth: 980,
    lineHeight: 84,
  });
}

function drawSlideText(context, slide, spec, scaler, text) {
  if (slide.layout === 'filter-stack') {
    drawFilterStackText(context, spec, scaler, text);
    return;
  }

  drawTitle(context, spec, scaler, text);

  if (slide.layout === 'corner-phone') {
    drawDescription(context, spec, scaler, text, {
      y: 316,
      maxWidth: 900,
      lineHeight: 84,
    });
    return;
  }

  drawDescription(context, spec, scaler, text, {
    y: 316,
    maxWidth: 1020,
    lineHeight: 86,
  });
}

async function createBaseArtboard(slide, platformCode) {
  const platform = getExportPlatform(platformCode);
  const spec = platform.spec;
  const scaler = createExportScaler(spec);
  const outputCanvas = createExportCanvas(spec);
  const context = getCanvasContext(outputCanvas);

  drawArtboardBackground(context, slide, spec);

  if (slide.layout === 'filter-stack') {
    const [topImage, bottomImage] = await Promise.all([
      loadExportImage(slide.topImageSrc),
      loadExportImage(slide.bottomImageSrc),
    ]);

    drawDeviceFrame(context, {
      x: (spec.width - scaler.w(920)) / 2,
      y: scaler.y(-660),
      width: scaler.w(920),
      platform: platformCode,
      background: slide.screenBackground,
      image: topImage,
    });

    drawDeviceFrame(context, {
      x: (spec.width - scaler.w(920)) / 2,
      y: scaler.y(1848),
      width: scaler.w(920),
      platform: platformCode,
      background: slide.screenBackground,
      image: bottomImage,
    });
  } else if (slide.layout === 'corner-phone') {
    const image = await loadExportImage(slide.imageSrc);

    drawRadialGlow(
      context,
      scaler.x(1080),
      scaler.y(2320),
      scaler.w(440),
      'rgba(255,255,255,0.42)',
    );
    drawDeviceFrame(context, {
      x: scaler.x(480),
      y: scaler.y(806),
      width: scaler.w(1060),
      platform: platformCode,
      background: slide.screenBackground,
      image,
    });
  } else {
    const image = await loadExportImage(slide.imageSrc);

    drawDeviceFrame(context, {
      x: (spec.width - scaler.w(940)) / 2,
      y: scaler.y(712),
      width: scaler.w(940),
      platform: platformCode,
      background: slide.screenBackground,
      image,
    });
  }

  return outputCanvas;
}

function getBaseArtboard(slide, platformCode) {
  const cacheKey = `${platformCode}:${slide.id}`;

  if (!baseArtboardCache.has(cacheKey)) {
    baseArtboardCache.set(cacheKey, createBaseArtboard(slide, platformCode));
  }

  return baseArtboardCache.get(cacheKey);
}

function renderCanvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG 导出失败'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

async function renderArtboardToPng(slide, lang, platformCode) {
  const platform = getExportPlatform(platformCode);
  const spec = platform.spec;
  const scaler = createExportScaler(spec);
  const text = getSlideText(slide, lang);
  const baseArtboard = await getBaseArtboard(slide, platformCode);
  const outputCanvas = createExportCanvas(spec);
  const context = getCanvasContext(outputCanvas);

  context.drawImage(baseArtboard, 0, 0);
  drawSlideText(context, slide, spec, scaler, text);

  return renderCanvasToBlob(outputCanvas);
}

async function prepareExportAssets(platformCodes) {
  const tasks = [];

  for (const platformCode of platformCodes) {
    for (const slide of slides) {
      tasks.push(getBaseArtboard(slide, platformCode));
    }
  }

  await Promise.all(tasks);
}

async function runTasksWithConcurrency(taskFactories, concurrency) {
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < taskFactories.length) {
      const currentIndex = nextIndex;

      nextIndex += 1;
      await taskFactories[currentIndex]();
    }
  }

  const workerCount = Math.min(concurrency, taskFactories.length);
  const workers = Array.from({ length: workerCount }, () => worker());

  await Promise.all(workers);
}

async function buildExportTasks(exportDirectory, languageCodes, platformCodes, progress) {
  const tasks = [];

  for (const platformCode of platformCodes) {
    const platform = getExportPlatform(platformCode);
    const platformDirectory = await exportDirectory.getDirectoryHandle(platform.folderName, {
      create: true,
    });

    for (const lang of languageCodes) {
      const langDirectory = await platformDirectory.getDirectoryHandle(lang, {
        create: true,
      });

      for (const slide of slides) {
        tasks.push(async () => {
          const pngBlob = await renderArtboardToPng(slide, lang, platformCode);
          const fileHandle = await langDirectory.getFileHandle(buildExportFilename(slide), {
            create: true,
          });
          const writable = await fileHandle.createWritable();

          await writable.write(pngBlob);
          await writable.close();

          progress.done += 1;
          badge.textContent = `正在导出 ${progress.done}/${progress.total}`;
        });
      }
    }
  }

  return tasks;
}

async function exportCurrentLanguage() {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error('当前浏览器不支持目录选择');
  }

  const platformCodes = getSelectedPlatformCodes();

  if (platformCodes.length === 0) {
    throw new Error('请至少选择一个导出平台');
  }

  await document.fonts.ready;
  const parentDirectory = await window.showDirectoryPicker({ mode: 'readwrite' });
  const exportDirectory = await parentDirectory.getDirectoryHandle(exportRootFolderName, {
    create: true,
  });

  const progress = { done: 0, total: platformCodes.length * slides.length };

  setExportState({
    badgeText: `正在导出 0/${progress.total}`,
    busy: true,
  });

  await prepareExportAssets(platformCodes);
  const tasks = await buildExportTasks(exportDirectory, [currentLanguage], platformCodes, progress);
  await runTasksWithConcurrency(tasks, exportTaskConcurrency);

  const langName = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)?.name ?? currentLanguage;
  const platformLabel = platformCodes.map((code) => getExportPlatform(code).label).join(' / ');

  setExportState({
    badgeText: `${langName} ${platformLabel} ${progress.total} 张已导出`,
    currentButtonText: '再次导出当前语言',
    allButtonText: '导出全部语言',
    busy: false,
  });
}

async function exportAllLanguages() {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error('当前浏览器不支持目录选择');
  }

  const platformCodes = getSelectedPlatformCodes();

  if (platformCodes.length === 0) {
    throw new Error('请至少选择一个导出平台');
  }

  await document.fonts.ready;
  const parentDirectory = await window.showDirectoryPicker({ mode: 'readwrite' });
  const exportDirectory = await parentDirectory.getDirectoryHandle(exportRootFolderName, {
    create: true,
  });

  const total = SUPPORTED_LANGUAGES.length * slides.length * platformCodes.length;
  const progress = { done: 0, total };

  setExportState({
    badgeText: `正在导出 0/${total}`,
    busy: true,
  });

  await prepareExportAssets(platformCodes);
  const tasks = await buildExportTasks(
    exportDirectory,
    SUPPORTED_LANGUAGES.map((lang) => lang.code),
    platformCodes,
    progress,
  );
  await runTasksWithConcurrency(tasks, exportTaskConcurrency);

  setExportState({
    badgeText: `${platformCodes.length} 平台 × ${SUPPORTED_LANGUAGES.length} 种语言 × ${slides.length} 张已导出`,
    currentButtonText: '导出当前语言',
    allButtonText: '再次导出全部语言',
    busy: false,
  });
}
