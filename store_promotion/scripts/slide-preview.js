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
