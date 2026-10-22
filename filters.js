(() => {
  const TEXT = CARD_TEXT.filters;
  const TASKS = [
    { id: "ship", state: "todo", important: true, due: "fri" },
    { id: "login", state: "doing", important: true, due: "today", blocks: "v1.0" },
    { id: "notes", state: "todo", due: "thu", blocks: "v1.0" },
    { id: "qa", state: "todo", due: "nextWeek", blocks: "v1.0" },
    { id: "design", state: "done", blocks: "QA" },
    { id: "cats", state: "todo", due: "today" },
    { id: "passport", state: "todo", important: true, due: "nextMonth" },
    { id: "dentist", state: "done" },
  ].map((task) => ({ ...task, title: TEXT.tasks[task.id] }));

  const PREREQUISITES_OF_SHIP = new Set(["login", "notes", "qa", "design"]);
  const DUE_THIS_WEEK = new Set(["today", "thu", "fri"]);

  const CONDITIONS = [
    {
      kind: "status",
      ...TEXT.conditions.status,
      keep: (task) => task.state !== "done",
    },
    {
      kind: "blocks",
      ...TEXT.conditions.blocks,
      keep: (task) => PREREQUISITES_OF_SHIP.has(task.id),
    },
    {
      kind: "due",
      ...TEXT.conditions.due,
      keep: (task) => DUE_THIS_WEEK.has(task.due),
    },
  ];
  const FILTER_NAME = TEXT.filterName;

  const ROW_STRIDE = 34;

  const LINK_ICON = `
    <svg class="pf-glyph" viewBox="0 0 24 24">
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
    </svg>`;
  const CALENDAR_ICON = `
    <svg class="pf-glyph" viewBox="0 0 24 24">
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </svg>`;
  const FILTER_ICON = `
    <svg class="pf-glyph" viewBox="0 0 24 24">
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>`;
  const STAR_ICON = `
    <svg class="pf-star" viewBox="0 0 24 24">
      <path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.8Z" />
    </svg>`;
  const CONDITION_ICONS = { status: STATUS_ICON, blocks: LINK_ICON, due: CALENDAR_ICON };

  const LAYOUTS = [
    {
      name: "wide",
      minWidth: 600,
      width: 870,
      height: 340,
      builder: [0, 0, 330, 340],
      results: [370, 0, 500, 340],
      edge: "M330,170 H370",
    },
    {
      name: "narrow",
      minWidth: 0,
      width: 350,
      height: 680,
      builder: [0, 0, 350, 314],
      results: [0, 342, 350, 338],
      edge: "M175,314 V342",
    },
  ];

  class Filters {
    constructor(root) {
      this.root = root;
      this.clock = new Clock();
      this.visible = false;
      this.build();
      this.observe();
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        this.showFinished();
      } else {
        this.loop();
      }
    }

    build() {
      this.root.classList.add("tg", "pf");
      this.root.innerHTML = `
        <div class="tg-header">
          <div class="tg-heading">
            <span class="tg-eyebrow">${TEXT.eyebrow}</span>
            <span class="tg-title"></span>
          </div>
          <div class="tg-meter">
            <span class="tg-meter__count">${format(TEXT.meter, { count: "<b></b>", total: TASKS.length })}</span>
            <span class="tg-meter__track"><span class="tg-meter__fill"></span></span>
          </div>
        </div>
        <div class="tg-viewport">
          <div class="tg-fit">
            <div class="tg-stage">
              <div class="pf-builder">
                <div class="pf-builder__head">
                  <span class="pf-builder__title">${TEXT.newFilter}</span>
                  <span class="pf-logic">${TEXT.matchAll}</span>
                </div>
                <div class="pf-conds"></div>
                <div class="pf-add">${TEXT.addCondition}</div>
                <div class="pf-save">
                  <span class="pf-save__label"></span>
                </div>
              </div>
              <div class="pf-results">
                <div class="pf-results__head">
                  <span class="pf-results__title">${FILTER_ICON}<span class="pf-results__name"></span></span>
                  <span class="pf-results__count"></span>
                </div>
                <div class="pf-list"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="tg-legend">
          <span class="tg-legend__item"><span class="pf-logic pf-logic--legend">${TEXT.andOr}</span>${TEXT.legendCombine}</span>
          <span class="tg-legend__item">${TEXT.legendFields}</span>
        </div>`;
      this.title = this.root.querySelector(".tg-title");
      this.meterCount = this.root.querySelector(".tg-meter__count b");
      this.meterFill = this.root.querySelector(".tg-meter__fill");
      this.fit = this.root.querySelector(".tg-fit");
      this.stage = this.root.querySelector(".tg-stage");
      this.builder = this.root.querySelector(".pf-builder");
      this.conds = this.root.querySelector(".pf-conds");
      this.add = this.root.querySelector(".pf-add");
      this.save = this.root.querySelector(".pf-save");
      this.saveLabel = this.root.querySelector(".pf-save__label");
      this.results = this.root.querySelector(".pf-results");
      this.resultsName = this.root.querySelector(".pf-results__name");
      this.resultsCount = this.root.querySelector(".pf-results__count");
      this.list = this.root.querySelector(".pf-list");

      this.edgeLayer = svg("svg", { class: "tg-edges" });
      this.edge = svg("g", { class: "pf-edge" });
      this.edgePath = svg("path", { class: "pf-edge__line" });
      this.packet = svg("g", { class: "tg-edge__head" });
      this.packet.append(svg("circle", { r: 7, class: "tg-edge__halo" }), svg("circle", { r: 3 }));
      this.edge.append(this.edgePath, this.packet);
      this.edgeLayer.append(this.edge);
      this.stage.prepend(this.edgeLayer);

      this.tasks = TASKS.map((task) => this.createRow(task));
    }

    createRow(task) {
      const element = document.createElement("div");
      element.className = "pf-row";
      element.innerHTML = `
        ${STATUS_ICON}
        <span class="pf-row__title">${task.important ? STAR_ICON : ""}<span>${task.title}</span></span>
        <span class="pf-tag pf-tag--blocks">${task.blocks ? `${LINK_ICON}${format(TEXT.blocks, { task: task.blocks })}` : ""}</span>
        <span class="pf-tag pf-tag--due">${task.due ? TEXT.due[task.due] : ""}</span>`;
      this.list.append(element);
      return { ...task, initialState: task.state, element, shown: true, y: 0 };
    }

    observe() {
      new ResizeObserver(() => this.applyLayout()).observe(this.fit);
      new IntersectionObserver(
        ([entry]) => {
          this.visible = entry.isIntersecting;
          this.syncClock();
        },
        { threshold: 0.2 },
      ).observe(this.root);
      document.addEventListener("visibilitychange", () => this.syncClock());
    }

    syncClock() {
      this.clock.setRunning(this.visible && !document.hidden);
    }

    applyLayout() {
      const width = this.fit.clientWidth;
      const layout = LAYOUTS.find((candidate) => width >= candidate.minWidth);
      const scale = Math.min(1, width / layout.width);
      this.fit.style.height = `${layout.height * scale}px`;
      this.stage.style.width = `${layout.width}px`;
      this.stage.style.height = `${layout.height}px`;
      this.stage.style.transform = `translateX(${(width - layout.width * scale) / 2}px) scale(${scale})`;
      if (layout === this.layout) return;
      this.layout = layout;
      this.root.dataset.layout = layout.name;
      this.edgeLayer.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
      place(this.builder, layout.builder);
      place(this.results, layout.results);
      this.edgePath.setAttribute("d", layout.edge);
      this.movePacket(0);
    }

    movePacket(progress) {
      const length = this.edgePath.getTotalLength();
      const point = this.edgePath.getPointAtLength(progress * length);
      this.packet.setAttribute("transform", `translate(${point.x} ${point.y})`);
    }

    async flowPacket() {
      this.edge.classList.add("is-flowing");
      await this.clock.tween(650, (progress) => this.movePacket(progress), easeInOut);
      this.edge.classList.remove("is-flowing");
    }

    setTitle(text) {
      this.title.textContent = text;
    }

    setRowState(task, state) {
      task.state = state;
      task.element.dataset.state = state;
    }

    addCondition(condition, index) {
      const element = document.createElement("div");
      element.className = "pf-cond";
      element.dataset.state = "editing";
      element.dataset.kind = condition.kind;
      element.innerHTML = `
        ${index ? `<span class="pf-cond__and">${TEXT.and}</span>` : ""}
        <span class="pf-cond__icon">${CONDITION_ICONS[condition.kind]}</span>
        <span class="pf-cond__text">
          <span class="pf-cond__field">${condition.field}</span>
          <span class="pf-cond__value">${condition.value}</span>
        </span>`;
      this.conds.append(element);
      return element;
    }

    applyFilter(conditions, hit) {
      let index = 0;
      for (const task of this.tasks) {
        task.shown = conditions.every((condition) => condition.keep(task));
        task.element.classList.toggle("is-out", !task.shown);
        if (task.shown) task.y = index++ * ROW_STRIDE;
        task.element.style.transform = `translateY(${task.y}px)`;
        task.element.dataset.hit = task.shown && hit ? hit : "";
      }
      this.updateCount(index);
    }

    updateCount(shown) {
      this.meterCount.textContent = shown;
      this.meterFill.style.transform = `scaleX(${shown / TASKS.length})`;
      this.resultsCount.textContent = shown;
      flash(this.resultsCount);
    }

    setSaved(saved) {
      this.results.classList.toggle("is-saved", saved);
      this.save.dataset.state = saved ? "saved" : "idle";
      this.saveLabel.textContent = saved ? TEXT.savedToFilters : TEXT.saveFilter;
      this.resultsName.textContent = saved ? FILTER_NAME : TEXT.allTasks;
    }

    async press(element) {
      element.classList.add("is-pressed");
      await this.clock.wait(260);
      element.classList.remove("is-pressed");
    }

    reset() {
      this.root.classList.remove("is-complete");
      this.conds.replaceChildren();
      for (const task of this.tasks) {
        this.setRowState(task, task.initialState);
        task.element.classList.remove("is-changed");
      }
      this.applyFilter([]);
      this.setSaved(false);
      this.setTitle(TEXT.allTasks);
    }

    async loop() {
      const login = this.tasks.find((task) => task.id === "login");
      for (;;) {
        this.reset();
        await this.clock.wait(400);
        this.root.classList.remove("is-leaving");
        await this.clock.wait(900);

        for (const [index, condition] of CONDITIONS.entries()) {
          await this.press(this.add);
          const element = this.addCondition(condition, index);
          await this.clock.wait(700);
          await this.flowPacket();
          this.applyFilter(CONDITIONS.slice(0, index + 1), condition.kind);
          this.setTitle(condition.title);
          await this.clock.wait(700);
          element.dataset.state = "set";
          await this.clock.wait(1100);
        }
        this.applyFilter(CONDITIONS);

        await this.press(this.save);
        this.setSaved(true);
        this.setTitle(TEXT.savedAsFilter);
        await this.clock.wait(2000);

        this.setTitle(TEXT.updatesAsYouWork);
        this.setRowState(login, "done");
        flash(login.element);
        await this.clock.wait(1000);
        this.applyFilter(CONDITIONS);
        this.root.classList.add("is-complete");
        await this.clock.wait(3400);

        this.root.classList.add("is-leaving");
        await this.clock.wait(650);
      }
    }

    showFinished() {
      this.reset();
      for (const [index, condition] of CONDITIONS.entries()) {
        this.addCondition(condition, index).dataset.state = "set";
      }
      this.applyFilter(CONDITIONS);
      this.setSaved(true);
      this.setTitle(TEXT.savedAsFilter);
      this.root.classList.add("is-complete");
    }
  }

  const place = (element, [x, y, w, h]) => {
    Object.assign(element.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  };

  const flash = (element) => {
    element.classList.remove("is-changed");
    void element.offsetWidth;
    element.classList.add("is-changed");
  };

  for (const root of document.querySelectorAll("[data-filters]")) new Filters(root);
})();
