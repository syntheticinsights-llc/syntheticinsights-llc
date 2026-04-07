function roundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function fillRoundedRect(context, x, y, width, height, radius, fillStyle) {
  context.save();
  context.fillStyle = fillStyle;
  roundedRectPath(context, x, y, width, height, radius);
  context.fill();
  context.restore();
}

function drawRadialGlow(context, x, y, radius, color) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawArtboardBackground(context, slide) {
  const background = context.createLinearGradient(0, 0, 0, iosSpec.height);
  background.addColorStop(0, slide.primary);
  background.addColorStop(0.54, slide.secondary);
  background.addColorStop(1, slide.accent);
  context.fillStyle = background;
  context.fillRect(0, 0, iosSpec.width, iosSpec.height);

  drawRadialGlow(context, iosSpec.width * 0.14, iosSpec.height * 0.1, 360, 'rgba(255,255,255,0.78)');
  drawRadialGlow(context, iosSpec.width * 0.78, iosSpec.height * 0.18, 420, slide.highlight);
  drawRadialGlow(context, iosSpec.width * 0.26, iosSpec.height * 0.74, 420, slide.bloom);
  drawRadialGlow(context, iosSpec.width * 0.88, iosSpec.height * 0.78, 340, 'rgba(255,255,255,0.34)');

  const veil = context.createLinearGradient(0, 0, iosSpec.width, iosSpec.height);
  veil.addColorStop(0, 'rgba(255,255,255,0.68)');
  veil.addColorStop(0.34, 'rgba(255,255,255,0.12)');
  veil.addColorStop(0.58, 'rgba(255,255,255,0)');
  context.fillStyle = veil;
  context.fillRect(0, 0, iosSpec.width, iosSpec.height);
}

function drawMultilineText(context, {
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  align = 'center',
  color = '#20181b',
  font,
}) {
  context.save();
  context.font = font;
  context.fillStyle = color;
  context.textAlign = align;
  context.textBaseline = 'top';

  const chars = [...text];
  const lines = [];
  let currentLine = '';

  for (const char of chars) {
    const nextLine = currentLine + char;

    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  context.restore();
  return lines.length;
}

function drawDeviceFrame(context, {
  x,
  y,
  width,
  background = '#ffffff',
  image = null,
}) {
  const height = width * deviceAspectRatio;
  const shellRadius = width * (80 / 612);
  const screenInsetX = width * 0.042;
  const screenInsetY = height * 0.0195;
  const screenX = x + screenInsetX;
  const screenY = y + screenInsetY;
  const screenWidth = width - screenInsetX * 2;
  const screenHeight = height - screenInsetY * 2;
  const screenRadius = width * (64 / 612);

  context.save();
  context.shadowColor = 'rgba(13, 8, 4, 0.18)';
  context.shadowBlur = 48;
  context.shadowOffsetY = 28;
  fillRoundedRect(context, x, y, width, height, shellRadius, deviceShellColor);
  context.restore();

  context.save();
  context.lineWidth = 1.5;
  context.strokeStyle = deviceBorderColor;
  roundedRectPath(context, x, y, width, height, shellRadius);
  context.stroke();
  context.restore();

  fillRoundedRect(context, screenX, screenY, screenWidth, screenHeight, screenRadius, background);

  if (image) {
    context.save();
    roundedRectPath(context, screenX, screenY, screenWidth, screenHeight, screenRadius);
    context.clip();

    const scale = Math.max(screenWidth / image.width, screenHeight / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = screenX + (screenWidth - drawWidth) / 2;
    const drawY = screenY + (screenHeight - drawHeight) / 2;

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    context.restore();
  }

  context.save();
  context.lineWidth = 1.5;
  context.strokeStyle = screenBorderColor;
  roundedRectPath(context, screenX, screenY, screenWidth, screenHeight, screenRadius);
  context.stroke();
  context.restore();
}
