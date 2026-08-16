// MediaPipe Manager — unified Hand + Pose Landmarker with shared animation loop
import { HandLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const MEDIAPIPE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

class MediaPipeManager {
  constructor() {
    this.handLandmarker = null;
    this.poseLandmarker = null;
    this.isRunning = false;
    this.animFrameId = null;
    this.lastHandResults = null;
    this.lastPoseResults = null;
    this.onResults = null;
    this.lastVideoTime = -1;
    this.initialized = false;
  }

  async init(onProgress) {
    try {
      onProgress?.('Loading vision WASM…', 10);
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);

      onProgress?.('Loading hand landmarker…', 40);
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_MODEL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      onProgress?.('Loading pose landmarker…', 75);
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: POSE_MODEL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      onProgress?.('Ready!', 100);
      this.initialized = true;
      return true;
    } catch (err) {
      console.error('[MediaPipe] Init failed:', err);
      throw err;
    }
  }

  start(videoEl, callback) {
    if (!this.initialized || this.isRunning) return;
    this.isRunning = true;
    this.onResults = callback;
    this._loop(videoEl);
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  _loop(videoEl) {
    if (!this.isRunning) return;

    const now = performance.now();

    if (videoEl.readyState >= 2 && videoEl.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = videoEl.currentTime;

      try {
        if (this.handLandmarker) {
          this.lastHandResults = this.handLandmarker.detectForVideo(videoEl, now);
        }
        if (this.poseLandmarker) {
          this.lastPoseResults = this.poseLandmarker.detectForVideo(videoEl, now);
        }
        this.onResults?.({
          hands: this.lastHandResults,
          pose: this.lastPoseResults,
          timestamp: now,
        });
      } catch (e) {
        // Silently skip frame on error
      }
    }

    this.animFrameId = requestAnimationFrame(() => this._loop(videoEl));
  }

  destroy() {
    this.stop();
    this.handLandmarker?.close();
    this.poseLandmarker?.close();
    this.handLandmarker = null;
    this.poseLandmarker = null;
    this.initialized = false;
  }
}

// Singleton
export const mediapipeManager = new MediaPipeManager();
