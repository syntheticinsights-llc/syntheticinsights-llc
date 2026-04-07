const canvas = document.getElementById('workspace-canvas');
const badge = document.getElementById('workspace-badge');
const exportCurrentButton = document.getElementById('export-current-button');
const exportAllButton = document.getElementById('export-all-button');
const languageSelector = document.getElementById('language-selector');

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

exportCurrentButton.addEventListener('click', handleExport(exportCurrentLanguage));
exportAllButton.addEventListener('click', handleExport(exportAllLanguages));
