import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHARACTERS } from '../../constants/characters.js';
import { audioManager } from '../../lib/audio/audioManager.js';
import './LoadingTransition.css';

export default function LoadingTransition({ characterId, onComplete }) {
  const mountRef = useRef(null);
  const char = CHARACTERS[characterId];

  useEffect(() => {
    if (!mountRef.current || !char) return;

    audioManager.playLoadingTransition(characterId);

    const el = mountRef.current;
    const W = el.clientWidth;
    const H = el.clientHeight;

    // Three.js setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 5;

    let animId;
    let elapsed = 0;
    let cleanup;

    // Per-character loading scene
    if (characterId === 'ironman') {
      cleanup = buildIronManScene(scene, renderer, char);
    } else if (characterId === 'spiderman') {
      cleanup = buildSpiderManScene(scene, renderer, char);
    } else if (characterId === 'thor') {
      cleanup = buildThorScene(scene, renderer, char);
    } else if (characterId === 'venom') {
      cleanup = buildVenomScene(scene, renderer, char);
    }

    const startTime = performance.now();

    function animate() {
      animId = requestAnimationFrame(animate);
      elapsed = (performance.now() - startTime) / 1000;

      // Update per-character
      if (cleanup?.update) cleanup.update(elapsed);

      renderer.render(scene, camera);

      if (elapsed > 2.8) {
        cancelAnimationFrame(animId);
        onComplete?.();
      }
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      cleanup?.dispose?.();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [characterId]);

  return (
    <div className="loading-container">
      <div ref={mountRef} className="loading-three" />
      <div className="loading-text" style={{ color: char?.hudColor }}>
        <div className="loading-hero-name" style={{ fontFamily: 'var(--font-display)' }}>
          {char?.label}
        </div>
        <div className="loading-status">SUIT INITIALIZING</div>
        <div className="loading-bar-wrap">
          <div className="loading-bar-fill" style={{ background: char?.primaryColor }} />
        </div>
      </div>
    </div>
  );
}

// ---- Iron Man: Holographic grid assembly ----
function buildIronManScene(scene, renderer, char) {
  const group = new THREE.Group();
  scene.add(group);

  // Grid lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0x64c8ff, transparent: true, opacity: 0.4 });
  const gridSize = 8;
  const lines = [];

  for (let i = -gridSize; i <= gridSize; i++) {
    const hGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-gridSize, i, 0),
      new THREE.Vector3(gridSize, i, 0),
    ]);
    const vGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, -gridSize, 0),
      new THREE.Vector3(i, gridSize, 0),
    ]);
    lines.push(new THREE.Line(hGeo, lineMat));
    lines.push(new THREE.Line(vGeo, lineMat));
  }
  lines.forEach(l => group.add(l));

  // Particles assembling into A shape
  const particleCount = 300;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xf39c12, size: 0.06, transparent: true });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Arc reactor glow sphere
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x64c8ff, transparent: true, opacity: 0 })
  );
  sphere.position.set(0, 0, 1);
  scene.add(sphere);

  return {
    update(t) {
      group.rotation.z += 0.005;
      group.rotation.x = Math.sin(t * 0.5) * 0.2;

      const fade = Math.min(t / 0.5, 1);
      lineMat.opacity = fade * 0.4;

      // Sphere glow
      sphere.material.opacity = Math.min(t / 1, 1) * (0.5 + 0.3 * Math.sin(t * 4));
      sphere.scale.setScalar(1 + Math.sin(t * 3) * 0.1);

      // Particles converge
      const pos = pGeo.attributes.position;
      const conv = Math.min(t / 2, 1);
      for (let i = 0; i < particleCount; i++) {
        pos.array[i * 3] *= (1 - conv * 0.03);
        pos.array[i * 3 + 1] *= (1 - conv * 0.03);
      }
      pos.needsUpdate = true;
      pMat.opacity = 0.5 + 0.3 * Math.sin(t * 5);
    },
    dispose() {
      pGeo.dispose();
      pMat.dispose();
    },
  };
}

// ---- Spider-Man: Web lines ----
function buildSpiderManScene(scene, renderer, char) {
  const lineMat = new THREE.LineBasicMaterial({ color: 0xcc2222, transparent: true, opacity: 0 });
  const spokes = 16;
  const rings = 6;
  const lines = [];

  // Spokes
  for (let s = 0; s < spokes; s++) {
    const angle = (s / spokes) * Math.PI * 2;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * 6, Math.sin(angle) * 6, 0),
    ]);
    lines.push(new THREE.Line(geo, lineMat.clone()));
    scene.add(lines[lines.length - 1]);
  }

  // Rings
  for (let r = 1; r <= rings; r++) {
    const pts = [];
    for (let a = 0; a <= spokes; a++) {
      const angle = (a / spokes) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, lineMat.clone());
    scene.add(line);
    lines.push(line);
  }

  // Particles
  const pCount = 200;
  const pos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 6;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(a) * r;
    pos[i * 3 + 2] = 0;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x2980b9, size: 0.04, transparent: true, opacity: 0 });
  const pts2 = new THREE.Points(pGeo, pMat);
  scene.add(pts2);

  return {
    update(t) {
      const fade = Math.min(t / 0.8, 1);
      lines.forEach((l, i) => {
        const delay = (i / lines.length) * 0.8;
        l.material.opacity = Math.max(0, Math.min((t - delay) / 0.5, 1)) * 0.7;
      });
      pMat.opacity = fade * 0.6;
      pts2.rotation.z += 0.003;
    },
  };
}

