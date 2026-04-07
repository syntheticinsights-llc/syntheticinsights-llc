const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '简体中文' },
  { code: 'zh-Hant', name: '繁體中文' },
];

const slideTranslations = {
  kanban: {
    en: {
      title: 'Kanban',
      description: 'Track progress and manage tasks with drag and drop',
      tags: ['Quick Capture', 'Inbox First'],
    },
    de: {
      title: 'Kanban',
      description: 'Fortschritt verfolgen und Aufgaben per Drag & Drop verwalten',
      tags: ['Schnellerfassung', 'Eingang zuerst'],
    },
    es: {
      title: 'Kanban',
      description: 'Sigue el progreso y gestiona tareas arrastrando y soltando',
      tags: ['Captura rápida', 'Bandeja primero'],
    },
    fr: {
      title: 'Kanban',
      description: 'Suivez la progression et gérez les tâches par glisser-déposer',
      tags: ['Capture rapide', 'Boîte de réception'],
    },
    it: {
      title: 'Kanban',
      description: 'Monitora i progressi e gestisci le attività con il drag and drop',
      tags: ['Cattura rapida', 'Prima la posta in arrivo'],
    },
    ja: {
      title: 'カンバン',
      description: 'ドラッグ＆ドロップで進捗を追跡し、タスクを管理',
      tags: ['クイックキャプチャ', '受信トレイ優先'],
    },
    ko: {
      title: '칸반',
      description: '드래그 앤 드롭으로 진행 상황을 추적하고 작업을 관리하세요',
      tags: ['빠른 캡처', '받은편지함 우선'],
    },
    pt: {
      title: 'Kanban',
      description: 'Acompanhe o progresso e gerencie tarefas com arrastar e soltar',
      tags: ['Captura rápida', 'Caixa de entrada'],
    },
    ru: {
      title: 'Канбан',
      description: 'Отслеживайте прогресс и управляйте задачами перетаскиванием',
      tags: ['Быстрый ввод', 'Входящие'],
    },
    zh: {
      title: '看板',
      description: '通过拖拽追踪进度，轻松管理任务',
      tags: ['快速捕获', '收件箱优先'],
    },
    'zh-Hant': {
      title: '看板',
      description: '透過拖放追蹤進度，輕鬆管理任務',
      tags: ['快速擷取', '收件匣優先'],
    },
  },

  assistant: {
    en: {
      title: 'Assistant',
      description: 'Your AI agent for managing tasks, changing icons, generating summaries, and more.',
      tags: ['AI Rewrite', 'Task Polish'],
    },
    de: {
      title: 'Assistent',
      description: 'Dein KI-Agent für Aufgabenverwaltung, Symbole ändern, Zusammenfassungen erstellen und mehr.',
      tags: ['KI-Umschreiben', 'Aufgaben-Feinschliff'],
    },
    es: {
      title: 'Asistente',
      description: 'Tu agente de IA para gestionar tareas, cambiar iconos, generar resúmenes y más.',
      tags: ['Reescritura IA', 'Pulir tareas'],
    },
    fr: {
      title: 'Assistant',
      description: 'Votre agent IA pour gérer les tâches, changer les icônes, générer des résumés et plus encore.',
      tags: ['Réécriture IA', 'Peaufinage'],
    },
    it: {
      title: 'Assistente',
      description: 'Il tuo agente IA per gestire attività, cambiare icone, generare riassunti e altro.',
      tags: ['Riscrittura IA', 'Rifinitura attività'],
    },
    ja: {
      title: 'アシスタント',
      description: 'タスク管理、アイコン変更、要約生成などを行うAIエージェント。',
      tags: ['AI書き換え', 'タスク磨き'],
    },
    ko: {
      title: '어시스턴트',
      description: '작업 관리, 아이콘 변경, 요약 생성 등을 지원하는 AI 에이전트.',
      tags: ['AI 다시 쓰기', '작업 다듬기'],
    },
    pt: {
      title: 'Assistente',
      description: 'Seu agente de IA para gerenciar tarefas, alterar ícones, gerar resumos e muito mais.',
      tags: ['Reescrita IA', 'Refinamento de tarefas'],
    },
    ru: {
      title: 'Ассистент',
      description: 'Ваш ИИ-агент для управления задачами, смены иконок, создания сводок и многого другого.',
      tags: ['ИИ-переписать', 'Уточнение задач'],
    },
    zh: {
      title: '助手',
      description: '你的 AI 代理——管理任务、更换图标、生成摘要等。',
      tags: ['AI 重写', '任务优化'],
    },
    'zh-Hant': {
      title: '助手',
      description: '你的 AI 代理——管理任務、更換圖示、產生摘要等。',
      tags: ['AI 重寫', '任務優化'],
    },
  },

  filter: {
    en: {
      title: 'Powerful filters',
      description: 'Build powerful filters with 10+ conditions and flexible combinations',
      tags: ['Advanced Rules', 'Flexible Logic'],
    },
    de: {
      title: 'Leistungsstarke Filter',
      description: 'Erstelle leistungsstarke Filter mit 10+ Bedingungen und flexiblen Kombinationen',
      tags: ['Erweiterte Regeln', 'Flexible Logik'],
    },
    es: {
      title: 'Filtros potentes',
      description: 'Crea filtros potentes con más de 10 condiciones y combinaciones flexibles',
      tags: ['Reglas avanzadas', 'Lógica flexible'],
    },
    fr: {
      title: 'Filtres puissants',
      description: 'Créez des filtres puissants avec plus de 10 conditions et des combinaisons flexibles',
      tags: ['Règles avancées', 'Logique flexible'],
    },
    it: {
      title: 'Filtri potenti',
      description: 'Crea filtri potenti con oltre 10 condizioni e combinazioni flessibili',
      tags: ['Regole avanzate', 'Logica flessibile'],
    },
    ja: {
      title: 'パワフルなフィルター',
      description: '10以上の条件と柔軟な組み合わせで強力なフィルターを構築',
      tags: ['高度なルール', '柔軟なロジック'],
    },
    ko: {
      title: '강력한 필터',
      description: '10개 이상의 조건과 유연한 조합으로 강력한 필터를 구축하세요',
      tags: ['고급 규칙', '유연한 로직'],
    },
    pt: {
      title: 'Filtros poderosos',
      description: 'Crie filtros poderosos com mais de 10 condições e combinações flexíveis',
      tags: ['Regras avançadas', 'Lógica flexível'],
    },
    ru: {
      title: 'Мощные фильтры',
      description: 'Создавайте мощные фильтры с 10+ условиями и гибкими комбинациями',
      tags: ['Расширенные правила', 'Гибкая логика'],
    },
    zh: {
      title: '强大筛选',
      description: '通过 10+ 条件与灵活组合，构建强大的筛选器',
      tags: ['高级规则', '灵活逻辑'],
    },
    'zh-Hant': {
      title: '強大篩選',
      description: '透過 10+ 條件與靈活組合，建構強大的篩選器',
      tags: ['進階規則', '靈活邏輯'],
    },
  },

  graph: {
    en: {
      title: 'Graph',
      description: 'Understand task structure and relationships at a glance',
      tags: ['Graph View', 'Task Links'],
    },
    de: {
      title: 'Graph',
      description: 'Aufgabenstruktur und Zusammenhänge auf einen Blick verstehen',
      tags: ['Graph-Ansicht', 'Aufgabenlinks'],
    },
    es: {
      title: 'Gráfico',
      description: 'Comprende la estructura y las relaciones de las tareas de un vistazo',
      tags: ['Vista de gráfico', 'Enlaces de tareas'],
    },
    fr: {
      title: 'Graphe',
      description: "Comprenez la structure et les relations des tâches en un coup d'œil",
      tags: ['Vue graphe', 'Liens de tâches'],
    },
    it: {
      title: 'Grafico',
      description: "Comprendi la struttura e le relazioni delle attività a colpo d'occhio",
      tags: ['Vista grafico', 'Link attività'],
    },
    ja: {
      title: 'グラフ',
      description: 'タスクの構造と関連性を一目で把握',
      tags: ['グラフビュー', 'タスクリンク'],
    },
    ko: {
      title: '그래프',
      description: '작업 구조와 관계를 한눈에 파악하세요',
      tags: ['그래프 보기', '작업 링크'],
    },
    pt: {
      title: 'Gráfico',
      description: 'Compreenda a estrutura e os relacionamentos das tarefas de relance',
      tags: ['Visão de gráfico', 'Links de tarefas'],
    },
    ru: {
      title: 'Граф',
      description: 'Поймите структуру задач и их взаимосвязи с первого взгляда',
      tags: ['Вид графа', 'Связи задач'],
    },
    zh: {
      title: '图谱',
      description: '一目了然地理解任务结构与关系',
      tags: ['图谱视图', '任务关联'],
    },
    'zh-Hant': {
      title: '圖譜',
      description: '一目了然地理解任務結構與關係',
      tags: ['圖譜檢視', '任務關聯'],
    },
  },

  localFirst: {
    en: {
      title: 'Local first',
      description: 'Super fast, privacy-friendly, and seamlessly synced.',
      tags: ['Sync', 'Cross Device'],
    },
    de: {
      title: 'Lokal zuerst',
      description: 'Superschnell, datenschutzfreundlich und nahtlos synchronisiert.',
      tags: ['Synchronisation', 'Geräteübergreifend'],
    },
    es: {
      title: 'Local primero',
      description: 'Súper rápido, respetuoso con la privacidad y sincronizado sin problemas.',
      tags: ['Sincronización', 'Multi-dispositivo'],
    },
    fr: {
      title: "Local d'abord",
      description: 'Ultra rapide, respectueux de la vie privée et synchronisé en toute transparence.',
      tags: ['Synchronisation', 'Multi-appareils'],
    },
    it: {
      title: 'Prima in locale',
      description: 'Super veloce, rispettoso della privacy e sincronizzato senza interruzioni.',
      tags: ['Sincronizzazione', 'Multi-dispositivo'],
    },
    ja: {
      title: 'ローカルファースト',
      description: '超高速、プライバシーに配慮、シームレスに同期。',
      tags: ['同期', 'マルチデバイス'],
    },
    ko: {
      title: '로컬 우선',
      description: '초고속, 프라이버시 친화적, 원활한 동기화.',
      tags: ['동기화', '크로스 디바이스'],
    },
    pt: {
      title: 'Local primeiro',
      description: 'Super rápido, amigável à privacidade e sincronizado perfeitamente.',
      tags: ['Sincronização', 'Multi-dispositivo'],
    },
    ru: {
      title: 'Сначала локально',
      description: 'Сверхбыстро, безопасно для конфиденциальности и бесшовная синхронизация.',
      tags: ['Синхронизация', 'Кроссплатформенность'],
    },
    zh: {
      title: '本地优先',
      description: '超快速度、保护隐私、无缝同步。',
      tags: ['同步', '跨设备'],
    },
    'zh-Hant': {
      title: '本地優先',
      description: '超快速度、保護隱私、無縫同步。',
      tags: ['同步', '跨裝置'],
    },
  },
};
