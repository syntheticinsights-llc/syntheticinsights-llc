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
