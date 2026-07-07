// ============================================================
//  ball-textures.js — Procedural canvas textures for ball types
// ============================================================

import * as THREE from 'three';

function makeCanvas(w = 512, h = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

function canvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function drawFootball(ctx, w, h) {
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, w, h);

  const patches = [
    { x: 0.25, y: 0.5, r: 0.09 },
    { x: 0.50, y: 0.28, r: 0.08 },
    { x: 0.75, y: 0.5, r: 0.09 },
    { x: 0.50, y: 0.72, r: 0.08 },
    { x: 0.12, y: 0.28, r: 0.07 },
    { x: 0.88, y: 0.28, r: 0.07 },
    { x: 0.12, y: 0.72, r: 0.07 },
    { x: 0.88, y: 0.72, r: 0.07 },
  ];

  ctx.fillStyle = '#111111';
  for (const p of patches) {
    drawPentagon(ctx, p.x * w, p.y * h, p.r * h);
  }

  // Seam lines between panels
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (i + 0.5) * (h / 6));
    ctx.bezierCurveTo(w * 0.33, (i + 0.3) * (h / 6), w * 0.66, (i + 0.7) * (h / 6), w, (i + 0.5) * (h / 6));
    ctx.stroke();
  }
}

function drawPentagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBasketball(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#ff8f00');
  grad.addColorStop(0.5, '#ff6d00');
  grad.addColorStop(1, '#e65100');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = Math.max(3, w * 0.012);
  ctx.lineCap = 'round';

  // Horizontal seam
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.stroke();

  // Vertical curved seams
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.bezierCurveTo(
      w * (0.5 + side * 0.35), h * 0.25,
      w * (0.5 + side * 0.35), h * 0.75,
      w * 0.5, h,
    );
    ctx.stroke();
  }
}

function drawTennis(ctx, w, h) {
  const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 0, w * 0.5, h * 0.5, w * 0.55);
  grad.addColorStop(0, '#e6f57a');
  grad.addColorStop(0.6, '#c6e800');
  grad.addColorStop(1, '#9ccc00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Fuzzy noise
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    img.data[i]     = Math.min(255, Math.max(0, img.data[i] + n));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  // Curved white seam
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(4, w * 0.014);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.42);
  ctx.bezierCurveTo(w * 0.25, h * 0.15, w * 0.75, h * 0.85, w, h * 0.58);
  ctx.stroke();
}

function drawBowling(ctx, w, h) {
  const grad = ctx.createRadialGradient(w * 0.35, h * 0.3, 0, w * 0.5, h * 0.5, w * 0.6);
  grad.addColorStop(0, '#5e35b1');
  grad.addColorStop(0.45, '#311b92');
  grad.addColorStop(1, '#0d0d1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Specular highlight
  const shine = ctx.createRadialGradient(w * 0.28, h * 0.22, 0, w * 0.28, h * 0.22, w * 0.18);
  shine.addColorStop(0, 'rgba(255,255,255,0.35)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, w, h);

  // Finger holes
  const holes = [
    { x: 0.38, y: 0.38, r: 0.045 },
    { x: 0.50, y: 0.30, r: 0.040 },
    { x: 0.62, y: 0.38, r: 0.045 },
  ];
  for (const hole of holes) {
    const cx = hole.x * w;
    const cy = hole.y * h;
    const r = hole.r * h;
    const holeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    holeGrad.addColorStop(0, '#000000');
    holeGrad.addColorStop(0.7, '#1a1a2e');
    holeGrad.addColorStop(1, 'rgba(49,27,146,0.3)');
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createBallTexture(type) {
  const { canvas, ctx } = makeCanvas();

  switch (type) {
    case 'football':  drawFootball(ctx, canvas.width, canvas.height); break;
    case 'basketball': drawBasketball(ctx, canvas.width, canvas.height); break;
    case 'tennis':    drawTennis(ctx, canvas.width, canvas.height); break;
    case 'bowling':   drawBowling(ctx, canvas.width, canvas.height); break;
    default:          return null;
  }

  return canvasTexture(canvas);
}
