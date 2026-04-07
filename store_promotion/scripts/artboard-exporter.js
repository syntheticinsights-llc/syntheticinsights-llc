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

function buildExportFilename(slide) {
  const safeLabel = slide.label.replace(/\s+/g, '-');
  return `${slide.id}-${safeLabel}.png`;
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