// ---- Thor: Lightning ----
function buildThorScene(scene, renderer, char) {
  const bolts = [];

  function createBolt(fromX, fromY, toX, toY) {
    const pts = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push(new THREE.Vector3(
        fromX + (toX - fromX) * t + (Math.random() - 0.5) * (1 - Math.abs(t - 0.5) * 2) * 2,
        fromY + (toY - fromY) * t + (Math.random() - 0.5) * (1 - Math.abs(t - 0.5) * 2) * 2,
        0
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xc8dcff, transparent: true, opacity: Math.random() * 0.8 + 0.2 });
    const bolt = new THREE.Line(geo, mat);
    scene.add(bolt);
    return { bolt, mat };
  }

  // Create initial bolts
  for (let i = 0; i < 8; i++) {
    bolts.push(createBolt(
      (Math.random() - 0.5) * 4, 4,
      (Math.random() - 0.5) * 4, -4
    ));
  }

  // Mjolnir silhouette (simple box)
  const hammerGeo = new THREE.BoxGeometry(1.5, 1, 0.3);
  const handleGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0 });

  const hammer = new THREE.Mesh(hammerGeo, mat);
  const handle = new THREE.Mesh(handleGeo, mat.clone());
  handle.position.y = -1.5;

  const group = new THREE.Group();
  group.add(hammer);
  group.add(handle);
  group.rotation.z = Math.PI / 4;
  scene.add(group);

  return {
    update(t) {
      // Regen bolts
      if (Math.floor(t * 10) % 3 === 0) {
        bolts.forEach(b => {
          b.mat.opacity = Math.random() * 0.8;
        });
      }

      // Fade in hammer
      const hammerFade = Math.max(0, Math.min((t - 1) / 1, 1));
      mat.opacity = hammerFade * 0.9;
      handle.material.opacity = hammerFade * 0.9;

      group.rotation.z = Math.PI / 4 + Math.sin(t * 2) * 0.1;
      group.scale.setScalar(0.5 + hammerFade * 0.5);
    },
    dispose() {
      bolts.forEach(b => { b.bolt.geometry.dispose(); b.mat.dispose(); });
    },
  };
}

// ---- Venom: Symbiote fluid ----
function buildVenomScene(scene, renderer, char) {
  // Black blob using displacement
  const geo = new THREE.SphereGeometry(2, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ color: 0x080808, transparent: true, opacity: 0, wireframe: true });
  const sphere = new THREE.Mesh(geo, mat);
  scene.add(sphere);

  // Eyes
  const eyeGeo = new THREE.EllipseCurve(0, 0, 0.5, 0.3, 0, Math.PI * 2, false, 0);
  const eyePts = eyeGeo.getPoints(20);
  const eyeGeo2 = new THREE.BufferGeometry().setFromPoints(eyePts.map(p => new THREE.Vector3(p.x, p.y, 0)));

  const eyeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const lEye = new THREE.Line(eyeGeo2, eyeMat);
  const rEye = new THREE.Line(eyeGeo2, eyeMat.clone());
  lEye.position.set(-0.7, 0.4, 2.1);
  rEye.position.set(0.7, 0.4, 2.1);
  scene.add(lEye, rEye);

  // Particles
  const pCount = 300;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 10;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x333333, size: 0.08, transparent: true, opacity: 0 });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  return {
    update(t) {
      // Pulsating sphere
      const blobFade = Math.min(t / 0.5, 1);
      mat.opacity = blobFade * 0.6;
      const pulse = 1 + Math.sin(t * 3) * 0.08 + Math.sin(t * 7) * 0.03;
      sphere.scale.setScalar(pulse);
      sphere.rotation.y += 0.01;
      sphere.rotation.x += 0.005;

      // Eyes
      const eyeFade = Math.max(0, Math.min((t - 1) / 0.5, 1));
      eyeMat.opacity = eyeFade * (0.7 + 0.3 * Math.sin(t * 5));
      rEye.material.opacity = eyeMat.opacity;

      // Particles converge
      pMat.opacity = blobFade * 0.4;
      const pos2 = pGeo.attributes.position;
      const conv = Math.min(t / 2, 1) * 0.05;
      for (let i = 0; i < pCount; i++) {
        pos2.array[i * 3] -= pos2.array[i * 3] * conv;
        pos2.array[i * 3 + 1] -= pos2.array[i * 3 + 1] * conv;
      }
      pos2.needsUpdate = true;
    },
    dispose() {
      geo.dispose(); mat.dispose();
      pGeo.dispose(); pMat.dispose();
    },
  };
}
