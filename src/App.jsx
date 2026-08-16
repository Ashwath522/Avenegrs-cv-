import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import './App.css';

const MEDIAPIPE_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [cameraStatus, setCameraStatus] = useState('requesting'); // requesting, granted, denied, error
  const [modelStatus, setModelStatus] = useState('loading'); // loading, ready, error
  const [fps, setFps] = useState(0);

  const landmarkerRef = useRef(null);
  const animFrameId = useRef(null);
  const lastVideoTime = useRef(-1);
  const fpsData = useRef({ frames: 0, lastTime: performance.now() });

  // 1. Initialize Camera
  useEffect(() => {
    let stream = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraStatus('granted');
        }
      } catch (err) {
        console.error("Camera access denied or failed:", err);
        setCameraStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 2. Initialize MediaPipe Hand Landmarker
  useEffect(() => {
    async function initMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: HAND_MODEL,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2, // Track both hands
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        
        landmarkerRef.current = landmarker;
        setModelStatus('ready');
      } catch (err) {
        console.error("MediaPipe initialization failed:", err);
        setModelStatus('error');
      }
    }
    initMediaPipe();

    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  // 3. Render Loop (Tracking + Canvas Drawing + FPS)
  useEffect(() => {
    if (cameraStatus !== 'granted' || modelStatus !== 'ready') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');

    const renderLoop = () => {
      // FPS Calculation
      const now = performance.now();
      fpsData.current.frames++;
      if (now - fpsData.current.lastTime >= 1000) {
        setFps(Math.round((fpsData.current.frames * 1000) / (now - fpsData.current.lastTime)));
        fpsData.current.frames = 0;
        fpsData.current.lastTime = now;
      }

      // Ensure canvas matches video dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Process frame if video has new data
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime.current && landmarkerRef.current) {
        lastVideoTime.current = video.currentTime;
        const results = landmarkerRef.current.detectForVideo(video, now);

        if (results.landmarks) {
          for (const landmarks of results.landmarks) {
            drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
          }
        }
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    // Start loop when video is playing
    video.addEventListener('loadeddata', renderLoop);
    
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      video.removeEventListener('loadeddata', renderLoop);
    };
  }, [cameraStatus, modelStatus]);

  // Helper to draw raw 21 hand landmarks
  const drawLandmarks = (ctx, landmarks, w, h) => {
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    for (const lm of landmarks) {
      // NOTE: Video is mirrored via CSS, so we mirror the X coordinate for drawing!
      const x = (1 - lm.x) * w; 
      const y = lm.y * h;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Render UI
  if (cameraStatus === 'denied') {
    return <div className="error-screen">Camera access was denied. Please allow camera permissions in your browser settings to continue.</div>;
  }
  if (cameraStatus === 'error') {
    return <div className="error-screen">An error occurred while accessing the camera. Ensure your device has a working webcam.</div>;
  }
  if (modelStatus === 'error') {
    return <div className="error-screen">Failed to load MediaPipe tracking models. Check your internet connection.</div>;
  }

  return (
    <div className="app-container">
      {/* 
        Video feed: mirrored horizontally like a selfie camera 
        Hidden initially until models load to prevent showing un-tracked video
      */}
      <video 
        ref={videoRef} 
        className="camera-feed"
        autoPlay 
        playsInline 
        muted 
        style={{ display: modelStatus === 'ready' ? 'block' : 'none' }}
      />

      {/* Canvas for landmark drawing (same mirroring applies) */}
      <canvas 
        ref={canvasRef} 
        className="tracking-canvas"
        style={{ display: modelStatus === 'ready' ? 'block' : 'none' }}
      />

      {/* Loading overlay */}
      {modelStatus === 'loading' && (
        <div className="loading-overlay">
          <h2>Initializing AI Tracking Models...</h2>
          <p>Downloading MediaPipe WASM and weights. This may take a moment.</p>
        </div>
      )}

      {/* FPS Counter (only visible when tracking) */}
      {modelStatus === 'ready' && (
        <div className="fps-counter">
          FPS: {fps}
        </div>
      )}
    </div>
  );
}
