// Suit Renderer — draws per-character suit pieces anchored to pose landmarks
// Upgraded to use photorealistic Image Assets with Screen compositing mode

import { POSE_LANDMARKS } from '../../constants/characters.js';

// Preload photorealistic assets
const ASSETS = {
  ironman: {
    head: new Image(),
    torso: new Image()
  },
  spiderman: {
    head: new Image()
  }
};

ASSETS.ironman.head.src = '/assets/ironman-helmet.png';
ASSETS.ironman.torso.src = '/assets/ironman-chest.png';
ASSETS.spiderman.head.src = '/assets/spiderman-helmet.png';

// Helper: lerp a point toward target
function lerp(a, b, t) { return a + (b - a) * t; }

// Convert normalized landmark to canvas pixel coords
function toCanvas(lm, w, h) {
  // video is mirrored, so x is flipped
  return { x: (1 - lm.x) * w, y: lm.y * h };
}

// Draw a photorealistic image asset anchored to a center point, scaled and rotated
function drawAsset(ctx, img, cx, cy, width, height, rotation, alpha) {
  if (!img.complete || img.naturalWidth === 0) return;
  ctx.save();
  // Using screen mode because our generated assets have pure black backgrounds. 
  // Screen mode makes black completely transparent and keeps the bright colors!
  ctx.globalCompositeOperation = 'screen'; 
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
}

// --- Iron Man suit drawing ---
function drawIronManSuit(ctx, pose, suitState, w, h, time) {
  if (!pose?.landmarks?.[0]) return;
  const lm = pose.landmarks[0];
  const alpha = suitState.globalAlpha ?? 1;

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
  
  // Calculate body rotation angle based on shoulders
  const bodyAngle = Math.atan2(rs.y - ls.y, rs.x - ls.x) - Math.PI/2; // adjusted for upright

  // --- Torso plate (Photorealistic Image) ---
  if (suitState.pieces.torso) {
    const cx = (ls.x + rs.x) / 2;
    const cy = (ls.y + rh.y) / 2;
    // Scale the chest image to span across the shoulders and down the torso
    const chestWidth = shoulderW * 1.8;
    const chestHeight = torsoH * 1.5;
    
    drawAsset(
      ctx, 
      ASSETS.ironman.torso, 
      cx, cy, 
      chestWidth, chestHeight, 
      bodyAngle, 
      alpha * suitState.pieces.torso
    );
  }

  // --- Forearms (Geometric fallback) ---
  if (suitState.pieces.rightForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightForearm;
    drawForearmPanel(ctx, re, rw, shoulderW * 0.14, '#900000', 'rgba(243,156,18,0.6)');
    ctx.restore();
  }
  if (suitState.pieces.leftForearm) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftForearm;
    drawForearmPanel(ctx, le, lw, shoulderW * 0.14, '#900000', 'rgba(243,156,18,0.6)');
    ctx.restore();
  }

  // --- Gauntlets (Geometric fallback) ---
  if (suitState.pieces.rightHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.rightHand;
    drawGauntlet(ctx, rw, shoulderW * 0.09, 'rgba(150,20,20,0.95)', 'rgba(243,156,18,0.7)', time);
    ctx.restore();
  }
  if (suitState.pieces.leftHand) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.leftHand;
    drawGauntlet(ctx, lw, shoulderW * 0.09, 'rgba(150,20,20,0.95)', 'rgba(243,156,18,0.7)', time);
    ctx.restore();
  }

  // --- Helmet (Photorealistic Image) ---
  if (suitState.pieces.head) {
    const helmWidth = shoulderW * 0.7;
    // Image is 1:1 ratio
    drawAsset(
      ctx, 
      ASSETS.ironman.head, 
      nose.x, nose.y, 
      helmWidth, helmWidth, 
      bodyAngle * 0.5, // head tilts slightly less than shoulders usually
      alpha * suitState.pieces.head
    );
  }
}

// --- Spider-Man suit drawing ---
function drawSpiderManSuit(ctx, pose, suitState, w, h, time) {
  if (!pose?.landmarks?.[0]) return;
  const lm = pose.landmarks[0];
  const alpha = suitState.globalAlpha ?? 1;

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
  const bodyAngle = Math.atan2(rs.y - ls.y, rs.x - ls.x) - Math.PI/2;

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

  // Head (Photorealistic Mask)
  if (suitState.pieces.head) {
    const helmWidth = shoulderW * 0.65;
    drawAsset(
      ctx, 
      ASSETS.spiderman.head, 
      nose.x, nose.y, 
      helmWidth, helmWidth, 
      bodyAngle * 0.5,
      alpha * suitState.pieces.head
    );
  }
}

// Geometric fallbacks for arms and other characters
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
  const pulse = 0.6 + 0.4 * Math.sin(time * 0.005);
  ctx.beginPath();
  ctx.arc(wrist.x, wrist.y, size * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(100, 200, 255, ${pulse})`;
  ctx.fill();
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

    const cx = (ls.x + rs.x) / 2;
    const cy = ls.y + torsoH * 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, shoulderW * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,215,0,0.7)';
    ctx.fill();
    ctx.restore();
  }

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

  if (suitState.pieces.torso) {
    ctx.save();
    ctx.globalAlpha = alpha * (0.3 + 0.3 * Math.sin(time * 0.008 + Math.random() * 0.5));
    drawLightning(ctx, ls, rs, 3);
    ctx.restore();
  }

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

    const cx = (ls.x + rs.x) / 2;
    const cy = ls.y + torsoH * 0.25;
    drawVenomSpider(ctx, cx, cy, shoulderW * 0.18);
    ctx.restore();
  }

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

  if (suitState.pieces.head) {
    ctx.save();
    ctx.globalAlpha = alpha * suitState.pieces.head;
    const helmR = shoulderW * 0.24;
    const headRipple = Math.sin(time * 0.004) * 5;
    ctx.beginPath();
    ctx.ellipse(nose.x, nose.y - helmR * 0.15, helmR * 0.8 + headRipple, helmR + headRipple, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5, 5, 5, 0.95)';
    ctx.fill();
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
  ctx.beginPath();
  ctx.ellipse(cx, cy, size * 0.15, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
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
