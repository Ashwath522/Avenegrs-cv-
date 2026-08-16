import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CHARACTERS, POSE_LANDMARKS, HAND_LANDMARKS, APP_STATE } from '../../constants/characters.js';
import { drawSuit, createSuitState } from '../../lib/rendering/suitRenderer.js';
import { ParticleSystem } from '../../lib/rendering/particleSystem.js';
import { audioManager } from '../../lib/audio/audioManager.js';
import './SuitCanvas.css';

// Suit-up piece order and timing
const SUIT_UP_SEQUENCE = [
  { pieces: ['rightHand', 'leftHand'], delay: 0, duration: 600 },
  { pieces: ['rightForearm', 'leftForearm'], delay: 700, duration: 600 },
  { pieces: ['torso'], delay: 1500, duration: 800 },
  { pieces: ['head', 'cape', 'legs'], delay: 2400, duration: 800 },
];

export default function SuitCanvas({
  videoRef,
  appState,
  characterId,
  gestureData,
  onSuitComplete,
  onPowerDeactivate,
}) {
  const canvasRef = useRef(null);
  const suitStateRef = useRef(createSuitState());
  const particlesRef = useRef(new ParticleSystem());
  const powerParticlesRef = useRef(new ParticleSystem());
  const animRef = useRef(null);
  const suitUpTimerRef = useRef(null);
  const poseDataRef = useRef(null);
  const handDataRef = useRef(null);
  const appStateRef = useRef(appState);
  const characterIdRef = useRef(characterId);
  const gestureRef = useRef(gestureData);
  const [scanProgress, setScanProgress] = useState(0);
  const [poseLocked, setPoseLocked] = useState(false);
  const [reacquireVisible, setReacquireVisible] = useState(false);

  // Keep refs up-to-date
  useEffect(() => { appStateRef.current = appState; }, [appState]);
  useEffect(() => { characterIdRef.current = characterId; }, [characterId]);
  useEffect(() => { gestureRef.current = gestureData; }, [gestureData]);

  // --- Suit-up sequence trigger ---
  useEffect(() => {
    if (appState !== APP_STATE.SUIT_UP) {
      suitStateRef.current = createSuitState();
      particlesRef.current.clear();
      setPoseLocked(false);
      setScanProgress(0);
      return;
    }

    // Reset suit
    const suit = createSuitState();
    suit.globalAlpha = 1;
    suitStateRef.current = suit;

    // Simulate scanning then sequence
    let scanInt = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 1) {
          clearInterval(scanInt);
          setPoseLocked(true);
          startSuitUpSequence();
          return 1;
        }
        return prev + 0.04;
      });
    }, 80);

    return () => clearInterval(scanInt);
  }, [appState]);

  function startSuitUpSequence() {
    const suit = suitStateRef.current;

    SUIT_UP_SEQUENCE.forEach(({ pieces, delay, duration }) => {
      const t = setTimeout(() => {
        audioManager.playSuitPieceSnap();

        // Particle burst at each piece location
        const pose = poseDataRef.current;
        if (pose?.landmarks?.[0] && canvasRef.current) {
          const lm = pose.landmarks[0];
          const canvas = canvasRef.current;
          const W = canvas.width;
          const H = canvas.height;

          pieces.forEach(piece => {
            let lmIdx = POSE_LANDMARKS.LEFT_WRIST;
            if (piece === 'torso') lmIdx = POSE_LANDMARKS.LEFT_SHOULDER;
            if (piece === 'head') lmIdx = POSE_LANDMARKS.NOSE;

            const point = lm[lmIdx];
            if (point) {
              const px = (1 - point.x) * W;
              const py = point.y * H;
              particlesRef.current.emit({
                x: px, y: py,
                targetX: px, targetY: py,
                count: 30,
                color: CHARACTERS[characterIdRef.current]?.style?.glow || '#64c8ff',
                mode: 'burst',
                speed: 3,
                lifetime: 40,
              });
            }
          });
        }

        // Fade in piece
        let start = performance.now();
        const fade = () => {
          const elapsed = performance.now() - start;
          const t = Math.min(elapsed / duration, 1);
          pieces.forEach(p => {
            if (p in suit.pieces) suit.pieces[p] = t;
          });
          if (t < 1) requestAnimationFrame(fade);
          else {
            // Check if done
            const allDone = SUIT_UP_SEQUENCE.every(s => s.pieces.every(p => (suit.pieces[p] || 0) >= 0.95));
            if (allDone) {
              setTimeout(() => onSuitComplete?.(), 400);
            }
          }
        };
        fade();
      }, delay);
      suitUpTimerRef.current = t;
    });
  }

  // --- Power effect ---
  function triggerPowerEffect(charId, handLm) {
    if (!canvasRef.current || !handLm) return;
    const canvas = canvasRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const wrist = handLm[HAND_LANDMARKS.WRIST];
    const wx = (1 - wrist.x) * W;
    const wy = wrist.y * H;
    const particles = powerParticlesRef.current;
    particles.clear();

    if (charId === 'ironman') {
      audioManager.playPowerActivate('ironman');
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          particles.emit({ x: wx, y: wy, targetX: wx - 300, targetY: wy - 200, count: 40, color: '#64c8ff', mode: 'repulsor', speed: 8, lifetime: 50 });
        }, i * 60);
      }
    } else if (charId === 'spiderman') {
      audioManager.playPowerActivate('spiderman');
      particles.emit({ x: wx, y: wy, targetX: wx - 400, targetY: wy - 300, count: 60, color: '#dddddd', mode: 'web', speed: 6, lifetime: 80 });
    } else if (charId === 'thor') {
      audioManager.playPowerActivate('thor');
      particles.emit({ x: wx, y: wy, targetX: wx, targetY: wy, count: 80, color: '#c8dcff', mode: 'lightning', speed: 5, lifetime: 30 });
      for (let i = 0; i < 3; i++) {
        setTimeout(() => particles.emit({ x: wx, y: wy, targetX: wx, targetY: wy, count: 60, color: '#ffd700', mode: 'mjolnir', speed: 4, lifetime: 60 }), i * 200);
      }
    } else if (charId === 'venom') {
      audioManager.playPowerActivate('venom');
      particles.emit({ x: wx, y: wy, targetX: wx - 200, targetY: wy - 100, count: 100, color: '#333333', mode: 'symbiote', speed: 3, lifetime: 120 });
      particles.emit({ x: wx, y: wy, targetX: wx - 200, targetY: wy - 100, count: 30, color: '#666666', mode: 'symbiote', speed: 2, lifetime: 80 });
    }
  }

  // ---- Main render loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastPowerGesture = false;
    let lastIdleAmbient = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function loop(timestamp) {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const state = appStateRef.current;
      const charId = characterIdRef.current;
      const suit = suitStateRef.current;
      const gesture = gestureRef.current;
      const pose = poseDataRef.current;
      const hands = handDataRef.current;

      // --- Tracking dots (skeleton) ---
      if (pose?.landmarks?.[0] && (state === APP_STATE.SUIT_UP || state === APP_STATE.IDLE || state === APP_STATE.POWER)) {
        drawTrackingDots(ctx, pose.landmarks[0], W, H, poseLocked);
      }

      // --- Suit rendering ---
      if ((state === APP_STATE.SUIT_UP || state === APP_STATE.IDLE || state === APP_STATE.POWER) && charId) {
        drawSuit(ctx, charId, pose, suit, W, H, timestamp);
      }

      // --- Suit-up particle stream ---
      if (state === APP_STATE.SUIT_UP) {
        particlesRef.current.update();
        particlesRef.current.draw(ctx);

        // Fingertip → nearest unequipped piece stream
        if (gesture?.indexTip && gesture?.isPointing && pose?.landmarks?.[0]) {
          const tipX = (1 - gesture.indexTip.x) * W;
          const tipY = gesture.indexTip.y * H;
          const lm = pose.landmarks[0];

          // Find nearest unlocked piece
          const unequipped = findNearestUnequippedPiece(suit, lm, W, H);
          if (unequipped) {
            particlesRef.current.emit({
              x: tipX, y: tipY,
              targetX: unequipped.x, targetY: unequipped.y,
              count: 3, color: CHARACTERS[charId]?.style?.glow || '#64c8ff',
              mode: 'stream', speed: 6, lifetime: 30,
            });
          }
        }
      }

      // --- Idle VFX ---
      if (state === APP_STATE.IDLE && charId) {
        drawIdleVFX(ctx, charId, pose, hands, W, H, timestamp);
        particlesRef.current.update();
        particlesRef.current.draw(ctx);

        // Ambient sound tick
        if (timestamp - lastIdleAmbient > 3000) {
          lastIdleAmbient = timestamp;
          audioManager.playIdleAmbient(charId);
        }
      }

      // --- Power effect ---
      if (state === APP_STATE.POWER) {
        // Check for fist to deactivate
        if (gesture?.isFist && !lastPowerGesture) {
          lastPowerGesture = true;
          setTimeout(() => onPowerDeactivate?.(), 500);
        }

        // Trigger power on open-palm (once)
        if (gesture?.isOpenPalm && hands?.landmarks?.[0] && !lastPowerGesture) {
          triggerPowerEffect(charId, hands.landmarks[0]);
        }

        powerParticlesRef.current.update();
        powerParticlesRef.current.draw(ctx);
        drawPowerHUD(ctx, charId, W, H, timestamp);
      } else {
        lastPowerGesture = false;
        powerParticlesRef.current.clear();
      }

      // --- Hand dots ---
      if (hands?.landmarks?.length) {
        hands.landmarks.forEach(hand => {
          drawHandDots(ctx, hand, W, H, gesture, charId);
        });
      }

      // Re-acquire check
      if ((state === APP_STATE.IDLE || state === APP_STATE.POWER) && !pose?.landmarks?.length) {
        setReacquireVisible(true);
      } else {
        setReacquireVisible(false);
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Expose methods for parent to push pose/hand data
  SuitCanvas._setPoseData = useCallback((d) => { poseDataRef.current = d; }, []);
  SuitCanvas._setHandData = useCallback((d) => { handDataRef.current = d; }, []);

  return (
    <div className="suit-canvas-wrapper">
      <canvas ref={canvasRef} className="suit-canvas" />

      {/* Scanning overlay */}
      {appState === APP_STATE.SUIT_UP && !poseLocked && (
        <div className="scan-overlay">
          <div className="scan-line" />
          <div className="scan-status">
            <span className="scan-label">BODY SCAN</span>
            <div className="scan-bar">
              <div className="scan-fill" style={{ width: `${scanProgress * 100}%` }} />
            </div>
            <span className="scan-pct">{Math.round(scanProgress * 100)}%</span>
          </div>
        </div>
      )}

      {/* Re-acquire prompt */}
      {reacquireVisible && (
        <div className="reacquire-prompt">
          <div className="reacquire-icon">⚠</div>
          <div>TRACKING LOST — STEP INTO FRAME</div>
        </div>
      )}
    </div>
  );
}

// ---- Helpers ----

function toCanvas(lm, w, h) {
  return { x: (1 - lm.x) * w, y: lm.y * h };
}

function drawTrackingDots(ctx, lm, w, h, locked) {
  const alpha = locked ? 0.15 : 0.55;
  ctx.save();

  const pairs = [
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
    [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
    [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
    [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
    [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
    [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  ];

  ctx.strokeStyle = `rgba(100,220,255,${alpha})`;
  ctx.lineWidth = 1;
  pairs.forEach(([a, b]) => {
    if (!lm[a] || !lm[b]) return;
    const pa = toCanvas(lm[a], w, h);
    const pb = toCanvas(lm[b], w, h);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  });

  Object.values(POSE_LANDMARKS).forEach(idx => {
    if (!lm[idx]) return;
    const p = toCanvas(lm[idx], w, h);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100,220,255,${alpha * 1.5})`;
    ctx.fill();
  });

  ctx.restore();
}

function drawHandDots(ctx, hand, w, h, gesture, charId) {
  const char = CHARACTERS[charId];
  const color = char?.style?.accent || '#64c8ff';
  ctx.save();
  ctx.strokeStyle = `rgba(${hexToRgb(color)},0.4)`;
  ctx.lineWidth = 1;

  const connections = [
    [0,1],[1,2],[2,3],[3,4],   // thumb
    [0,5],[5,6],[6,7],[7,8],   // index
    [0,9],[9,10],[10,11],[11,12], // middle
    [0,13],[13,14],[14,15],[15,16], // ring
    [0,17],[17,18],[18,19],[19,20], // pinky
    [5,9],[9,13],[13,17],
  ];

  connections.forEach(([a, b]) => {
    if (!hand[a] || !hand[b]) return;
    const pa = { x: (1 - hand[a].x) * w, y: hand[a].y * h };
    const pb = { x: (1 - hand[b].x) * w, y: hand[b].y * h };
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  });

  // Fingertips
  [4, 8, 12, 16, 20].forEach(i => {
    if (!hand[i]) return;
    const p = { x: (1 - hand[i].x) * w, y: hand[i].y * h };
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // Index tip highlight
  if (hand[8]) {
    const p = { x: (1 - hand[8].x) * w, y: hand[8].y * h };
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hexToRgb(color)},0.7)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function drawIdleVFX(ctx, charId, pose, hands, w, h, time) {
  if (!pose?.landmarks?.[0]) return;
  const lm = pose.landmarks[0];
  const ls = toCanvas(lm[POSE_LANDMARKS.LEFT_SHOULDER], w, h);
  const rs = toCanvas(lm[POSE_LANDMARKS.RIGHT_SHOULDER], w, h);
  const cx = (ls.x + rs.x) / 2;
  const cy = (ls.y + rs.y) / 2;
  const sw = Math.abs(rs.x - ls.x);

  ctx.save();

  if (charId === 'ironman') {
    // Arc reactor glow pulse
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.003);
    const grd = ctx.createRadialGradient(cx, cy + sw * 0.1, 0, cx, cy + sw * 0.1, sw * 0.4);
    grd.addColorStop(0, `rgba(100,200,255,${0.15 * pulse})`);
    grd.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy + sw * 0.1, sw * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // HUD scan line
    ctx.strokeStyle = `rgba(100,200,255,${0.06 + 0.04 * Math.sin(time * 0.004)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy + Math.sin(time * 0.001) * 40);
    ctx.lineTo(w, cy + Math.sin(time * 0.001) * 40);
    ctx.stroke();

  } else if (charId === 'spiderman') {
    // Web shimmer: random web lines from shoulders
    ctx.strokeStyle = `rgba(220,220,220,${0.08 + 0.06 * Math.sin(time * 0.002)})`;
    ctx.lineWidth = 0.8;
    [ls, rs].forEach(s => {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI + Math.sin(time * 0.001 + i) * 0.3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo(
          s.x + Math.cos(angle + 0.5) * sw * 0.6,
          s.y + Math.sin(angle + 0.5) * sw * 0.8,
          s.x + Math.cos(angle) * sw * 1.2,
          s.y + Math.sin(angle) * sw * 1.5
        );
        ctx.stroke();
      }
    });

  } else if (charId === 'thor') {
    // Lightning crackle between hands
    if (lm[POSE_LANDMARKS.LEFT_WRIST] && lm[POSE_LANDMARKS.RIGHT_WRIST]) {
      const lw2 = toCanvas(lm[POSE_LANDMARKS.LEFT_WRIST], w, h);
      const rw2 = toCanvas(lm[POSE_LANDMARKS.RIGHT_WRIST], w, h);
      if (Math.random() < 0.3) {
        ctx.save();
        ctx.strokeStyle = `rgba(200,220,255,${0.3 + Math.random() * 0.4})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = '#c8dcff';
        ctx.shadowBlur = 8;
        drawLightningBolt(ctx, lw2, rw2);
        ctx.restore();
      }
    }

  } else if (charId === 'venom') {
    // Symbiote edge ripple on screen edges
    const t2 = time * 0.001;
    ctx.strokeStyle = `rgba(30,30,30,${0.4 + 0.2 * Math.sin(t2 * 3)})`;
    ctx.lineWidth = 20 + 10 * Math.sin(t2 * 2);
    ctx.strokeRect(-5, -5, w + 10, h + 10);

    ctx.strokeStyle = `rgba(255,255,255,${0.03 + 0.02 * Math.sin(t2 * 5)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, w - 16, h - 16);
  }

  ctx.restore();
}

function drawLightningBolt(ctx, from, to) {
  const steps = 12;
  ctx.beginPath();
  let x = from.x, y = from.y;
  ctx.moveTo(x, y);
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / steps;
    x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 30;
    y = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 30;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawPowerHUD(ctx, charId, w, h, time) {
  ctx.save();

  if (charId === 'ironman') {
    // Targeting reticle
    const cx = w / 2, cy = h / 2;
    const r = 80;
    ctx.strokeStyle = `rgba(100,200,255,${0.4 + 0.3 * Math.sin(time * 0.008)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    // Cross lines
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.5, cy);
    ctx.lineTo(cx - r * 0.3, cy);
    ctx.moveTo(cx + r * 0.3, cy);
    ctx.lineTo(cx + r * 1.5, cy);
    ctx.moveTo(cx, cy - r * 1.5);
    ctx.lineTo(cx, cy - r * 0.3);
    ctx.moveTo(cx, cy + r * 0.3);
    ctx.lineTo(cx, cy + r * 1.5);
    ctx.stroke();
    // Scanning
    ctx.strokeStyle = `rgba(100,200,255,0.2)`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + time * 0.004);
    ctx.stroke();

  } else if (charId === 'venom') {
    // Glitch/ink drip shader — black corner smear
    const drip = 0.4 + 0.3 * Math.sin(time * 0.005);
    ['top', 'bottom', 'left', 'right'].forEach((side, i) => {
      const grd = ctx.createLinearGradient(
        side === 'right' ? w : 0, side === 'bottom' ? h : 0,
        side === 'left' ? w * 0.3 : side === 'right' ? w * 0.7 : 0,
        side === 'top' ? h * 0.3 : side === 'bottom' ? h * 0.7 : 0,
      );
      grd.addColorStop(0, `rgba(0,0,0,${drip})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    });
  }

  ctx.restore();
}

function findNearestUnequippedPiece(suit, lm, w, h) {
  const pieceMap = {
    rightHand: POSE_LANDMARKS.RIGHT_WRIST,
    leftHand: POSE_LANDMARKS.LEFT_WRIST,
    rightForearm: POSE_LANDMARKS.RIGHT_ELBOW,
    leftForearm: POSE_LANDMARKS.LEFT_ELBOW,
    torso: POSE_LANDMARKS.LEFT_SHOULDER,
    head: POSE_LANDMARKS.NOSE,
  };
  for (const [piece, lmIdx] of Object.entries(pieceMap)) {
    if ((suit.pieces[piece] || 0) < 0.5 && lm[lmIdx]) {
      const p = lm[lmIdx];
      return { x: (1 - p.x) * w, y: p.y * h };
    }
  }
  return null;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
