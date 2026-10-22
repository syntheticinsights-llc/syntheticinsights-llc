(() => {
  const TASKS = ["Draft proposal", "Book flights", "Renew passport"];
  const PROVIDERS = ["Google Drive", "WebDAV"];

  const LAPTOP_ICON = `
    <svg class="ls-glyph" viewBox="0 0 24 24">
      <rect x="4" y="5" width="16" height="11" rx="1.6" />
      <path d="M2 19h20" />
    </svg>`;
  const PHONE_ICON = `
    <svg class="ls-glyph" viewBox="0 0 24 24">
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M11 18.5h2" />
    </svg>`;
  const CLOUD_ICON = `
    <svg class="ls-glyph" viewBox="0 0 24 24">
      <path d="M7 18.5h10.5a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.5 9.6 4.5 4.5 0 0 0 7 18.5Z" />
    </svg>`;

  const DEVICES = [
    { id: "mac", name: "MacBook", icon: LAPTOP_ICON },
    { id: "iphone", name: "iPhone", icon: PHONE_ICON },
    { id: "android", name: "Android", icon: PHONE_ICON },
  ];

  const LAYOUTS = [
    {
      name: "wide",
      minWidth: 600,
      width: 870,
      height: 380,
      hub: [305, 0, 260, 72],
      devices: {
        mac: [0, 184, 250, 196],
        iphone: [310, 184, 250, 196],
        android: [620, 184, 250, 196],
      },
      edge(hub, [x, y, w]) {
        const [hx, hy, hw, hh] = hub;
        const start = [hx + hw / 2, hy + hh];
        const end = [x + w / 2, y];
        const mid = (start[1] + end[1]) / 2;
        return { start, end, d: `M${start} C${start[0]},${mid} ${end[0]},${mid} ${end}` };
      },
    },
    {
      name: "narrow",
      minWidth: 0,
      width: 350,
      height: 590,
      hub: [0, 0, 350, 64],
      devices: {
        mac: [52, 100, 298, 150],
        iphone: [52, 270, 298, 150],
        android: [52, 440, 298, 150],
      },
      edge(hub, [x, y, , h]) {
        const start = [22, hub[1] + hub[3]];
        const cy = y + h / 2;
        const end = [x, cy];
        return { start, end, d: `M${start} V${cy - 14} Q22,${cy} 36,${cy} H${x}` };
      },
    },
  ];

  class LocalSync {
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
      this.root.classList.add("tg", "ls");
      this.root.innerHTML = `
        <div class="tg-header">
          <div class="tg-heading">
            <span class="tg-eyebrow">Local-first sync</span>
            <span class="tg-title"></span>
          </div>
          <span class="ls-pending"></span>
        </div>
        <div class="tg-viewport">
          <div class="tg-fit">
            <div class="tg-stage">
              <div class="ls-hub">
                <span class="ls-hub__icon">${CLOUD_ICON}</span>
                <span class="ls-hub__text">
                  <span class="ls-hub__title">Your <b class="ls-hub__provider"></b></span>
                  <span class="ls-hub__caption"></span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="tg-legend">
          <span class="tg-legend__item"><span class="ls-swatch ls-swatch--data"></span>Task data goes only to your storage</span>
          <span class="tg-legend__item"><span class="ls-swatch ls-swatch--signal"></span>Our server only relays a change signal</span>
        </div>`;
      this.title = this.root.querySelector(".tg-title");
      this.pending = this.root.querySelector(".ls-pending");
      this.fit = this.root.querySelector(".tg-fit");
      this.stage = this.root.querySelector(".tg-stage");
      this.hub = this.root.querySelector(".ls-hub");
      this.provider = this.root.querySelector(".ls-hub__provider");
      this.hubCaption = this.root.querySelector(".ls-hub__caption");
      this.edgeLayer = svg("svg", { class: "tg-edges" });
      this.stage.prepend(this.edgeLayer);
      this.devices = new Map(DEVICES.map((device) => [device.id, this.createDevice(device)]));
    }

    createDevice(device) {
      const element = document.createElement("div");
      element.className = "ls-device";
      element.innerHTML = `
        <div class="ls-device__head">
          <span class="ls-device__name">${device.icon}${device.name}</span>
          <span class="ls-net"><span class="ls-net__dot"></span><span class="ls-net__label"></span></span>
        </div>
        <ul class="ls-tasks">
          ${TASKS.map((title) => `<li class="ls-task">${STATUS_ICON}<span class="ls-task__title">${title}</span></li>`).join("")}
        </ul>
        <span class="ls-device__foot"></span>`;
      this.stage.append(element);

      const group = svg("g", { class: "ls-edge" });
      const path = svg("path", { class: "ls-edge__line" });
      const hubPort = svg("circle", { r: 3.5, class: "tg-port" });
      const devicePort = svg("circle", { r: 3.5, class: "tg-port" });
      const packet = svg("g", { class: "tg-edge__head" });
      packet.append(svg("circle", { r: 7, class: "tg-edge__halo" }), svg("circle", { r: 3 }));
      group.append(path, hubPort, devicePort, packet);
      this.edgeLayer.append(group);

      return {
        ...device,
        element,
        rows: [...element.querySelectorAll(".ls-task")],
        netLabel: element.querySelector(".ls-net__label"),
        foot: element.querySelector(".ls-device__foot"),
        edge: { group, path, hubPort, devicePort, packet },
        done: new Set(),
      };
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
      place(this.hub, layout.hub);
      for (const device of this.devices.values()) {
        const rect = layout.devices[device.id];
        place(device.element, rect);
        const { start, end, d } = layout.edge(layout.hub, rect);
        const { path, hubPort, devicePort, packet } = device.edge;
        path.setAttribute("d", d);
        setPoint(hubPort, start);
        setPoint(devicePort, end);
        packet.setAttribute("transform", `translate(${start[0]} ${start[1]})`);
      }
    }

    setTitle(text) {
      this.title.textContent = text;
    }

    setNet(device, net, label) {
      device.element.dataset.net = net;
      device.edge.group.dataset.net = net;
      device.netLabel.textContent = label;
    }

    setFoot(device, text) {
      device.foot.textContent = text;
    }

    setHub(caption, receiving = false) {
      this.hubCaption.textContent = caption;
      this.hub.classList.toggle("is-receiving", receiving);
    }

    complete(device, index) {
      device.done.add(index);
      const row = device.rows[index];
      row.dataset.state = "done";
      flash(row);
      this.updatePending();
    }

    updatePending() {
      const sets = [...this.devices.values()].map((device) => device.done);
      const everywhere = TASKS.filter((_, index) => sets.every((set) => set.has(index))).length;
      const anywhere = TASKS.filter((_, index) => sets.some((set) => set.has(index))).length;
      const count = anywhere - everywhere;
      this.pending.dataset.state = count ? "pending" : "synced";
      this.pending.textContent = count
        ? `${count} change${count > 1 ? "s" : ""} pending`
        : "All devices in sync";
    }

    async packet(device, direction) {
      const { group, path, packet } = device.edge;
      group.classList.add("is-flowing");
      const length = path.getTotalLength();
      await this.clock.tween(
        1000,
        (progress) => {
          const along = direction === "down" ? progress : 1 - progress;
          const point = path.getPointAtLength(along * length);
          packet.setAttribute("transform", `translate(${point.x} ${point.y})`);
        },
        easeInOut,
      );
      group.classList.remove("is-flowing");
    }

    async upload(device) {
      this.setNet(device, "syncing", "Uploading");
      await this.packet(device, "up");
      this.setHub(`Received from ${device.name}`, true);
      this.setNet(device, "online", "Online");
      this.setFoot(device, "Up to date");
      await this.clock.wait(500);
    }

    async download(device, indexes) {
      this.setNet(device, "syncing", "Change detected");
      await this.clock.wait(550);
      device.netLabel.textContent = "Syncing";
      await this.packet(device, "down");
      for (const index of indexes) this.complete(device, index);
      this.setNet(device, "online", "Online");
      this.setFoot(device, "Up to date");
    }

    reset(provider) {
      this.provider.textContent = provider;
      this.setHub("Holds every task");
      this.root.classList.remove("is-leaving", "is-complete");
      this.setTitle("Same tasks on every device");
      for (const device of this.devices.values()) {
        device.done.clear();
        for (const row of device.rows) {
          row.dataset.state = "todo";
          row.classList.remove("is-changed");
        }
        this.setNet(device, "online", "Online");
        this.setFoot(device, "Up to date");
      }
      this.updatePending();
    }

    async loop() {
      const [mac, iphone, android] = this.devices.values();
      for (let round = 0; ; round++) {
        this.reset(PROVIDERS[round % PROVIDERS.length]);
        await this.clock.wait(1600);

        this.setTitle("iPhone goes offline");
        this.setNet(iphone, "offline", "Offline");
        await this.clock.wait(1000);
        this.complete(iphone, 1);
        this.setFoot(iphone, "Saved on device · 0 ms");
        this.setTitle("Still works offline");
        await this.clock.wait(1400);
        this.setFoot(iphone, "1 change waiting");

        this.setTitle("MacBook edits at the same time");
        this.complete(mac, 0);
        this.setFoot(mac, "Saved on device · 0 ms");
        await this.clock.wait(900);
        await this.upload(mac);
        this.setHub("Holds every task");
        await this.download(android, [0]);
        await this.clock.wait(1200);

        this.setTitle("iPhone reconnects");
        this.setNet(iphone, "online", "Online");
        await this.clock.wait(600);
        await this.upload(iphone);
        this.setHub("Holds every task");
        await Promise.all([
          this.download(mac, [1]),
          this.download(android, [1]),
          this.download(iphone, [0]),
        ]);

        this.setTitle("Merged, no conflicts");
        this.root.classList.add("is-complete");
        await this.clock.wait(3400);
        this.root.classList.add("is-leaving");
        await this.clock.wait(650);
      }
    }

    showFinished() {
      this.reset(PROVIDERS[0]);
      for (const device of this.devices.values()) {
        for (const index of [0, 1]) {
          device.done.add(index);
          device.rows[index].dataset.state = "done";
        }
      }
      this.updatePending();
      this.setTitle("Merged, no conflicts");
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

  for (const root of document.querySelectorAll("[data-local-sync]")) new LocalSync(root);
})();
