function getPlatformDeviceTag(platform) {
  return platform === 'android' ? 'android-device-frame' : 'iphone-device-frame';
}

function getPlatformLabel(platform) {
  return platform === 'android' ? 'Android' : 'iOS';
}

function buildPreviewStyle(spec) {
  return `
    --artboard-width-px: ${spec.width}px;
    --artboard-height-px: ${spec.height}px;
    --preview-scale: ${spec.previewScale};
    --preview-width-px: ${spec.width * spec.previewScale}px;
    --preview-height-px: ${spec.height * spec.previewScale}px;
  `;
}

function buildArtboardStyle(slide, spec, previewScale) {
  return `
    --artboard-width-px: ${spec.width}px;
    --artboard-height-px: ${spec.height}px;
    ${previewScale != null ? `--preview-scale: ${previewScale};` : ''}
    --slide-primary: ${slide.primary};
    --slide-secondary: ${slide.secondary};
    --slide-accent: ${slide.accent};
    --slide-highlight: ${slide.highlight};
    --slide-bloom: ${slide.bloom};
  `;
}

function renderDeviceFrame(tagName, imageSrc, screenBackground) {
  return `
    <${tagName}
      class="promotion-device"
      image-src="${imageSrc ?? ''}"
      screen-background="${screenBackground}"
    ></${tagName}>
  `;
}

function buildDeviceBlock(slide, spec, deviceTag, text) {
  if (slide.layout === 'filter-stack') {
    return `
      <div class="device-stage device-stage-top">
        ${renderDeviceFrame(deviceTag, slide.topImageSrc, slide.screenBackground)}
      </div>

      <div class="artboard-copy">
        <h3>${text.title}</h3>
        <p>${text.description}</p>
      </div>

      <div class="device-stage device-stage-bottom">
        ${renderDeviceFrame(deviceTag, slide.bottomImageSrc, slide.screenBackground)}
      </div>
    `;
  }

  if (slide.layout === 'corner-phone') {
    return `
      <div class="artboard-copy">
        <h3>${text.title}</h3>
        <p>${text.description}</p>
      </div>

      <div class="device-stage">
        ${renderDeviceFrame(deviceTag, slide.imageSrc, slide.screenBackground)}
      </div>
    `;
  }

  return `
    <div class="artboard-copy">
      <h3>${text.title}</h3>
      <p>${text.description}</p>
    </div>

    <div class="device-stage">
      ${renderDeviceFrame(deviceTag, slide.imageSrc, slide.screenBackground)}
    </div>

    <div class="footer-strip">
      <div class="feature-tags">
        ${text.tags
          .map((tag) => `<span class="feature-tag">${tag}</span>`)
          .join('')}
      </div>
      <div class="footer-mark">${spec.frameDevice}</div>
    </div>
  `;
}

function renderArtboardMarkup(slide, spec, platform, text, options = {}) {
  const deviceTag = getPlatformDeviceTag(platform);
  const classes = [
    'artboard',
    `artboard-platform-${platform}`,
    slide.layout ?? '',
    options.className ?? '',
  ].filter(Boolean).join(' ');

  return `
    <article
      class="${classes}"
      style="${buildArtboardStyle(slide, spec, options.previewScale)}"
    >
      <div class="artboard-content">
        ${buildDeviceBlock(slide, spec, deviceTag, text)}
      </div>
    </article>
  `;
}

function renderStandaloneArtboard(slide, spec, platform, text) {
  return renderArtboardMarkup(slide, spec, platform, text, {
    className: 'artboard-standalone',
    previewScale: 1,
  });
}

function renderPlatformPreview(slide, spec, platform, text) {
  return `
    <section class="platform-preview platform-preview-${platform}">
      <div class="platform-label">
        <strong>${getPlatformLabel(platform)}</strong>
        <span>${spec.ratio}</span>
      </div>
      <div class="preview-frame" style="${buildPreviewStyle(spec)}">
        ${renderArtboardMarkup(slide, spec, platform, text)}
      </div>
    </section>
  `;
}

function renderSlide(slide) {
  const text = getSlideText(slide);
  const column = document.createElement('section');

  column.className = 'slide-column';
  column.innerHTML = `
    <div class="slide-meta">
      <strong>#${slide.id} ${slide.label}</strong>
      <span>iOS / Android</span>
    </div>
    <div class="platform-stack">
      ${renderPlatformPreview(slide, iosSpec, 'ios', text)}
      ${renderPlatformPreview(slide, androidSpec, 'android', text)}
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
