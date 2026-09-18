import React, { useEffect, useRef } from 'react';

interface Node3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  baseRadius: number;
  color: string;
  pulseSpeed: number;
  pulseOffset: number;
}

export const SpatialBackground3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color palette matching Dark Blue theme
    const colors = [
      '#38BDF8', // Cyan Blue
      '#60A5FA', // Sky Blue
      '#818CF8', // Indigo
      '#0284C7', // Cobalt
      '#34D399', // Emerald Neon
    ];

    // Generate 3D point cloud
    const nodeCount = 95;
    const radiusSpread = Math.min(width, height) * 0.75;
    const nodes: Node3D[] = [];

    for (let i = 0; i < nodeCount; i++) {
      // Spherical coordinates distribution for smooth 3D globe/cloud
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.cbrt(Math.random()) * radiusSpread;

      nodes.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta) * 0.65, // Slight vertical squash for horizon feel
        z: r * Math.cos(phi),
        radius: Math.random() * 2 + 1.2,
        baseRadius: Math.random() * 2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // 3D Rotation angles & mouse tracking
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / width) * 2 - 1;
      const normY = (e.clientY / height) * 2 - 1;
      targetRotY = normX * 0.25;
      targetRotX = -normY * 0.2;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    const fov = 650; // Field of View projection distance

    // Render loop
    const render = () => {
      time += 0.015;

      // Smooth camera interpolation towards mouse + autonomous organic drift
      rotY += (targetRotY + Math.sin(time * 0.3) * 0.15 - rotY) * 0.03;
      rotX += (targetRotX + Math.cos(time * 0.2) * 0.1 - rotX) * 0.03;

      // Base auto-spin around vertical axis
      const currentRotY = rotY + time * 0.08;
      const currentRotX = rotX;

      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);
      const cosX = Math.cos(currentRotX);
      const sinX = Math.sin(currentRotX);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw moving chromatic blended color blooms
      drawBlendedAmbientColorBlooms(ctx, width, height, time);

      const centerX = width * 0.52; // Slightly offset right of sidebar
      const centerY = height * 0.5;

      // Transform nodes into 3D screen space
      interface ProjectedNode {
        node: Node3D;
        px: number;
        py: number;
        scale: number;
        alpha: number;
        depthZ: number;
      }

      const projected: ProjectedNode[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // 3D Rotation Y
        const x1 = node.x * cosY + node.z * sinY;
        const z1 = -node.x * sinY + node.z * cosY;

        // 3D Rotation X
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        // Perspective 3D projection
        const depthZ = z2 + 750;
        if (depthZ <= 20) continue; // Behind camera

        const scale = fov / depthZ;
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;

        // Depth-based transparency: closer = brighter, farther = subtle
        const alpha = Math.max(0.12, Math.min(0.85, (1200 - depthZ) / 900));

        projected.push({
          node,
          px,
          py,
          scale,
          alpha,
          depthZ,
        });
      }

      // Sort back-to-front for proper depth blending
      projected.sort((a, b) => b.depthZ - a.depthZ);

      // Draw 3D Connecting Neural Links
      const maxConnectDist = 130;
      ctx.lineWidth = 0.9;

      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];

          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * Math.min(p1.alpha, p2.alpha) * 0.45;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // Draw 3D Floating Nodes with Glowing Halos
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const pulse = Math.sin(time * 3 + p.node.pulseOffset) * 0.4 + 1;
        const drawRadius = Math.max(1, p.node.baseRadius * p.scale * pulse);

        // Ambient outer glow
        const glowRadius = drawRadius * 3.5;
        const glowGrad = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, glowRadius);
        glowGrad.addColorStop(0, `rgba(56, 189, 248, ${p.alpha * 0.4})`);
        glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(p.px, p.py, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Solid core particle
        ctx.fillStyle = p.node.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.px, p.py, drawRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw Horizon Cyber Grid Waves at the bottom
      drawCyberHorizon(ctx, width, height, time);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-75"
      style={{ filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.2))' }}
      aria-hidden="true"
    />
  );
};

// Subtle 3D Perspective Wireframe Horizon at bottom
function drawCyberHorizon(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  const horizonY = height * 0.88;
  const gridLines = 8;
  const cols = 22;

  ctx.save();
  ctx.lineWidth = 0.6;

  // Longitudinal perspective lines radiating from vanishing point
  const vanishingX = width * 0.52;
  const vanishingY = height * 0.65;

  for (let c = 0; c <= cols; c++) {
    const bottomX = (c / cols) * width * 1.3 - width * 0.15;
    const grad = ctx.createLinearGradient(vanishingX, vanishingY, bottomX, height);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0.22)');

    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(vanishingX, vanishingY);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }

  // Latitudinal moving lines traveling forward towards camera
  for (let l = 1; l <= gridLines; l++) {
    // Non-linear spacing for perspective depth + time offset for moving animation
    const progress = (l / gridLines + (time * 0.08) % (1 / gridLines)) % 1;
    const y = horizonY + Math.pow(progress, 2.2) * (height - horizonY);

    const lineAlpha = Math.sin(progress * Math.PI) * 0.22;
    ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

// Moving Chromatic Blended Color Blooms (Aurora Light Mesh)
function drawBlendedAmbientColorBlooms(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Bloom 1: Cyan-Blue Orb
  const cx1 = width * 0.28 + Math.sin(time * 0.4) * 140;
  const cy1 = height * 0.32 + Math.cos(time * 0.3) * 100;
  const r1 = 520;
  const grad1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, r1);
  grad1.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
  grad1.addColorStop(0.5, 'rgba(2, 132, 199, 0.06)');
  grad1.addColorStop(1, 'rgba(2, 132, 199, 0)');
  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.arc(cx1, cy1, r1, 0, Math.PI * 2);
  ctx.fill();

  // Bloom 2: Royal Indigo-Violet Orb
  const cx2 = width * 0.72 + Math.cos(time * 0.35) * 160;
  const cy2 = height * 0.42 + Math.sin(time * 0.45) * 120;
  const r2 = 580;
  const grad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r2);
  grad2.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
  grad2.addColorStop(0.5, 'rgba(124, 58, 237, 0.06)');
  grad2.addColorStop(1, 'rgba(124, 58, 237, 0)');
  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.arc(cx2, cy2, r2, 0, Math.PI * 2);
  ctx.fill();

  // Bloom 3: Cobalt Deep Pulse
  const cx3 = width * 0.5 + Math.sin(time * 0.25) * 120;
  const cy3 = height * 0.8 + Math.cos(time * 0.3) * 80;
  const r3 = 480;
  const grad3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, r3);
  grad3.addColorStop(0, 'rgba(14, 165, 233, 0.10)');
  grad3.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = grad3;
  ctx.beginPath();
  ctx.arc(cx3, cy3, r3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
