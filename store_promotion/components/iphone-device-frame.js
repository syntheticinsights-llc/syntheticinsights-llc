const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      --device-width: 612px;
      --device-border: rgba(214, 203, 232, 0.96);
      --device-shadow: rgba(58, 34, 104, 0.1);
      --device-shell-base: #f7f2fa;
      --screen-inset-x: 4.2%;
      --screen-inset-y: 1.95%;
      --screen-background: #ffffff;
      display: block;
      width: var(--device-width);
      aspect-ratio: 430 / 926;
    }

    .device {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .shell {
      position: absolute;
      inset: 0;
      border-radius: 80px;
      border: 1px solid var(--device-border);
      background: var(--device-shell-base);
      box-shadow:
        0 14px 24px var(--device-shadow);
    }

    .screen-slot {
      position: absolute;
      left: var(--screen-inset-x);
      right: var(--screen-inset-x);
      top: var(--screen-inset-y);
      bottom: var(--screen-inset-y);
      overflow: hidden;
      border-radius: 64px;
      background: var(--screen-background);
      border: 1px solid rgba(226, 218, 239, 0.95);
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
      <img class="screen-image" part="screen-image" alt="">
    </div>
  </div>
`;

class IPhoneDeviceFrame extends HTMLElement {
  static get observedAttributes() {
    return ['image-src', 'screen-background'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
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

if (!customElements.get('iphone-device-frame')) {
  customElements.define('iphone-device-frame', IPhoneDeviceFrame);
}
