const canvas = document.getElementById('workspace-canvas');
const badge = document.getElementById('workspace-badge');
const exportCurrentButton = document.getElementById('export-current-button');
const exportAllButton = document.getElementById('export-all-button');
const languageSelector = document.getElementById('language-selector');
const platformSelectors = [...document.querySelectorAll('[data-export-platform]')];
let exportBusy = false;

function initLanguageSelector() {
  SUPPORTED_LANGUAGES.forEach((lang) => {
    const option = document.createElement('option');

    option.value = lang.code;
    option.textContent = `${lang.name}`;
    languageSelector.appendChild(option);
  });

  languageSelector.value = currentLanguage;
}

function getSelectedPlatformCodes() {
  return platformSelectors
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function updateBadgeText() {
  const selectedCount = getSelectedPlatformCodes().length;

  if (selectedCount === 0) {
    badge.textContent = '请选择导出平台';
    return;
  }

  badge.textContent = `${selectedCount} 平台 × ${slides.length} 张待导出`;
}

function syncExportControls() {
  const hasSelection = getSelectedPlatformCodes().length > 0;

  exportCurrentButton.disabled = exportBusy || !hasSelection;
  exportAllButton.disabled = exportBusy || !hasSelection;
  languageSelector.disabled = exportBusy;

  platformSelectors.forEach((input) => {
    input.disabled = exportBusy;
  });
}

function setExportState({ badgeText, currentButtonText, allButtonText, busy }) {
  exportBusy = busy;

  if (badgeText != null) {
    badge.textContent = badgeText;
  }

  if (currentButtonText != null) {
    exportCurrentButton.textContent = currentButtonText;
  }

  if (allButtonText != null) {
    exportAllButton.textContent = allButtonText;
  }

  syncExportControls();
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

updateBadgeText();
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
  updateBadgeText();
});

platformSelectors.forEach((input) => {
  input.addEventListener('change', () => {
    updateBadgeText();
    syncExportControls();
  });
});

exportCurrentButton.addEventListener('click', handleExport(exportCurrentLanguage));
exportAllButton.addEventListener('click', handleExport(exportAllLanguages));
syncExportControls();
