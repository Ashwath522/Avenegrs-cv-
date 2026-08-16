// Suit Renderer — draws per-character suit pieces anchored to pose landmarks
// All drawn on Canvas 2D, styled as holographic/geometric overlays

import { POSE_LANDMARKS } from '../../constants/characters.js';

// Helper: lerp a point toward target
function lerp(a, b, t) { return a + (b - a) * t; }

// Convert normalized landmark to canvas pixel coords
function toCanvas(lm, w, h) {
  // Note: video is mirrored (scaleX(-1)), landmarks are NOT mirrored by mediapipe
  // We mirror by flipping x: canvas x = (1 - lm.x) * w
  return { x: (1 - lm.x) * w, y: lm.y * h };
}

// --- Iron Man suit drawing ---
function drawIronManSuit(ctx, pose, suitState, w, h, time) {
  if (!pose?.landmarks?.[0]) return;
  const lm = pose.landmarks[0];

  const alpha = suitState.globalAlpha ?? 1;
  ctx.globalAlpha = alpha;

  const ls = toCanvas(lm[POSE_LANDMARKS.LEFT_SHOULDER], w, h);
  const rs = toCanvas(lm[POSE_LANDMARKS.RIGHT_SHOULDER], w, h);
  const lh = toCanvas(lm[POSE_LANDMARKS.LEFT_HIP], w, h);
  const rh = toCanvas(lm[POSE_LANDMARKS.RIGHT_HIP], w, h);
  const le = toCanvas(lm[POSE_LANDMARKS.LEFT_ELBOW], w, h);
  const re = toCanvas(lm[POSE_LANDMARKS.RIGHT_ELBOW], w, h);
  const lw = toCanvas(lm[POSE_LANDMARKS.LEFT_WRIST], w, h);
  const rw = toCanvas(lm[POSE_LANDMARKS.RIGHT_WRIST], w, h);
  const nose = toCanvas(lm[POSE_LANDMARKS.NOSE], w, h);

  const shoulderW = Math.abs(rs.x - ls.x);
  const torsoH = Math.abs(lh.y - ls.y);

  // --- Torso plate ---
  if (suitState.pieces.torso) {
    const cx = (ls.x + rs.x) / 2;
    const cy = (ls.y + rh.y) / 2;
    const pa = suitState.pieces.torso;

    // Iron Man chest plate
    ctx.save();
    ctx.globalAlpha = alpha * pa;
    const grad = ctx.createLinearGradient(cx - shoulderW * 0.5, cy - torsoH * 0.4, cx, cy + torsoH * 0.5);
    grad.addColorStop(0, 'rgba(180, 30, 20, 0.85)');
    grad.addColorStop(0.5, 'rgba(220, 50, 30, 0.9)');
    grad.addColorStop(1, 'rgba(160, 20, 10, 0.85)');

    ctx.beginPath();
    // Chest plate shape
    ctx.moveTo(ls.x + shoulderW * 0.08, ls.y + torsoH * 0.05);
    ctx.lineTo(rs.x - shoulderW * 0.08, rs.y + torsoH * 0.05);
    ctx.lineTo(rh.x - shoulderW * 0.1, rh.y - torsoH * 0.05);
    ctx.lineTo(lh.x + shoulderW * 0.1, lh.y - torsoH * 0.05);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gold trim lines
    ctx.beginPath();
    ctx.moveTo(ls.x + shoulderW * 0.08, ls.y + torsoH * 0.2);
    ctx.lineTo(rs.x - shoulderW * 0.08, rs.y + torsoH * 0.2);
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Arc reactor glow
    const pulse = 0.7 + 0.3 * Math.sin(time * 0.003);
    const reactorX = cx;
    const reactorY = cy - torsoH * 0.15;
    const reactorR = shoulderW * 0.06;

    ctx.beginPath();
    ctx.arc(reactorX, reactorY, reactorR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 200, 255, ${0.9 * pulse})`;
    ctx.fill();

    const grd = ctx.createRadialGradient(reactorX, reactorY, 0, reactorX, reactorY, reactorR * 3);
    grd.addColorStop(0, `rgba(100, 200, 255, ${0.4 * pulse})`);
    grd.addColorStop(1, 'rgba(100, 200, 255, 0)');
    ctx.beginPath();
    ctx.arc(reactorX, reactorY, reactorR * 3, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.restore();
  }

  // --- Shoulder pads ---
  if (suitState.pieces.torso) {
    [ls, rs].forEach((s, i) => {
      ctx.save();
      ctx.globalAlpha = alpha * suitState.pieces.torso * 0.9;
      const padW = shoulderW * 0.2;
      const padH = torsoH * 0.1;
      ctx.beginPath();
      ctx.ellipse(s.x + (i === 0 ? -padW * 0.4 : padW * 0.4), s.y, padW * 0.6, padH * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(192, 57, 43, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(243, 156, 18, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });
  }

  // --- Forearms ---
  if (suitState.pieces.rightForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightForearm;
    drawForearmPanel(ctx, re, rw, shoulderW * 0.14, '#c0392b', 'rgba(243,156,18,0.6)');
    ctx.restore();
  }
  if (suitState.pieces.leftForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftForearm;
    drawForearmPanel(ctx, le, lw, shoulderW * 0.14, '#c0392b', 'rgba(243,156,18,0.6)');
    ctx.restore();
  }

  // --- Gauntlets ---
  if (suitState.pieces.rightHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightHand;
    drawGauntlet(ctx, rw, shoulderW * 0.09, 'rgba(192,57,43,0.9)', 'rgba(243,156,18,0.7)', time);
    ctx.restore();
  }
  if (suitState.pieces.leftHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftHand;
    drawGauntlet(ctx, lw, shoulderW * 0.09, 'rgba(192,57,43,0.9)', 'rgba(243,156,18,0.7)', time);
    ctx.restore();
  }

  // --- Helmet ---
  if (suitState.pieces.head) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.head;
    const helmR = shoulderW * 0.22;
    // Helmet outline
    ctx.beginPath();
    ctx.ellipse(nose.x, nose.y - helmR * 0.2, helmR * 0.75, helmR, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180, 30, 20, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Eye slots
    [{ x: nose.x - helmR * 0.3, y: nose.y - helmR * 0.15 }, { x: nose.x + helmR * 0.3, y: nose.y - helmR * 0.15 }].forEach(eye => {
      const eyeGlow = 0.7 + 0.3 * Math.sin(time * 0.004);
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, helmR * 0.22, helmR * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(243, 156, 18, ${eyeGlow})`;
      ctx.fill();
    });
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

