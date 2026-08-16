// Character configuration — colors, suit pieces, gesture thresholds, HUD accents
export const CHARACTERS = {
  ironman: {
    id: 'ironman',
    name: 'Iron Man',
    label: 'IRON MAN',
    tagline: 'Genius. Billionaire. Avenger.',
    primaryColor: '#c0392b',
    secondaryColor: '#f39c12',
    accentColor: '#64c8ff',
    glowColor: 'rgba(243, 156, 18, 0.7)',
    hudColor: '#64c8ff',
    cardGradient: 'linear-gradient(135deg, rgba(192,57,43,0.3) 0%, rgba(243,156,18,0.2) 100%)',
    borderColor: 'rgba(243, 156, 18, 0.5)',
    // Suit piece draw order
    suitPieces: ['rightHand', 'leftHand', 'rightForearm', 'leftForearm', 'torso', 'head', 'legs'],
    idleVFX: 'arcReactor',
    powerVFX: 'repulsor',
    loadingTheme: 'holographicGrid',
    icon: '⚙️',
    // Canvas drawing style
    style: {
      primary: '#c0392b',
      secondary: '#f39c12',
      accent: '#64c8ff',
      glow: 'rgba(243,156,18,0.8)',
    },
  },
  spiderman: {
    id: 'spiderman',
    name: 'Spider-Man',
    label: 'SPIDER-MAN',
    tagline: 'Your friendly neighborhood hero.',
    primaryColor: '#c0392b',
    secondaryColor: '#2980b9',
    accentColor: '#ff6b6b',
    glowColor: 'rgba(41, 128, 185, 0.7)',
    hudColor: '#ff6b6b',
    cardGradient: 'linear-gradient(135deg, rgba(192,57,43,0.3) 0%, rgba(41,128,185,0.2) 100%)',
    borderColor: 'rgba(41, 128, 185, 0.5)',
    suitPieces: ['rightHand', 'leftHand', 'rightForearm', 'leftForearm', 'torso', 'head'],
    idleVFX: 'webShimmer',
    powerVFX: 'webShoot',
    loadingTheme: 'webLines',
    icon: '🕷️',
    style: {
      primary: '#c0392b',
      secondary: '#2980b9',
      accent: '#ff6b6b',
      glow: 'rgba(41,128,185,0.8)',
    },
  },
  thor: {
    id: 'thor',
    name: 'Thor',
    label: 'THOR',
    tagline: 'God of Thunder. Son of Odin.',
    primaryColor: '#c0c0c0',
    secondaryColor: '#ffd700',
    accentColor: '#c8dcff',
    glowColor: 'rgba(150, 180, 255, 0.7)',
    hudColor: '#c8dcff',
    cardGradient: 'linear-gradient(135deg, rgba(192,192,192,0.2) 0%, rgba(255,215,0,0.2) 100%)',
    borderColor: 'rgba(200, 220, 255, 0.5)',
    suitPieces: ['rightHand', 'leftHand', 'rightForearm', 'leftForearm', 'torso', 'head', 'cape'],
    idleVFX: 'lightningCrackle',
    powerVFX: 'mjolnir',
    loadingTheme: 'lightningBolt',
    icon: '⚡',
    style: {
      primary: '#c0c0c0',
      secondary: '#ffd700',
      accent: '#c8dcff',
      glow: 'rgba(200,220,255,0.8)',
    },
  },
  venom: {
    id: 'venom',
    name: 'Venom',
    label: 'VENOM',
    tagline: 'We are Venom.',
    primaryColor: '#0a0a0a',
    secondaryColor: '#ffffff',
    accentColor: '#aaaaaa',
    glowColor: 'rgba(255, 255, 255, 0.25)',
    hudColor: '#ffffff',
    cardGradient: 'linear-gradient(135deg, rgba(20,20,20,0.6) 0%, rgba(60,60,60,0.3) 100%)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    suitPieces: ['rightHand', 'leftHand', 'rightForearm', 'leftForearm', 'torso', 'head'],
    idleVFX: 'symbioteRipple',
    powerVFX: 'symbiote',
    loadingTheme: 'symbioteFluid',
    icon: '🖤',
    style: {
      primary: '#111111',
      secondary: '#ffffff',
      accent: '#888888',
      glow: 'rgba(255,255,255,0.4)',
    },
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);

// Gesture thresholds
export const GESTURE = {
  DWELL_MS: 600,
  PINCH_THRESHOLD: 0.08,       // normalized distance
  SWIPE_VELOCITY: 0.015,       // normalized units/frame
  OPEN_PALM_THRESHOLD: 0.18,   // fingertip-to-wrist normalized
  FIST_THRESHOLD: 0.06,        // fingertip-to-palm normalized
  POINT_THRESHOLD: 0.04,       // index extended, others curled
};

// MediaPipe landmark indices
export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};

// App state machine states
export const APP_STATE = {
  SPLASH: 'SPLASH',
  CAMERA_PERMISSION: 'CAMERA_PERMISSION',
  CHARACTER_SELECT: 'CHARACTER_SELECT',
  LOADING_TRANSITION: 'LOADING_TRANSITION',
  SUIT_UP: 'SUIT_UP',
  IDLE: 'IDLE',
  POWER: 'POWER',
};
