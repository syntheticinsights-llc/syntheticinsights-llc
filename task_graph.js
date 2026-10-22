(() => {
  const TASKS = [
    { id: "research", title: "Research", deps: [], duration: 1600 },
    { id: "design", title: "Design UI", deps: ["research"], duration: 2000 },
    { id: "api", title: "Build API", deps: ["research"], duration: 3200 },
    { id: "assets", title: "Marketing", deps: ["design"], duration: 2200 },
    { id: "frontend", title: "Frontend", deps: ["design", "api"], duration: 2200 },
    { id: "qa", title: "QA testing", deps: ["frontend"], duration: 1800 },
    { id: "ship", title: "Ship v1.0", deps: ["assets", "qa"], duration: 1400 },
  ];

  const LAYOUTS = [
    {
      name: "wide",
      minWidth: 600,
      direction: "horizontal",
      width: 870,
      height: 300,
      node: { w: 150, h: 60 },
      positions: {
        research: [75, 150],
        design: [255, 70],
        api: [255, 230],
        assets: [435, 70],
        frontend: [435, 230],
        qa: [615, 230],
        ship: [795, 150],
      },
    },
    {
      name: "narrow",
      minWidth: 0,
      direction: "vertical",
      width: 350,
      height: 540,
      node: { w: 160, h: 60 },
      positions: {
        research: [175, 30],
        design: [82, 150],
        api: [268, 150],
        assets: [82, 270],
        frontend: [268, 270],
        qa: [268, 390],
        ship: [175, 510],
      },
    },
  ];

  const LAYER_STAGGER = 140;
  const LEVEL_STAGGER = 110;

  class TaskGraph {
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
      this.root.classList.add("tg");
      this.root.innerHTML = `
        <div class="tg-header">
          <div class="tg-heading">
            <span class="tg-eyebrow">Dependency graph</span>
            <span class="tg-title"></span>
          </div>
          <div class="tg-meter">
            <span class="tg-meter__count"><b>0</b> / ${TASKS.length} done</span>
            <span class="tg-meter__track"><span class="tg-meter__fill"></span></span>
          </div>
        </div>
        <div class="tg-viewport">
          <div class="tg-fit">
            <div class="tg-stage"></div>
          </div>
        </div>
        <div class="tg-legend">
          <span class="tg-legend__item" data-state="todo">${STATUS_ICON}To do</span>
          <span class="tg-legend__item" data-state="doing">${STATUS_ICON}Doing</span>
          <span class="tg-legend__item" data-state="done">${STATUS_ICON}Done</span>
          <span class="tg-legend__item"><span class="tg-level">L2</span>Waiting on earlier levels</span>
        </div>`;
      this.title = this.root.querySelector(".tg-title");
      this.meterCount = this.root.querySelector(".tg-meter__count b");
      this.meterFill = this.root.querySelector(".tg-meter__fill");
      this.fit = this.root.querySelector(".tg-fit");
      this.stage = this.root.querySelector(".tg-stage");
      this.edgeLayer = svg("svg", { class: "tg-edges" });
      this.stage.append(this.edgeLayer);

      this.nodes = new Map(TASKS.map((task) => [task.id, this.createNode(task)]));
      this.edges = TASKS.flatMap((task) =>
        task.deps.map((dep) => this.createEdge(this.nodes.get(dep), this.nodes.get(task.id))),
      );
      for (const node of this.nodes.values()) {
        node.depth = node.deps.length
          ? 1 + Math.max(...node.deps.map((dep) => this.nodes.get(dep).depth))
          : 0;
      }
    }

    createNode(task) {
      const element = document.createElement("div");
      element.className = "tg-node";
      element.innerHTML = `
        ${STATUS_ICON}
        <span class="tg-node__text">
          <span class="tg-node__title">${task.title}</span>
          <span class="tg-node__meta">
            <span class="tg-level tg-node__level"><span class="tg-level__value"></span></span>
            <span class="tg-node__status"></span>
          </span>
        </span>
        <span class="tg-node__bar"></span>`;
      this.stage.append(element);
      return {
        ...task,
        element,
        status: element.querySelector(".tg-node__status"),
        levelValue: element.querySelector(".tg-level__value"),
        bar: element.querySelector(".tg-node__bar"),
        incoming: [],
        outgoing: [],
        state: "hidden",
        level: null,
        progress: 0,
        started: false,
      };
    }

    createEdge(from, to) {
      const group = svg("g", { class: "tg-edge" });
      const base = svg("path", { class: "tg-edge__base", pathLength: 1 });
      const fill = svg("path", { class: "tg-edge__fill", pathLength: 1 });
      const head = svg("g", { class: "tg-edge__head" });
      head.append(svg("circle", { r: 7, class: "tg-edge__halo" }), svg("circle", { r: 3 }));
      const startPort = svg("circle", { r: 3.5, class: "tg-port tg-port--start" });
      const endPort = svg("circle", { r: 3.5, class: "tg-port tg-port--end" });
      group.append(base, fill, startPort, endPort, head);
      this.edgeLayer.append(group);
      const edge = { from, to, group, base, fill, head, startPort, endPort, filled: false };
      from.outgoing.push(edge);
      to.incoming.push(edge);
      return edge;
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
      this.stage.style.setProperty("--tg-node-w", `${layout.node.w}px`);
      this.stage.style.setProperty("--tg-node-h", `${layout.node.h}px`);
      for (const node of this.nodes.values()) {
        const [x, y] = layout.positions[node.id];
        node.element.style.left = `${x - layout.node.w / 2}px`;
        node.element.style.top = `${y - layout.node.h / 2}px`;
      }
      for (const edge of this.edges) this.layoutEdge(edge);
    }

    layoutEdge(edge) {
      const { positions, node, direction } = this.layout;
      const [x1, y1] = positions[edge.from.id];
      const [x2, y2] = positions[edge.to.id];
      let d;
      let start;
      let end;
      if (direction === "horizontal") {
        start = [x1 + node.w / 2, y1];
        end = [x2 - node.w / 2, y2];
        const mid = (start[0] + end[0]) / 2;
        d = `M${start} C${mid},${start[1]} ${mid},${end[1]} ${end}`;
      } else {
        start = [x1, y1 + node.h / 2];
        end = [x2, y2 - node.h / 2];
        const mid = (start[1] + end[1]) / 2;
        d = `M${start} C${start[0]},${mid} ${end[0]},${mid} ${end}`;
      }
      edge.base.setAttribute("d", d);
      edge.fill.setAttribute("d", d);
      edge.startPort.setAttribute("cx", start[0]);
      edge.startPort.setAttribute("cy", start[1]);
      edge.endPort.setAttribute("cx", end[0]);
      edge.endPort.setAttribute("cy", end[1]);
    }

    computeLevels() {
      const levels = new Map();
      const levelOf = (node) => {
        if (!levels.has(node.id)) {
          const blockers = node.deps
            .map((dep) => this.nodes.get(dep))
            .filter((dep) => dep.state !== "done");
          levels.set(node.id, blockers.length ? 1 + Math.max(...blockers.map(levelOf)) : 1);
        }
        return levels.get(node.id);
      };
      for (const node of this.nodes.values()) if (node.state !== "done") levelOf(node);
      return levels;
    }

    setLevel(node, level) {
      const previous = node.level;
      node.level = level;
      node.element.dataset.level = level ?? "";
      node.element.classList.toggle("is-blocked", level > 1);
      if (level > 1) {
        if (previous > 1 && previous !== level) this.rollLevel(node, level);
        else node.levelValue.textContent = `L${level}`;
      }
      if (previous > 1 && level === 1) this.flash(node);
      this.refreshStatus(node);
    }

    rollLevel(node, level) {
      const value = node.levelValue;
      value
        .animate(
          [
            { transform: "translateY(0)", opacity: 1 },
            { transform: "translateY(-70%)", opacity: 0 },
          ],
          { duration: 160, easing: "ease-in" },
        )
        .finished.then(() => {
          value.textContent = `L${level}`;
          value.animate(
            [
              { transform: "translateY(70%)", opacity: 0 },
              { transform: "translateY(0)", opacity: 1 },
            ],
            { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
          );
        });
    }

    flash(node) {
      node.element.classList.remove("is-unblocked");
      void node.element.offsetWidth;
      node.element.classList.add("is-unblocked");
    }

    async refreshLevels() {
      const levels = this.computeLevels();
      const changed = [...this.nodes.values()]
        .filter((node) => node.state !== "done" && levels.get(node.id) !== node.level)
        .sort((a, b) => a.depth - b.depth);
      await Promise.all(
        changed.map(async (node, index) => {
          await this.clock.wait(index * LEVEL_STAGGER);
          this.setLevel(node, levels.get(node.id));
        }),
      );
    }

    setNodeState(node, state) {
      node.state = state;
      node.element.dataset.state = state;
      if (state === "done") this.setLevel(node, null);
      if (state !== "doing") this.setProgress(node, state === "done" ? 1 : 0);
      this.refreshStatus(node);
    }

    setProgress(node, progress) {
      node.progress = progress;
      node.bar.style.transform = `scaleX(${progress})`;
      if (node.state === "doing") this.refreshStatus(node);
    }

    refreshStatus(node) {
      const waitingOn = node.incoming.filter((edge) => !edge.filled).length;
      node.status.textContent = {
        hidden: "",
        todo: node.level > 1 ? `Waiting on ${waitingOn}` : "To do",
        doing: `Doing · ${Math.round(node.progress * 100)}%`,
        done: "Done",
      }[node.state];
    }

    setEdgeState(edge, state) {
      edge.group.dataset.state = state;
    }

    updateMeter() {
      const done = [...this.nodes.values()].filter((node) => node.state === "done").length;
      this.meterCount.textContent = done;
      this.meterFill.style.transform = `scaleX(${done / TASKS.length})`;
      this.root.classList.toggle("is-complete", done === TASKS.length);
    }

    async loop() {
      for (;;) {
        this.reset();
        await this.intro();
        await Promise.all(
          [...this.nodes.values()].filter((node) => node.level === 1).map((node) => this.runTask(node)),
        );
        await this.celebrate();
        await this.outro();
      }
    }

    reset() {
      this.title.textContent = "Shipping v1.0";
      for (const node of this.nodes.values()) {
        node.started = false;
        node.element.classList.remove("is-celebrating", "is-unblocked");
        this.setNodeState(node, "hidden");
        this.setLevel(node, null);
      }
      for (const edge of this.edges) {
        edge.filled = false;
        edge.base.style.strokeDashoffset = 1;
        edge.fill.style.strokeDashoffset = 1;
        this.setEdgeState(edge, "hidden");
      }
      this.updateMeter();
    }

    async intro() {
      this.root.classList.remove("is-leaving");
      const levels = this.computeLevels();
      await this.clock.wait(300);
      await Promise.all([
        ...[...this.nodes.values()].map(async (node) => {
          await this.clock.wait(node.depth * LAYER_STAGGER);
          this.setNodeState(node, "todo");
          this.setLevel(node, levels.get(node.id));
        }),
        ...this.edges.map(async (edge) => {
          await this.clock.wait(edge.from.depth * LAYER_STAGGER + 180);
          this.setEdgeState(edge, "idle");
          await this.clock.tween(
            520,
            (progress) => (edge.base.style.strokeDashoffset = 1 - progress),
            easeOut,
          );
        }),
      ]);
      await this.clock.wait(900);
    }

    async runTask(node) {
      node.started = true;
      await this.clock.wait(650);
      this.setNodeState(node, "doing");
      await this.clock.tween(node.duration, (progress) => this.setProgress(node, progress), easeInOut);
      this.setNodeState(node, "done");
      for (const edge of node.incoming) this.setEdgeState(edge, "done");
      this.updateMeter();
      await this.clock.wait(260);
      await Promise.all(node.outgoing.map((edge) => this.flow(edge)));
    }

    async flow(edge) {
      this.setEdgeState(edge, "active");
      edge.group.classList.add("is-flowing");
      await this.clock.tween(
        900,
        (progress) => {
          edge.fill.style.strokeDashoffset = 1 - progress;
          const point = edge.fill.getPointAtLength(progress * edge.fill.getTotalLength());
          edge.head.setAttribute("transform", `translate(${point.x} ${point.y})`);
        },
        easeInOut,
      );
      edge.group.classList.remove("is-flowing");
      edge.filled = true;
      const target = edge.to;
      this.refreshStatus(target);
      await this.refreshLevels();
      if (target.started || target.level !== 1) return;
      await this.runTask(target);
    }

    async celebrate() {
      const finale = [...this.nodes.values()].find((node) => !node.outgoing.length);
      finale.element.classList.add("is-celebrating");
      this.title.textContent = "v1.0 shipped";
      await this.clock.wait(3200);
    }

    async outro() {
      this.root.classList.add("is-leaving");
      await this.clock.wait(650);
    }

    showFinished() {
      this.title.textContent = "v1.0 shipped";
      for (const edge of this.edges) {
        edge.filled = true;
        edge.base.style.strokeDashoffset = 0;
        edge.fill.style.strokeDashoffset = 0;
        this.setEdgeState(edge, "done");
      }
      for (const node of this.nodes.values()) this.setNodeState(node, "done");
      this.updateMeter();
    }
  }

  for (const root of document.querySelectorAll("[data-task-graph]")) new TaskGraph(root);
})();
