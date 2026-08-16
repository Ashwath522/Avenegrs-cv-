import React, { useState, useEffect, useRef } from 'react';
import CameraFeed from './components/CameraFeed/CameraFeed.jsx';
import Splash from './components/Splash/Splash.jsx';
import CharacterSelect from './components/CharacterSelect/CharacterSelect.jsx';
import LoadingTransition from './components/LoadingTransition/LoadingTransition.jsx';
import SuitCanvas from './components/SuitCanvas/SuitCanvas.jsx';
import HUD from './components/HUD/HUD.jsx';

import { APP_STATE } from './constants/characters.js';
import { mediapipeManager } from './lib/mediapipe/mediapipeManager.js';
import { gestureSM } from './lib/gestures/gestureStateMachine.js';
import { audioManager } from './lib/audio/audioManager.js';

import './App.css';

export default function App() {
  const [appState, setAppState] = useState(APP_STATE.SPLASH);
  const [characterId, setCharacterId] = useState(null);
  const [gestureData, setGestureData] = useState(null);
  const [trackingConf, setTrackingConf] = useState(1);
  const [loadingMsg, setLoadingMsg] = useState('');

  const videoRef = useRef(null);

  // Initialize MediaPipe when entering CAMERA_PERMISSION state
  useEffect(() => {
    if (appState === APP_STATE.CAMERA_PERMISSION) {
      const initMP = async () => {
        try {
          await mediapipeManager.init((msg, pct) => setLoadingMsg(`${msg} ${pct}%`));
          setAppState(APP_STATE.CHARACTER_SELECT);
        } catch (err) {
          console.error("Failed to initialize MediaPipe", err);
          setLoadingMsg('Failed to load tracking models. Check console.');
        }
      };
      initMP();
    }
  }, [appState]);

  // Start MediaPipe processing loop when camera stream is ready
  const handleCameraStream = (stream) => {
    if (videoRef.current && mediapipeManager.initialized) {
      mediapipeManager.start(videoRef.current, (results) => {
        // Run gesture state machine
        const gData = gestureSM.processHands(results.hands);
        setGestureData(gData);

        // Update confidence (simple average if present)
        let conf = 0.5;
        if (results.pose?.landmarks?.length) conf += 0.25;
        if (results.hands?.landmarks?.length) conf += 0.25;
        setTrackingConf(conf);

        // Pass raw data to canvas
        SuitCanvas._setPoseData?.(results.pose);
        SuitCanvas._setHandData?.(results.hands);
      });
    }
  };

  const handleSplashEnter = () => {
    setAppState(APP_STATE.CAMERA_PERMISSION);
  };

  const handleCharacterSelect = (id) => {
    setCharacterId(id);
    setAppState(APP_STATE.LOADING_TRANSITION);
  };

  const handleLoadingComplete = () => {
    setAppState(APP_STATE.SUIT_UP);
  };

  const handleSuitComplete = () => {
    setAppState(APP_STATE.IDLE);
  };

  // Switch to POWER state if open-palm is detected in IDLE
  useEffect(() => {
    if (appState === APP_STATE.IDLE && gestureData?.isOpenPalm) {
      setAppState(APP_STATE.POWER);
    }
  }, [appState, gestureData]);

  const handlePowerDeactivate = () => {
    setAppState(APP_STATE.IDLE);
  };

  return (
    <div className="app-container">
      {/* Background camera feed - always visible after splash */}
      {appState !== APP_STATE.SPLASH && (
        <div className={`camera-layer ${appState === APP_STATE.CAMERA_PERMISSION ? 'blurred' : ''}`}>
          <CameraFeed ref={videoRef} onStream={handleCameraStream} />
        </div>
      )}

      {/* Main Suit Canvas */}
      <div className="canvas-layer">
        <SuitCanvas
          videoRef={videoRef}
          appState={appState}
          characterId={characterId}
          gestureData={gestureData}
          onSuitComplete={handleSuitComplete}
          onPowerDeactivate={handlePowerDeactivate}
        />
      </div>

      {/* UI Overlay */}
      <div className="ui-layer">
        <HUD
          appState={appState}
          characterId={characterId}
          gestureData={gestureData}
          confidence={trackingConf}
        />

        {appState === APP_STATE.SPLASH && (
          <Splash onEnter={handleSplashEnter} />
        )}

        {appState === APP_STATE.CAMERA_PERMISSION && (
          <div className="permission-overlay glass-card">
            <h2>INITIALIZING SYSTEMS</h2>
            <div className="loading-msg">{loadingMsg || 'Requesting camera access...'}</div>
            <div className="spinner" />
          </div>
        )}

        {appState === APP_STATE.CHARACTER_SELECT && (
          <CharacterSelect
            gestureData={gestureData}
            onSelect={handleCharacterSelect}
            onBack={() => setAppState(APP_STATE.SPLASH)}
          />
        )}

        {appState === APP_STATE.LOADING_TRANSITION && (
          <LoadingTransition
            characterId={characterId}
            onComplete={handleLoadingComplete}
          />
        )}
      </div>
    </div>
  );
}
