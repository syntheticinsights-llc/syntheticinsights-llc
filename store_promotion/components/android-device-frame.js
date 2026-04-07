const androidTemplate = document.createElement('template');

androidTemplate.innerHTML = `
  <style>
    :host {
      --device-width: 612px;
      --device-border: rgba(182, 190, 205, 0.92);
      --device-shell-base: linear-gradient(180deg, #f5f7fb 0%, #dfe5ef 100%);
      --device-shadow: rgba(14, 19, 30, 0.16);
      --screen-inset-x: 3.4%;
      --screen-inset-y: 1.5%;
      --screen-background: #ffffff;
      display: block;
      width: var(--device-width);
      aspect-ratio: 1 / 2;
    }

    .device {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .shell {
      position: absolute;
      inset: 0;
      border-radius: 72px;
      border: 1px solid var(--device-border);
      background: var(--device-shell-base);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.72),
        0 14px 24px var(--device-shadow);
    }

    .screen-slot {
      position: absolute;
      left: var(--screen-inset-x);
      right: var(--screen-inset-x);
      top: var(--screen-inset-y);
      bottom: var(--screen-inset-y);
      overflow: hidden;
      border-radius: 58px;
      background: var(--screen-background);
      border: 1px solid rgba(198, 206, 219, 0.92);
    }

    .camera {
      position: absolute;
      top: 28px;
      left: 50%;
      z-index: 2;
      width: 92px;
      height: 18px;
      border-radius: 999px;
      background: rgba(18, 21, 28, 0.88);
      transform: translateX(-50%);
      box-shadow: 0 0 0 2px rgba(39, 44, 54, 0.08);
    }

    .screen-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: none;
    }
  </style>

  <div class="device">
    <div class="shell" part="shell"></div>
    <div class="screen-slot" part="screen">
      <div class="camera" part="camera"></div>
      <img class="screen-image" part="screen-image" alt="">
    </div>
  </div>
`;

class AndroidDeviceFrame extends HTMLElement {
  static get observedAttributes() {
    return ['image-src', 'screen-background'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(androidTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const screen = this.shadowRoot.querySelector('[part="screen"]');
    const screenImage = this.shadowRoot.querySelector('[part="screen-image"]');
    const imageSrc = this.getAttribute('image-src');
    const screenBackground = this.getAttribute('screen-background') ?? '#ffffff';

    screen.style.background = screenBackground;

    if (imageSrc) {
      screenImage.src = imageSrc;
      screenImage.style.display = 'block';
      return;
    }

    screenImage.removeAttribute('src');
    screenImage.style.display = 'none';
  }
}

if (!customElements.get('android-device-frame')) {
  customElements.define('android-device-frame', AndroidDeviceFrame);
}
