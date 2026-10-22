(() => {
  const TEXT = CARD_TEXT.agent;
  const TASKS = ["flights", "hotel", "itinerary", "passport"].map((id) => ({ id, title: TEXT.tasks[id] }));
  const LINKS = [
    ["passport", "flights"],
    ["flights", "hotel"],
    ["flights", "itinerary"],
  ];
  const FINAL_ORDER = ["passport", "flights", "hotel", "itinerary"];

  const PROMPTS = { plan: TEXT.promptPlan, urgent: TEXT.promptUrgent };
  const REPLIES = { plan: TEXT.replyPlan, urgent: TEXT.replyUrgent };
  const WAITING_ON_PASSPORT = format(TEXT.waitingOn, { task: TEXT.tasks.passport });
  const WAITING_ON_FLIGHTS = format(TEXT.waitingOn, { task: TEXT.tasks.flights });
  const UPDATING_PASSPORT = format(TEXT.updating, { task: TEXT.tasks.passport });
  const UPDATED_PASSPORT = format(TEXT.updated, { task: TEXT.tasks.passport });
  const wordSegmenter = new Intl.Segmenter(document.documentElement.lang, { granularity: "word" });

  const ROW_STRIDE = 54;
  const ICON_Y = 16;
  const LINK_X = 26;

  const SPARKLE_ICON = `
    <svg class="aa-sparkle" viewBox="0 0 24 24">
      <path d="M10 3.5c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6Z" />
      <path d="M18 13.5c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3Z" />
    </svg>`;
  const SEND_ICON = `
    <svg class="aa-send" viewBox="0 0 24 24">
      <path d="M4 12 20 4l-4 16-4-6.5L4 12Z" />
    </svg>`;

  const LAYOUTS = [
    {
      name: "wide",
      minWidth: 600,
      width: 870,
      height: 340,
      chat: [0, 0, 410, 340],
      board: [470, 0, 400, 340],
      edge: "M410,170 H470",
    },
    {
      name: "narrow",
      minWidth: 0,
      width: 350,
      height: 636,
      chat: [0, 0, 350, 300],
      board: [0, 346, 350, 290],
      edge: "M175,300 V346",
    },
  ];

  class AiAgent {
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
      this.root.classList.add("tg", "aa");
      this.root.innerHTML = `
        <div class="tg-header">
          <div class="tg-heading">
            <span class="tg-eyebrow">${TEXT.eyebrow}</span>
            <span class="tg-title"></span>
          </div>
          <span class="aa-status"></span>
        </div>
        <div class="tg-viewport">
          <div class="tg-fit">
            <div class="tg-stage">
              <div class="aa-chat">
                <div class="aa-thread"></div>
                <div class="aa-composer">
                  <span class="aa-composer__text"></span>
                  ${SEND_ICON}
                </div>
              </div>
              <div class="aa-board">
                <div class="aa-board__head">
                  <span class="aa-board__title">${TEXT.boardTitle}</span>
                  <span class="aa-board__count"></span>
                </div>
                <div class="aa-list">
                  <span class="aa-list__empty">${TEXT.empty}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="tg-legend">
          <span class="tg-legend__item"><span class="aa-chip aa-chip--legend" data-state="done">${STATUS_ICON}</span>${TEXT.legendEdits}</span>
          <span class="tg-legend__item"><span class="aa-swatch"></span>${TEXT.legendLink}</span>
        </div>`;
      this.title = this.root.querySelector(".tg-title");
      this.status = this.root.querySelector(".aa-status");
      this.fit = this.root.querySelector(".tg-fit");
      this.stage = this.root.querySelector(".tg-stage");
      this.chat = this.root.querySelector(".aa-chat");
      this.thread = this.root.querySelector(".aa-thread");
      this.composer = this.root.querySelector(".aa-composer");
      this.composerText = this.root.querySelector(".aa-composer__text");
      this.board = this.root.querySelector(".aa-board");
      this.count = this.root.querySelector(".aa-board__count");
      this.list = this.root.querySelector(".aa-list");

      this.edgeLayer = svg("svg", { class: "tg-edges" });
      this.edge = svg("g", { class: "aa-edge" });
      this.edgePath = svg("path", { class: "aa-edge__line" });
      this.packet = svg("g", { class: "tg-edge__head" });
      this.packet.append(svg("circle", { r: 7, class: "tg-edge__halo" }), svg("circle", { r: 3 }));
      this.edge.append(this.edgePath, this.packet);
      this.edgeLayer.append(this.edge);
      this.stage.prepend(this.edgeLayer);

      this.linkLayer = svg("svg", { class: "aa-links" });
      this.list.append(this.linkLayer);
      this.tasks = new Map(TASKS.map((task) => [task.id, this.createTask(task)]));
      this.links = LINKS.map(([from, to]) => this.createLink(this.tasks.get(from), this.tasks.get(to)));
    }

    createTask(task) {
      const element = document.createElement("div");
      element.className = "aa-task";
      element.innerHTML = `
        ${STATUS_ICON}
        <span class="aa-task__text">
          <span class="aa-task__title">${task.title}</span>
          <span class="aa-task__meta">
            <span class="tg-level aa-task__level"></span>
            <span class="aa-task__note"></span>
          </span>
        </span>
        <span class="aa-task__due"></span>`;
      this.list.append(element);
      return {
        ...task,
        element,
        level: element.querySelector(".aa-task__level"),
        note: element.querySelector(".aa-task__note"),
        due: element.querySelector(".aa-task__due"),
        y: 0,
      };
    }

    createLink(from, to) {
      const group = svg("g", { class: "aa-link" });
      const path = svg("path", { class: "aa-link__line", pathLength: 1 });
      const fromPort = svg("circle", { r: 3, class: "aa-link__port" });
      const toPort = svg("circle", { r: 3, class: "aa-link__port aa-link__port--to" });
      group.append(path, fromPort, toPort);
      this.linkLayer.append(group);
      return { from, to, group, path, fromPort, toPort };
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
      place(this.chat, layout.chat);
      place(this.board, layout.board);
      this.edgePath.setAttribute("d", layout.edge);
      this.movePacket(0);
    }

    movePacket(progress) {
      const length = this.edgePath.getTotalLength();
      const point = this.edgePath.getPointAtLength(progress * length);
      this.packet.setAttribute("transform", `translate(${point.x} ${point.y})`);
    }

    setTitle(text) {
      this.title.textContent = text;
    }

    setStatus(state, text) {
      this.status.dataset.state = state;
      this.status.textContent = text;
    }

    updateCount() {
      const shown = [...this.tasks.values()].filter((task) => task.element.dataset.state === "todo").length;
      this.count.textContent = plural(TEXT.taskCount, shown);
      this.board.classList.toggle("is-empty", shown === 0);
    }

    addUser(text) {
      const element = document.createElement("div");
      element.className = "aa-msg aa-msg--user";
      element.textContent = text;
      this.thread.append(element);
      return element;
    }

    addAgent() {
      const element = document.createElement("div");
      element.className = "aa-msg aa-msg--agent";
      element.innerHTML = `<span class="aa-avatar">${SPARKLE_ICON}</span><div class="aa-msg__body"></div>`;
      this.thread.append(element);
      return element.querySelector(".aa-msg__body");
    }

    addTyping(body) {
      const element = document.createElement("span");
      element.className = "aa-typing";
      element.innerHTML = "<i></i><i></i><i></i>";
      body.append(element);
      return element;
    }

    addText(body, text) {
      const element = document.createElement("p");
      element.className = "aa-msg__text";
      element.textContent = text;
      body.append(element);
      return element;
    }

    addChip(body, label, state = "doing") {
      const element = document.createElement("span");
      element.className = "aa-chip";
      element.dataset.state = state;
      element.innerHTML = `${STATUS_ICON}<span class="aa-chip__label">${label}</span>`;
      body.append(element);
      return element;
    }

    resolveChip(chip, label) {
      chip.dataset.state = "done";
      chip.querySelector(".aa-chip__label").textContent = label;
    }

    showTask(task, index) {
      task.y = index * ROW_STRIDE;
      task.element.dataset.state = "todo";
      flash(task.element);
      this.layoutRows();
      this.updateCount();
    }

    setDependency(task, level, note) {
      task.level.textContent = `L${level}`;
      task.note.textContent = note;
      task.element.classList.add("is-linked");
    }

    setDue(task, text) {
      task.due.textContent = text;
      task.element.classList.add("has-due");
      flash(task.element);
    }

    layoutRows() {
      for (const task of this.tasks.values()) {
        task.element.style.transform = `translateY(${task.y}px)`;
      }
      for (const link of this.links) {
        const fromY = link.from.y + ICON_Y;
        const toY = link.to.y + ICON_Y;
        const bulge = 8 + Math.abs(toY - fromY) * 0.1;
        const x = LINK_X - bulge;
        link.path.setAttribute(
          "d",
          `M${LINK_X},${fromY} C${x},${fromY} ${x},${toY} ${LINK_X},${toY}`,
        );
        setPoint(link.fromPort, [LINK_X, fromY]);
        setPoint(link.toPort, [LINK_X, toY]);
      }
    }

    async drawLink(link) {
      link.group.dataset.state = "drawing";
      await this.clock.tween(
        520,
        (progress) => (link.path.style.strokeDashoffset = 1 - progress),
        easeOut,
      );
      link.group.dataset.state = "linked";
    }

    async reorder(order) {
      const moves = order.map((id, index) => {
        const task = this.tasks.get(id);
        return { task, from: task.y, to: index * ROW_STRIDE };
      });
      await this.clock.tween(
        750,
        (progress) => {
          for (const { task, from, to } of moves) task.y = from + (to - from) * progress;
          this.layoutRows();
        },
        easeInOut,
      );
    }

    async flowPacket() {
      this.edge.classList.add("is-flowing");
      await this.clock.tween(650, (progress) => this.movePacket(progress), easeInOut);
      this.edge.classList.remove("is-flowing");
    }

    async typeInComposer(text) {
      this.composer.classList.add("is-typing");
      await this.clock.tween(text.length * 38, (progress) => {
        this.composerText.textContent = text.slice(0, Math.round(progress * text.length));
      });
      await this.clock.wait(300);
      this.composerText.textContent = "";
      this.composer.classList.remove("is-typing");
      this.addUser(text);
    }

    async think(body) {
      const typing = this.addTyping(body);
      await this.clock.wait(1000);
      typing.remove();
    }

    async stream(body, text) {
      const element = this.addText(body, "");
      const words = [...wordSegmenter.segment(text)].filter((part) => part.isWordLike).map((part) => part.index);
      await this.clock.tween(words.length * 70, (progress) => {
        const shown = Math.ceil(progress * words.length);
        element.textContent = shown < words.length ? text.slice(0, words[shown]).trimEnd() : text;
      });
    }

    reset() {
      this.root.classList.remove("is-leaving", "is-complete");
      this.thread.replaceChildren();
      this.composerText.textContent = "";
      this.setTitle(TEXT.askPlain);
      this.setStatus("idle", TEXT.ready);
      for (const task of this.tasks.values()) {
        task.y = 0;
        task.element.dataset.state = "hidden";
        task.element.classList.remove("is-linked", "has-due", "is-changed");
        task.level.textContent = "";
        task.note.textContent = "";
        task.due.textContent = "";
      }
      for (const link of this.links) {
        link.group.dataset.state = "hidden";
        link.path.style.strokeDashoffset = 1;
      }
      this.layoutRows();
      this.updateCount();
    }

    async loop() {
      const { flights, hotel, itinerary, passport } = Object.fromEntries(this.tasks);
      for (;;) {
        this.reset();
        await this.clock.wait(900);

        await this.typeInComposer(PROMPTS.plan);
        this.setTitle(TEXT.draftsPlan);
        this.setStatus("working", TEXT.working);
        let body = this.addAgent();
        await this.think(body);

        const createChip = this.addChip(body, TEXT.creating);
        await this.flowPacket();
        for (const [index, task] of TASKS.entries()) {
          this.showTask(this.tasks.get(task.id), index);
          await this.clock.wait(200);
        }
        this.resolveChip(createChip, TEXT.created);
        await this.clock.wait(500);

        const linkChip = this.addChip(body, TEXT.linking);
        this.setTitle(TEXT.linkedPlan);
        await this.flowPacket();
        this.setDependency(flights, 2, WAITING_ON_PASSPORT);
        await this.drawLink(this.links[0]);
        this.setDependency(hotel, 3, WAITING_ON_FLIGHTS);
        await this.drawLink(this.links[1]);
        this.setDependency(itinerary, 3, WAITING_ON_FLIGHTS);
        await this.drawLink(this.links[2]);
        this.resolveChip(linkChip, TEXT.linked);
        await this.stream(body, REPLIES.plan);
        this.setStatus("idle", TEXT.ready);
        await this.clock.wait(1600);

        this.setTitle(TEXT.editsReal);
        await this.typeInComposer(PROMPTS.urgent);
        this.setStatus("working", TEXT.working);
        body = this.addAgent();
        await this.think(body);
        const updateChip = this.addChip(body, UPDATING_PASSPORT);
        await this.flowPacket();
        await this.reorder(FINAL_ORDER);
        this.setDue(passport, TEXT.dueFriday);
        this.resolveChip(updateChip, UPDATED_PASSPORT);
        await this.stream(body, REPLIES.urgent);

        this.setStatus("done", TEXT.summary);
        this.root.classList.add("is-complete");
        await this.clock.wait(3400);
        this.root.classList.add("is-leaving");
        await this.clock.wait(650);
      }
    }

    showFinished() {
      this.reset();
      const { flights, hotel, itinerary, passport } = Object.fromEntries(this.tasks);
      this.addUser(PROMPTS.plan);
      let body = this.addAgent();
      this.addChip(body, TEXT.created, "done");
      this.addChip(body, TEXT.linked, "done");
      this.addText(body, REPLIES.plan);
      this.addUser(PROMPTS.urgent);
      body = this.addAgent();
      this.addChip(body, UPDATED_PASSPORT, "done");
      this.addText(body, REPLIES.urgent);
      for (const [index, id] of FINAL_ORDER.entries()) this.showTask(this.tasks.get(id), index);
      this.setDependency(flights, 2, WAITING_ON_PASSPORT);
      this.setDependency(hotel, 3, WAITING_ON_FLIGHTS);
      this.setDependency(itinerary, 3, WAITING_ON_FLIGHTS);
      this.setDue(passport, TEXT.dueFriday);
      for (const link of this.links) {
        link.group.dataset.state = "linked";
        link.path.style.strokeDashoffset = 0;
      }
      this.layoutRows();
      this.setTitle(TEXT.editsReal);
      this.setStatus("done", TEXT.summary);
      this.root.classList.add("is-complete");
    }
  }

  const place = (element, [x, y, w, h]) => {
    Object.assign(element.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  };

  const setPoint = (circle, [x, y]) => {
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
  };

  const flash = (element) => {
    element.classList.remove("is-changed");
    void element.offsetWidth;
    element.classList.add("is-changed");
  };

  for (const root of document.querySelectorAll("[data-ai-agent]")) new AiAgent(root);
})();