function drawForearmPanel(ctx, elbow, wrist, width, fill, stroke) {
  const angle = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x);
  const perp = angle + Math.PI / 2;
  const hw = width;
  ctx.beginPath();
  ctx.moveTo(elbow.x + Math.cos(perp) * hw, elbow.y + Math.sin(perp) * hw);
  ctx.lineTo(elbow.x - Math.cos(perp) * hw, elbow.y - Math.sin(perp) * hw);
  ctx.lineTo(wrist.x - Math.cos(perp) * hw * 0.7, wrist.y - Math.sin(perp) * hw * 0.7);
  ctx.lineTo(wrist.x + Math.cos(perp) * hw * 0.7, wrist.y + Math.sin(perp) * hw * 0.7);
  ctx.closePath();
  ctx.fillStyle = fill + 'cc';
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGauntlet(ctx, wrist, size, fill, stroke, time) {
  ctx.beginPath();
  ctx.arc(wrist.x, wrist.y, size, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Palm glow dot
  const pulse = 0.6 + 0.4 * Math.sin(time * 0.005);
  ctx.beginPath();
  ctx.arc(wrist.x, wrist.y, size * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(100, 200, 255, ${pulse})`;
  ctx.fill();
}

// --- Spider-Man suit drawing ---
function drawSpiderManSuit(ctx, pose, suitState, w, h, time) {
  if (!pose?.landmarks?.[0]) return;
  const lm = pose.landmarks[0];
  const alpha = suitState.globalAlpha ?? 1;
  ctx.globalAlpha = alpha;

  const ls = toCanvas(lm[POSE_LANDMARKS.LEFT_SHOULDER], w, h);
  const rs = toCanvas(lm[POSE_LANDMARKS.RIGHT_SHOULDER], w, h);
  const lh = toCanvas(lm[POSE_LANDMARKS.LEFT_HIP], w, h);
  const rh = toCanvas(lm[POSE_LANDMARKS.RIGHT_HIP], w, h);
  const le = toCanvas(lm[POSE_LANDMARKS.LEFT_ELBOW], w, h);
  const re = toCanvas(lm[POSE_LANDMARKS.RIGHT_ELBOW], w, h);
  const lw = toCanvas(lm[POSE_LANDMARKS.LEFT_WRIST], w, h);
  const rw = toCanvas(lm[POSE_LANDMARKS.RIGHT_WRIST], w, h);
  const nose = toCanvas(lm[POSE_LANDMARKS.NOSE], w, h);

  const shoulderW = Math.abs(rs.x - ls.x);
  const torsoH = Math.abs(lh.y - ls.y);

  // Torso
  if (suitState.pieces.torso) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.torso;
    const cx = (ls.x + rs.x) / 2;
    const grad = ctx.createLinearGradient(ls.x, ls.y, rs.x, rh.y);
    grad.addColorStop(0, 'rgba(192,57,43,0.85)');
    grad.addColorStop(0.4, 'rgba(41,128,185,0.85)');
    grad.addColorStop(1, 'rgba(41,128,185,0.85)');

    ctx.beginPath();
    ctx.moveTo(ls.x, ls.y);
    ctx.lineTo(rs.x, rs.y);
    ctx.lineTo(rh.x, rh.y);
    ctx.lineTo(lh.x, lh.y);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Web pattern overlay
    drawWebPattern(ctx, cx, (ls.y + rh.y) / 2, shoulderW * 0.7, time);
    ctx.restore();
  }

  // Forearms
  if (suitState.pieces.rightForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightForearm;
    drawForearmPanel(ctx, re, rw, shoulderW * 0.12, '#c0392b', 'rgba(41,128,185,0.5)');
    ctx.restore();
  }
  if (suitState.pieces.leftForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftForearm;
    drawForearmPanel(ctx, le, lw, shoulderW * 0.12, '#c0392b', 'rgba(41,128,185,0.5)');
    ctx.restore();
  }

  // Hands
  if (suitState.pieces.rightHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightHand;
    ctx.beginPath();
    ctx.arc(rw.x, rw.y, shoulderW * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(192,57,43,0.85)';
    ctx.fill();
    ctx.restore();
  }
  if (suitState.pieces.leftHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftHand;
    ctx.beginPath();
    ctx.arc(lw.x, lw.y, shoulderW * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(192,57,43,0.85)';
    ctx.fill();
    ctx.restore();
  }

  // Head (mask)
  if (suitState.pieces.head) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.head;
    const helmR = shoulderW * 0.22;
    ctx.beginPath();
    ctx.ellipse(nose.x, nose.y - helmR * 0.2, helmR * 0.75, helmR, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(192,57,43,0.75)';
    ctx.fill();
    // Eye lenses (white)
    [{ x: nose.x - helmR * 0.3, y: nose.y - helmR * 0.12 }, { x: nose.x + helmR * 0.3, y: nose.y - helmR * 0.12 }].forEach(eye => {
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, helmR * 0.22, helmR * 0.14, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();
    });
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

function drawWebPattern(ctx, cx, cy, radius, time) {
  const spokes = 8;
  const rings = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.8;
  for (let s = 0; s < spokes; s++) {
    const angle = (s / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.stroke();
  }
  for (let r = 1; r <= rings; r++) {
    const ringR = radius * (r / rings);
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// --- Thor suit drawing ---
function drawThorSuit(ctx, pose, suitState, w, h, time) {
  if (!pose?.landmarks?.[0]) return;
  const lm = pose.landmarks[0];
  const alpha = suitState.globalAlpha ?? 1;
  ctx.globalAlpha = alpha;

  const ls = toCanvas(lm[POSE_LANDMARKS.LEFT_SHOULDER], w, h);
  const rs = toCanvas(lm[POSE_LANDMARKS.RIGHT_SHOULDER], w, h);
  const lh = toCanvas(lm[POSE_LANDMARKS.LEFT_HIP], w, h);
  const rh = toCanvas(lm[POSE_LANDMARKS.RIGHT_HIP], w, h);
  const le = toCanvas(lm[POSE_LANDMARKS.LEFT_ELBOW], w, h);
  const re = toCanvas(lm[POSE_LANDMARKS.RIGHT_ELBOW], w, h);
  const lw = toCanvas(lm[POSE_LANDMARKS.LEFT_WRIST], w, h);
  const rw = toCanvas(lm[POSE_LANDMARKS.RIGHT_WRIST], w, h);
  const nose = toCanvas(lm[POSE_LANDMARKS.NOSE], w, h);

  const shoulderW = Math.abs(rs.x - ls.x);
  const torsoH = Math.abs(lh.y - ls.y);

  // Torso (silver armor)
  if (suitState.pieces.torso) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.torso;
    const grad = ctx.createLinearGradient(ls.x, ls.y, rs.x, rh.y);
    grad.addColorStop(0, 'rgba(180,180,200,0.85)');
    grad.addColorStop(0.5, 'rgba(140,140,160,0.9)');
    grad.addColorStop(1, 'rgba(100,100,120,0.85)');
    ctx.beginPath();
    ctx.moveTo(ls.x, ls.y);
    ctx.lineTo(rs.x, rs.y);
    ctx.lineTo(rh.x, rh.y);
    ctx.lineTo(lh.x, lh.y);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Circle plate on chest
    const cx = (ls.x + rs.x) / 2;
    const cy = ls.y + torsoH * 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, shoulderW * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,215,0,0.7)';
    ctx.fill();
    ctx.restore();
  }

  // Cape
  if (suitState.pieces.cape) {
    ctx.save();
    ctx.globalAlpha = alpha * (suitState.pieces.cape || 0) * 0.7;
    const cx = (ls.x + rs.x) / 2;
    const capeW = shoulderW * 0.9;
    const ripple = Math.sin(time * 0.002) * 10;
    ctx.beginPath();
    ctx.moveTo(ls.x - capeW * 0.1, ls.y);
    ctx.quadraticCurveTo(cx, ls.y - shoulderW * 0.1 + ripple, rs.x + capeW * 0.1, rs.y);
    ctx.lineTo(rs.x + capeW * 0.3, lh.y + torsoH * 0.3 + ripple);
    ctx.quadraticCurveTo(cx, lh.y + torsoH * 0.5, ls.x - capeW * 0.3, lh.y + torsoH * 0.3 - ripple);
    ctx.closePath();
    ctx.fillStyle = 'rgba(180,0,0,0.6)';
    ctx.fill();
    ctx.restore();
  }

  // Lightning crackle on torso
  if (suitState.pieces.torso) {
    ctx.save();
    ctx.globalAlpha = alpha * (0.3 + 0.3 * Math.sin(time * 0.008 + Math.random() * 0.5));
    drawLightning(ctx, ls, rs, 3);
    ctx.restore();
  }

  // Forearms
  if (suitState.pieces.rightForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightForearm;
    drawForearmPanel(ctx, re, rw, shoulderW * 0.13, '#8899aa', 'rgba(255,215,0,0.5)');
    ctx.restore();
  }
  if (suitState.pieces.leftForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftForearm;
    drawForearmPanel(ctx, le, lw, shoulderW * 0.13, '#8899aa', 'rgba(255,215,0,0.5)');
    ctx.restore();
  }

  // Gauntlets
  if (suitState.pieces.rightHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightHand;
    drawGauntlet(ctx, rw, shoulderW * 0.08, 'rgba(180,180,200,0.85)', 'rgba(255,215,0,0.7)', time);
    ctx.restore();
  }
  if (suitState.pieces.leftHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftHand;
    drawGauntlet(ctx, lw, shoulderW * 0.08, 'rgba(180,180,200,0.85)', 'rgba(255,215,0,0.7)', time);
    ctx.restore();
  }

  // Helmet
  if (suitState.pieces.head) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.head;
    const helmR = shoulderW * 0.22;
    ctx.beginPath();
    ctx.ellipse(nose.x, nose.y - helmR * 0.2, helmR * 0.75, helmR, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(160,160,180,0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Viking-style wings
    ctx.beginPath();
    ctx.moveTo(nose.x - helmR * 0.75, nose.y - helmR * 0.4);
    ctx.lineTo(nose.x - helmR * 1.2, nose.y - helmR * 0.7);
    ctx.lineTo(nose.x - helmR * 0.8, nose.y - helmR * 0.1);
    ctx.fillStyle = 'rgba(200,200,220,0.7)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(nose.x + helmR * 0.75, nose.y - helmR * 0.4);
    ctx.lineTo(nose.x + helmR * 1.2, nose.y - helmR * 0.7);
    ctx.lineTo(nose.x + helmR * 0.8, nose.y - helmR * 0.1);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

function drawLightning(ctx, from, to, branches) {
  ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const steps = 8;
  let x = from.x, y = from.y;
  const dx = (to.x - from.x) / steps;
  const dy = (to.y - from.y) / steps;
  ctx.moveTo(x, y);
  for (let i = 0; i < steps; i++) {
    x += dx + (Math.random() - 0.5) * 20;
    y += dy + (Math.random() - 0.5) * 20;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// --- Venom suit drawing ---
function drawVenomSuit(ctx, pose, suitState, w, h, time) {
  if (!pose?.landmarks?.[0]) return;
  const lm = pose.landmarks[0];
  const alpha = suitState.globalAlpha ?? 1;
  ctx.globalAlpha = alpha;

  const ls = toCanvas(lm[POSE_LANDMARKS.LEFT_SHOULDER], w, h);
  const rs = toCanvas(lm[POSE_LANDMARKS.RIGHT_SHOULDER], w, h);
  const lh = toCanvas(lm[POSE_LANDMARKS.LEFT_HIP], w, h);
  const rh = toCanvas(lm[POSE_LANDMARKS.RIGHT_HIP], w, h);
  const le = toCanvas(lm[POSE_LANDMARKS.LEFT_ELBOW], w, h);
  const re = toCanvas(lm[POSE_LANDMARKS.RIGHT_ELBOW], w, h);
  const lw = toCanvas(lm[POSE_LANDMARKS.LEFT_WRIST], w, h);
  const rw = toCanvas(lm[POSE_LANDMARKS.RIGHT_WRIST], w, h);
  const nose = toCanvas(lm[POSE_LANDMARKS.NOSE], w, h);

  const shoulderW = Math.abs(rs.x - ls.x);
  const torsoH = Math.abs(lh.y - ls.y);

  // Symbiote torso — black amorphous shape
  if (suitState.pieces.torso) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.torso;
    const ripple = Math.sin(time * 0.003) * 8;
    ctx.beginPath();
    ctx.moveTo(ls.x - ripple, ls.y);
    ctx.quadraticCurveTo((ls.x + rs.x) / 2, ls.y - 20, rs.x + ripple, rs.y);
    ctx.quadraticCurveTo(rh.x + ripple * 0.5, (rs.y + rh.y) / 2, rh.x, rh.y);
    ctx.quadraticCurveTo((lh.x + rh.x) / 2, rh.y + ripple, lh.x, lh.y);
    ctx.quadraticCurveTo(ls.x - ripple * 0.5, (ls.y + lh.y) / 2, ls.x - ripple, ls.y);
    ctx.fillStyle = 'rgba(8, 8, 8, 0.92)';
    ctx.fill();

    // Spider symbol in white
    const cx = (ls.x + rs.x) / 2;
    const cy = ls.y + torsoH * 0.25;
    drawVenomSpider(ctx, cx, cy, shoulderW * 0.18);
    ctx.restore();
  }

  // Forearms
  if (suitState.pieces.rightForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightForearm;
    drawForearmPanel(ctx, re, rw, shoulderW * 0.13, '#0a0a0a', 'rgba(255,255,255,0.3)');
    drawSymbioteEdge(ctx, re, rw, shoulderW * 0.15, time);
    ctx.restore();
  }
  if (suitState.pieces.leftForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftForearm;
    drawForearmPanel(ctx, le, lw, shoulderW * 0.13, '#0a0a0a', 'rgba(255,255,255,0.3)');
    drawSymbioteEdge(ctx, le, lw, shoulderW * 0.15, time);
    ctx.restore();
  }

  // Hands
  if (suitState.pieces.rightHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightHand;
    drawSymbioteHand(ctx, rw, shoulderW * 0.1, time);
    ctx.restore();
  }
  if (suitState.pieces.leftHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftHand;
    drawSymbioteHand(ctx, lw, shoulderW * 0.1, time);
    ctx.restore();
  }

  // Head
  if (suitState.pieces.head) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.head;
    const helmR = shoulderW * 0.24;
    const headRipple = Math.sin(time * 0.004) * 5;
    ctx.beginPath();
    ctx.ellipse(nose.x, nose.y - helmR * 0.15, helmR * 0.8 + headRipple, helmR + headRipple, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5, 5, 5, 0.95)';
    ctx.fill();
    // White eyes
    [{ x: nose.x - helmR * 0.32, y: nose.y - helmR * 0.1 }, { x: nose.x + helmR * 0.32, y: nose.y - helmR * 0.1 }].forEach(eye => {
      const eyeGlow = 0.8 + 0.2 * Math.sin(time * 0.005);
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, helmR * 0.28, helmR * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${eyeGlow})`;
      ctx.fill();
    });
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

function drawVenomSpider(ctx, cx, cy, size) {
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.15, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  // Legs (4 per side)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 3) * Math.PI * 0.8 + Math.PI * 0.1;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy + (i - 1.5) * size * 0.1);
    ctx.quadraticCurveTo(cx - size * 0.5, cy + (i - 1.5) * size * 0.15, cx - size * 0.8, cy + (i - 2) * size * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.12, cy + (i - 1.5) * size * 0.1);
    ctx.quadraticCurveTo(cx + size * 0.5, cy + (i - 1.5) * size * 0.15, cx + size * 0.8, cy + (i - 2) * size * 0.12);
    ctx.stroke();
  }
}

