// Particle System — fingertip streams and power effect particles
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 500;
  }

  // Emit a burst from a point
  emit({ x, y, targetX, targetY, count = 20, color = '#64c8ff', size = 3, speed = 4, lifetime = 60, mode = 'stream' }) {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      if (mode === 'stream') {
        // Stream toward target with spread
        const angle = Math.atan2(targetY - y, targetX - x) + (Math.random() - 0.5) * 0.6;
        const s = speed * (0.7 + Math.random() * 0.6);
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          color,
          size: size * (0.5 + Math.random()),
          life: lifetime * (0.7 + Math.random() * 0.6),
          maxLife: lifetime,
          mode,
        });
      } else if (mode === 'burst') {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const s = speed * (0.5 + Math.random() * 1.5);
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          color,
          size: size * (0.5 + Math.random() * 1.5),
          life: lifetime * (0.5 + Math.random()),
          maxLife: lifetime,
          mode,
        });
      } else if (mode === 'repulsor') {
        const angle = Math.atan2(targetY - y, targetX - x) + (Math.random() - 0.5) * 0.3;
        const s = speed * (2 + Math.random() * 3);
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s - 2,
          color,
          size: size * (1 + Math.random() * 2),
          life: lifetime,
          maxLife: lifetime,
          mode,
        });
      } else if (mode === 'web') {
        // Web strand: emit in a line toward target
        const t = i / count;
        const wx = x + (targetX - x) * t;
        const wy = y + (targetY - y) * t;
        this.particles.push({
          x: wx, y: wy,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color,
          size: size * (0.5 + (1 - Math.abs(t - 0.5) * 2) * 0.8),
          life: lifetime,
          maxLife: lifetime,
          mode: 'web',
        });
      } else if (mode === 'symbiote') {
        const angle = Math.atan2(targetY - y, targetX - x) + (Math.random() - 0.5) * 1.5;
        const s = speed * (0.3 + Math.random() * 2);
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          color,
          size: size * (1 + Math.random() * 3),
          life: lifetime,
          maxLife: lifetime,
          mode: 'symbiote',
        });
      } else if (mode === 'lightning') {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * speed * 2,
          vy: (Math.random() - 0.5) * speed * 2,
          color,
          size: size * (0.5 + Math.random() * 2),
          life: lifetime * 0.3,
          maxLife: lifetime * 0.3,
          mode: 'lightning',
        });
      } else if (mode === 'mjolnir') {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 60;
        const s = speed * 0.5;
        this.particles.push({
          x: x + Math.cos(angle) * r,
          y: y + Math.sin(angle) * r,
          targetX: x, targetY: y,
          vx: -Math.cos(angle) * s,
          vy: -Math.sin(angle) * s,
          color,
          size: size * (0.5 + Math.random()),
          life: lifetime,
          maxLife: lifetime,
          mode: 'mjolnir',
        });
      }
    }
  }

  update() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.mode === 'mjolnir' && p.life > 0) {
        // Particles converge to target
        p.vx += (p.targetX - p.x) * 0.05;
        p.vy += (p.targetY - p.y) * 0.05;
        p.vx *= 0.9;
        p.vy *= 0.9;
      }

      if (p.mode === 'symbiote') {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }

      return p.life > 0;
    });
  }

  draw(ctx) {
    this.particles.forEach(p => {
      const t = p.life / p.maxLife;
      const alpha = t * t;
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.mode === 'web') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.mode === 'lightning') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Glow effect
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  clear() {
    this.particles = [];
  }

  get count() {
    return this.particles.length;
  }
}
