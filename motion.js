const SVG_NS = "http://www.w3.org/2000/svg";

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;

class Clock {
  constructor() {
    this.tweens = new Set();
    this.handle = 0;
    this.last = 0;
    this.frame = this.frame.bind(this);
  }

  setRunning(running) {
    if (running === Boolean(this.handle)) return;
    if (running) {
      this.last = performance.now();
      this.handle = requestAnimationFrame(this.frame);
    } else {
      cancelAnimationFrame(this.handle);
      this.handle = 0;
    }
  }

  frame(now) {
    const dt = Math.min(now - this.last, 64);
    this.last = now;
    for (const step of [...this.tweens]) step(dt);
    this.handle = requestAnimationFrame(this.frame);
  }

  tween(duration, update = () => {}, easing = (t) => t) {
    return new Promise((resolve) => {
      let elapsed = 0;
      const step = (dt) => {
        elapsed = Math.min(elapsed + dt, duration);
        update(easing(elapsed / duration));
        if (elapsed < duration) return;
        this.tweens.delete(step);
        resolve();
      };
      this.tweens.add(step);
    });
  }

  wait(ms) {
    return this.tween(ms);
  }
}

const svg = (tag, attributes = {}) => {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
};

const STATUS_ICON = `
  <svg class="tg-icon" viewBox="0 0 24 24">
    <circle class="tg-icon__ring" cx="12" cy="12" r="10" />
    <circle class="tg-icon__dot" cx="12" cy="12" r="4.3" />
    <path class="tg-icon__check" d="M7.8 12.3l2.9 2.9 5.5-5.8" pathLength="1" />
  </svg>`;
