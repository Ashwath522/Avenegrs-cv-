import React from 'react';
import { CHARACTERS, APP_STATE } from '../../constants/characters.js';
import './HUD.css';

export default function HUD({ appState, characterId, gestureData, confidence }) {
  const char = CHARACTERS[characterId];
  if (!char || !characterId) return null;

  const isActive = [APP_STATE.SUIT_UP, APP_STATE.IDLE, APP_STATE.POWER].includes(appState);
  if (!isActive) return null;

  const stateLabel = {
    [APP_STATE.SUIT_UP]: 'SUITING UP',
    [APP_STATE.IDLE]: 'SUIT ACTIVE',
    [APP_STATE.POWER]: 'POWER MODE',
  }[appState] || '';

  const gestureLabel = gestureData?.gesture
    ? `GESTURE: ${gestureData.gesture.toUpperCase()}`
    : 'SCANNING HANDS…';

  return (
    <div className="hud-container" style={{ '--hud-color': char.hudColor, '--hud-glow': char.glowColor }}>
      {/* Top-left: hero name + state */}
      <div className="hud-topleft">
        <div className="hud-heroname" style={{ fontFamily: 'var(--font-display)', color: char.hudColor }}>
          {char.label}
        </div>
        <div className="hud-state">{stateLabel}</div>
      </div>

      {/* Top-right: gesture readout */}
      <div className="hud-topright">
        <div className="hud-gesture">{gestureLabel}</div>
        <div className="hud-hand-indicator">
          {gestureData?.handPresent ? (
            <span className="hand-dot active" />
          ) : (
            <span className="hand-dot inactive" />
          )}
          <span className="hand-label">{gestureData?.handPresent ? 'HAND DETECTED' : 'NO HAND'}</span>
        </div>
      </div>

      {/* Bottom-left: confidence bar */}
      <div className="hud-bottomleft">
        <div className="hud-conf-label">TRACKING CONF.</div>
        <div className="hud-conf-bar">
          <div
            className="hud-conf-fill"
            style={{
              width: `${(confidence ?? 0.8) * 100}%`,
              background: char.primaryColor,
              boxShadow: `0 0 8px ${char.glowColor}`,
            }}
          />
        </div>
      </div>

      {/* Bottom-right: power hint */}
      <div className="hud-bottomright">
        {appState === APP_STATE.IDLE && (
          <div className="hud-hint">
            OPEN PALM → {char.label} POWER
          </div>
        )}
        {appState === APP_STATE.POWER && (
          <div className="hud-hint power-hint" style={{ color: char.hudColor }}>
            MAKE FIST TO DEACTIVATE
          </div>
        )}
      </div>

      {/* Character-specific HUD accent */}
      {characterId === 'ironman' && <IronManHUD char={char} appState={appState} />}
      {characterId === 'thor' && <ThorHUD char={char} />}
      {characterId === 'venom' && <VenomHUD char={char} />}
    </div>
  );
}

function IronManHUD({ char, appState }) {
  return (
    <div className="hud-ironman">
      {/* Corner targeting reticle segments */}
      <div className="reticle-corner rc-tl" style={{ borderColor: char.hudColor }} />
      <div className="reticle-corner rc-tr" style={{ borderColor: char.hudColor }} />
      <div className="reticle-corner rc-bl" style={{ borderColor: char.hudColor }} />
      <div className="reticle-corner rc-br" style={{ borderColor: char.hudColor }} />
      {appState === APP_STATE.POWER && (
        <div className="ironman-power-ring" style={{ borderColor: char.accentColor }}>
          REPULSOR CHARGED
        </div>
      )}
    </div>
  );
}

function ThorHUD({ char }) {
  return (
    <div className="hud-thor">
      <div className="thor-lightning-bar">
        <div className="thor-lightning-fill" style={{ background: char.accentColor }} />
      </div>
      <div className="thor-label" style={{ color: char.accentColor }}>BIFROST SYNC</div>
    </div>
  );
}

function VenomHUD({ char }) {
  return (
    <div className="hud-venom">
      <div className="venom-symbiote-edge" />
    </div>
  );
}
