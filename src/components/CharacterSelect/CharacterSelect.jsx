import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CHARACTER_LIST, GESTURE } from '../../constants/characters.js';
import { gestureSM } from '../../lib/gestures/gestureStateMachine.js';
import { audioManager } from '../../lib/audio/audioManager.js';
import './CharacterSelect.css';

// Card positions: top-left, top-right, bottom-left, bottom-right
const CARD_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export default function CharacterSelect({ gestureData, onSelect, onBack }) {
  const [dwellState, setDwellState] = useState({}); // { [id]: progress 0-1 }
  const [hoveredId, setHoveredId] = useState(null);
  const [confirmedId, setConfirmedId] = useState(null);
  const cardRefs = useRef({});
  const dwellRef = useRef({});
  const lastDwellTick = useRef(0);
  const swipeRef = useRef({ count: 0, lastDir: null });

  // Handle gesture data each frame
  useEffect(() => {
    if (!gestureData) return;

    const { indexTip, swipeDir, isPinching, isPointing, handPresent } = gestureData;

    // Swipe-back detection
    if (swipeDir) {
      if (swipeDir === swipeRef.current.lastDir) {
        swipeRef.current.count++;
        if (swipeRef.current.count > 8) {
          swipeRef.current.count = 0;
          onBack?.();
        }
      } else {
        swipeRef.current.lastDir = swipeDir;
        swipeRef.current.count = 1;
      }
    }

    if (!handPresent || !indexTip) {
      setHoveredId(null);
      setDwellState({});
      return;
    }

    // Map index tip to screen coords
    const tipX = indexTip.x * window.innerWidth;
    const tipY = indexTip.y * window.innerHeight;

    // Check each card for hover
    let foundId = null;
    CHARACTER_LIST.forEach(char => {
      const ref = cardRefs.current[char.id];
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      // Mirror x: the tip is in mirrored video space, map accordingly
      // tipX is already in screen space (we mirrored in the canvas, but index tip is from raw landmarks)
      // We need to flip: screenX = window.innerWidth - tipX
      const mirroredX = window.innerWidth - tipX;
      if (mirroredX >= rect.left && mirroredX <= rect.right && tipY >= rect.top && tipY <= rect.bottom) {
        foundId = char.id;
      }
    });

    setHoveredId(foundId);

    // Dwell logic
    CHARACTER_LIST.forEach(char => {
      const isInside = char.id === foundId;
      const result = gestureSM.updateDwell(char.id, isInside);

      setDwellState(prev => ({ ...prev, [char.id]: result.progress }));

      // Dwell tick sound
      if (isInside && result.progress > 0.2) {
        const now = performance.now();
        if (now - lastDwellTick.current > 200) {
          lastDwellTick.current = now;
          audioManager.playDwellTick();
        }
      }

      // Dwell confirmed (auto-select)
      if (result.confirmed && !confirmedId) {
        setConfirmedId(char.id);
        audioManager.playCharacterSelect(char.id);
        audioManager.playPinchConfirm(); // play success sound
        setTimeout(() => onSelect(char.id), 200);
      }
    });
  }, [gestureData]);

  const handleCardClick = (id) => {
    audioManager.playPinchConfirm();
    onSelect(id);
  };

  return (
    <div className="char-select-container">
      {/* Title */}
      <div className="char-select-title">
        <span className="title-line">CHOOSE YOUR HERO</span>
        <span className="title-hint">Hover to select • Pinch to confirm</span>
      </div>

      {/* Cards */}
      {CHARACTER_LIST.map((char, i) => {
        const pos = CARD_POSITIONS[i];
        const progress = dwellState[char.id] || 0;
        const isHovered = hoveredId === char.id;
        const isConfirmed = confirmedId === char.id;

        return (
          <div
            key={char.id}
            ref={el => cardRefs.current[char.id] = el}
            className={`char-card ${pos} ${isHovered ? 'hovered' : ''} ${isConfirmed ? 'confirmed' : ''}`}
            style={{
              '--card-color': char.primaryColor,
              '--card-glow': char.glowColor,
              '--card-border': char.borderColor,
              background: char.cardGradient,
              borderColor: char.borderColor,
            }}
            onClick={() => handleCardClick(char.id)}
          >
            {/* Dwell progress ring */}
            {progress > 0 && (
              <svg className="dwell-ring" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r="29"
                  fill="none"
                  stroke={char.primaryColor}
                  strokeWidth="3"
                  strokeDasharray="182"
                  strokeDashoffset={182 * (1 - progress)}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
            )}

            {/* Icon */}
            <div className="char-icon">{char.icon}</div>

            {/* Name */}
            <div className="char-name"
              style={{ fontFamily: 'var(--font-display)', color: '#fff', textShadow: `0 0 12px ${char.primaryColor}` }}
            >
              {char.label}
            </div>

            {/* Tagline */}
            <div className="char-tagline">{char.tagline}</div>

            {/* Confirm indicator */}
            {isConfirmed && (
              <div className="char-confirm-ring" style={{ borderColor: char.primaryColor }}>
                SUIT SELECTED
              </div>
            )}

            {/* Corner accents */}
            <div className="card-corner card-corner-tl" style={{ borderColor: char.borderColor }} />
            <div className="card-corner card-corner-br" style={{ borderColor: char.borderColor }} />
          </div>
        );
      })}

      {/* Center crosshair */}
      <div className="center-crosshair">
        <div className="crosshair-h" />
        <div className="crosshair-v" />
        <div className="crosshair-dot" />
      </div>

      {/* Hand tip indicator (mirrored) */}
      {gestureData?.indexTip && (
        <div
          className="finger-cursor"
          style={{
            left: `${(1 - gestureData.indexTip.x) * 100}%`,
            top: `${gestureData.indexTip.y * 100}%`,
          }}
        />
      )}
    </div>
  );
}