function drawSymbioteEdge(ctx, from, to, width, time) {
  const steps = 12;
  const dx = (to.x - from.x) / steps;
  const dy = (to.y - from.y) / steps;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const perp = angle + Math.PI / 2;

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;

  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const jitter = (Math.random() - 0.5) * 6;
      const x = from.x + dx * i + Math.cos(perp) * (width + jitter) * side;
      const y = from.y + dy * i + Math.sin(perp) * (width + jitter) * side;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawSymbioteHand(ctx, wrist, size, time) {
  const ripple = Math.sin(time * 0.006) * 3;
  ctx.beginPath();
  ctx.arc(wrist.x, wrist.y, size + ripple, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5,5,5,0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// --- Main dispatcher ---
export function drawSuit(ctx, characterId, pose, suitState, w, h, time) {
  ctx.save();
  switch (characterId) {
    case 'ironman':  drawIronManSuit(ctx, pose, suitState, w, h, time); break;
    case 'spiderman': drawSpiderManSuit(ctx, pose, suitState, w, h, time); break;
    case 'thor':     drawThorSuit(ctx, pose, suitState, w, h, time); break;
    case 'venom':    drawVenomSuit(ctx, pose, suitState, w, h, time); break;
  }
  ctx.restore();
}

// Default suit state
export function createSuitState() {
  return {
    globalAlpha: 0,
    pieces: {
      rightHand: 0,
      leftHand: 0,
      rightForearm: 0,
      leftForearm: 0,
      torso: 0,
      head: 0,
      legs: 0,
      cape: 0,
    },
    locked: false,
  };
}
