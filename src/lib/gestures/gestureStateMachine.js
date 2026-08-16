// Gesture State Machine
// Tracks: dwell-select, pinch-confirm, swipe-back, open-palm, fist-reset
import { GESTURE, HAND_LANDMARKS } from '../../constants/characters.js';

function dist2D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function dist3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

class GestureStateMachine {
  constructor() {
    this.reset();
    this._dwellTarget = null;
    this._dwellStart = 0;
    this._dwellProgress = 0;

    this._prevWristX = null;
    this._prevWristTime = null;

    this._history = []; // wrist positions for velocity
  }

  reset() {
    this.currentGesture = null; // 'open-palm' | 'fist' | 'point' | 'pinch' | null
    this.dwellRegion = null;    // { id, progress 0-1 }
    this.dwellConfirmed = false;
    this.swipeDetected = false;
    this.pinchConfirmed = false;
    this.indexTip = null;       // normalized {x,y} for dwell targeting
    this.handPresent = false;
  }

  // Returns gesture result from latest hand landmarks (normalized 0-1)
  processHands(handResults) {
    if (!handResults?.landmarks?.length) {
      this.handPresent = false;
      this.indexTip = null;
      return this._buildResult();
    }

    this.handPresent = true;
    const lm = handResults.landmarks[0]; // primary hand
    const wrist = lm[HAND_LANDMARKS.WRIST];
    const thumbTip = lm[HAND_LANDMARKS.THUMB_TIP];
    const indexTip = lm[HAND_LANDMARKS.INDEX_TIP];
    const middleTip = lm[HAND_LANDMARKS.MIDDLE_TIP];
    const ringTip = lm[HAND_LANDMARKS.RING_TIP];
    const pinkyTip = lm[HAND_LANDMARKS.PINKY_TIP];

    const indexMcp = lm[HAND_LANDMARKS.INDEX_MCP];
    const middleMcp = lm[HAND_LANDMARKS.MIDDLE_MCP];

    this.indexTip = { x: indexTip.x, y: indexTip.y };

    // --- Pinch: thumb-tip to index-tip distance ---
    const pinchDist = dist2D(thumbTip, indexTip);
    const isPinching = pinchDist < GESTURE.PINCH_THRESHOLD;

    // --- Open palm: all 5 fingertips far from wrist ---
    const fingerDists = [
      dist2D(thumbTip, wrist),
      dist2D(indexTip, wrist),
      dist2D(middleTip, wrist),
      dist2D(ringTip, wrist),
      dist2D(pinkyTip, wrist),
    ];
    const allExtended = fingerDists.every(d => d > GESTURE.OPEN_PALM_THRESHOLD);

    // --- Fist: all fingertips close to palm center ---
    const palmCenter = {
      x: (indexMcp.x + middleMcp.x) / 2,
      y: (indexMcp.y + middleMcp.y) / 2,
    };
    const fistDists = [
      dist2D(indexTip, palmCenter),
      dist2D(middleTip, palmCenter),
      dist2D(ringTip, palmCenter),
      dist2D(pinkyTip, palmCenter),
    ];
    const isFist = fistDists.every(d => d < GESTURE.FIST_THRESHOLD);

    // --- Point: index extended, others curled ---
    const indexExtended = dist2D(indexTip, wrist) > GESTURE.OPEN_PALM_THRESHOLD * 0.75;
    const othersNotExtended = [
      dist2D(middleTip, palmCenter),
      dist2D(ringTip, palmCenter),
      dist2D(pinkyTip, palmCenter),
    ].every(d => d < GESTURE.FIST_THRESHOLD * 1.5);
    const isPointing = indexExtended && othersNotExtended && !isPinching;

    // --- Swipe velocity ---
    const now = performance.now();
    this._history.push({ x: wrist.x, t: now });
    if (this._history.length > 10) this._history.shift();

    let swipeDir = null;
    if (this._history.length >= 5) {
      const old = this._history[0];
      const dt = (now - old.t) / 1000;
      if (dt > 0) {
        const vx = (wrist.x - old.x) / dt;
        if (Math.abs(vx) > GESTURE.SWIPE_VELOCITY * 10) {
          swipeDir = vx > 0 ? 'right' : 'left';
        }
      }
    }

    // Build gesture name
    let gesture = null;
    if (allExtended) gesture = 'open-palm';
    else if (isFist) gesture = 'fist';
    else if (isPinching) gesture = 'pinch';
    else if (isPointing) gesture = 'point';

    this.currentGesture = gesture;

    return this._buildResult({
      gesture,
      indexTip: this.indexTip,
      pinchDist,
      fingerDists,
      swipeDir,
      isPinching,
      isPointing,
      isFist,
      isOpenPalm: allExtended,
      wrist: { x: wrist.x, y: wrist.y },
    });
  }

  // Dwell logic — call each frame with a region id and whether tip is inside
  updateDwell(regionId, isInside) {
    const now = performance.now();

    if (!isInside || regionId !== this._dwellTarget) {
      this._dwellTarget = isInside ? regionId : null;
      this._dwellStart = isInside ? now : 0;
      this._dwellProgress = 0;
      return { progress: 0, confirmed: false, regionId };
    }

    const elapsed = now - this._dwellStart;
    this._dwellProgress = Math.min(elapsed / GESTURE.DWELL_MS, 1);
    const confirmed = this._dwellProgress >= 1;

    return {
      progress: this._dwellProgress,
      confirmed,
      regionId,
    };
  }

  _buildResult(data = {}) {
    return {
      handPresent: this.handPresent,
      indexTip: this.indexTip,
      ...data,
    };
  }
}

export const gestureSM = new GestureStateMachine();
