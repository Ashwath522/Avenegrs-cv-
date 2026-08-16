import React, { useEffect, useRef, useState } from 'react';
import { audioManager } from '../../lib/audio/audioManager.js';
import './Splash.css';

export default function Splash({ onEnter }) {
  const [phase, setPhase] = useState('logo'); // logo | prompt
  const [promptVisible, setPromptVisible] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    // Logo animation then show prompt
    const t1 = setTimeout(() => {
      audioManager.init();
      audioManager.playIntro();
    }, 300);

    const t2 = setTimeout(() => {
      setPhase('prompt');
      setPromptVisible(true);
    }, 3200);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Canvas particle effect behind the A logo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.8 - 0.2,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random(),
    }));

    function draw() {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background radial gradient
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(canvas.width, canvas.height) * 0.7);
      grd.addColorStop(0, 'rgba(15,0,0,0.95)');
      grd.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scan line
      const scanY = (time * 2) % canvas.height;
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrad.addColorStop(0, 'rgba(192,57,43,0)');
      scanGrad.addColorStop(0.5, 'rgba(192,57,43,0.05)');
      scanGrad.addColorStop(1, 'rgba(192,57,43,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 40, canvas.width, 80);

      // Rising particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.003;
        if (p.y < -10 || p.alpha <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.alpha = 0.6 + Math.random() * 0.4;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `hsl(${5 + Math.random() * 20}, 90%, 60%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleEnter = () => {
    audioManager.resume();
    audioManager.playPinchConfirm();
    onEnter();
  };

  return (
    <div className="splash-container">
      <canvas ref={canvasRef} className="splash-canvas" />

      <div className="splash-content">
        {/* Avengers A Logo */}
        <div className={`avengers-logo ${phase}`}>
          <svg viewBox="0 0 200 200" className="logo-svg">
            {/* Outer ring */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(192,57,43,0.6)" strokeWidth="2" className="logo-ring" />
            <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(192,57,43,0.3)" strokeWidth="1" className="logo-ring-inner" />
            {/* A shape */}
            <path
              d="M100 20 L160 150 L148 150 L130 110 H70 L52 150 L40 150 Z M76 98 L100 42 L124 98 Z"
              fill="rgba(192,57,43,0.95)"
              className="logo-a"
            />
            {/* Gold accent */}
            <path
              d="M76 98 L124 98"
              fill="none"
              stroke="rgba(243,156,18,0.8)"
              strokeWidth="2"
              className="logo-bar"
            />
            {/* Glow */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(192,57,43,0.2)" strokeWidth="8" className="logo-glow" />
          </svg>
          <div className="logo-label">AVENGERS</div>
          <div className="logo-subtitle">HERO SUIT-UP EXPERIENCE</div>
        </div>

        {/* Enter prompt */}
        {promptVisible && (
          <div className="enter-prompt fade-in">
            <div className="enter-hint">TOUCHLESS INTERFACE ACTIVE</div>
            <button
              className="enter-btn"
              onClick={handleEnter}
              id="enter-btn"
            >
              <span className="enter-text">INITIATE SUIT-UP</span>
              <span className="enter-arrow">›</span>
            </button>
            <div className="enter-subtext">Camera + Hand Tracking Required</div>
          </div>
        )}
      </div>

      {/* Corner decorations */}
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />
    </div>
  );
}
