/* A conceptual driving scenario. The animation does not represent measured data. */
(() => {
  'use strict';

  const modes = new Set(['explore', 'evaluate', 'evolve']);
  let mode = 'explore';
  // Respect the initial preference; explicit controls own playback afterwards.
  let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let destroyed = false;
  let invalidate = () => {};
  let cleanup = () => {};

  window.scenarioScene = {
    setMode(next) {
      if (!modes.has(next) || destroyed) return;
      mode = next;
      invalidate();
    },
    setPaused(next) {
      paused = Boolean(next);
      invalidate();
    },
    destroy() {
      destroyed = true;
      cleanup();
      document.removeEventListener('DOMContentLoaded', boot);
    }
  };

  function boot() {
    const canvas = document.getElementById('scenario-canvas');
    if (!canvas || destroyed) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const lime = '#b9ff66';
    const white = '#eaf5df';
    const orange = '#ff9168';
    let width = 640;
    let height = 620;
    let scale = 1;
    let dpr = 1;
    let frame = 0;
    let time = 0;
    let previous = 0;
    let mx = 0;
    let my = 0;
    let targetX = 0;
    let targetY = 0;

    const blocks = [
      { x: -230, y: -161, w: 88, h: 78, z: 21 },
      { x: -112, y: -170, w: 49, h: 89, z: 43 },
      { x: 83, y: -181, w: 84, h: 73, z: 31 },
      { x: 191, y: -150, w: 51, h: 69, z: 15 },
      { x: -224, y: 79, w: 83, h: 63, z: 17 },
      { x: -111, y: 78, w: 47, h: 94, z: 29 },
      { x: 81, y: 80, w: 58, h: 77, z: 15 },
      { x: 172, y: 82, w: 70, h: 101, z: 35 }
    ];

    // Fixed sampling keeps the geometry stable on resize and mode changes.
    let seed = 90210;
    const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const cloud = [];
    blocks.forEach((block) => {
      for (let i = 0; i < 75; i += 1) {
        const side = i % 3;
        cloud.push({
          x: block.x + (side === 0 ? block.w : random() * block.w),
          y: block.y + (side === 1 ? block.h : random() * block.h),
          z: side === 2 ? block.z : random() * block.z,
          alpha: 0.15 + random() * 0.43,
          radius: random() > 0.93 ? 1.45 : 0.65,
          phase: random() * Math.PI * 2
        });
      }
    });
    for (let i = 0; i < 190; i += 1) {
      const horizontal = i % 2 === 0;
      const edge = random() > 0.5 ? 49 : -49;
      cloud.push({
        x: horizontal ? random() * 580 - 290 : edge + random() * 13,
        y: horizontal ? edge + random() * 10 : random() * 450 - 225,
        z: random() * 5,
        alpha: 0.15 + random() * 0.3,
        radius: 0.65,
        phase: random() * Math.PI * 2
      });
    }

    function project(x, y, z = 0) {
      return {
        x: width * 0.51 + ((x - y) * 0.84 + mx * (z * 0.08 + 8)) * scale,
        y: height * 0.49 + ((x + y) * 0.39 - z * 0.95 + my * (z * 0.06 + 8)) * scale
      };
    }

    function polygon(points, fill, stroke, lineWidth = 1) {
      ctx.beginPath();
      points.forEach((point, index) => {
        const p = project(point[0], point[1], point[2] || 0);
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
    }

    function line(points, color, lineWidth = 1, dash = []) {
      ctx.beginPath();
      points.forEach((point, index) => {
        const p = project(point[0], point[1], point[2] || 0);
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function dot(x, y, z, radius, color) {
      const p = project(x, y, z);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function route(t, branch = 0, offset = 0) {
      if (branch === 0) return { x: -282 + t * 564, y: 13 + offset, z: 1.6 };
      const direction = branch === 1 ? 1 : -1;
      const lane = direction > 0 ? 13 : -13;
      if (t < 0.46) return { x: -282 + t / 0.46 * 238, y: 13 + offset, z: 1.6 };
      if (t < 0.68) {
        const angle = (t - 0.46) / 0.22 * Math.PI / 2;
        return {
          x: -44 + Math.sin(angle) * (44 + lane),
          y: 13 + direction * (1 - Math.cos(angle)) * 57 + offset,
          z: 1.6
        };
      }
      return { x: lane, y: 13 + direction * (57 + (t - 0.68) / 0.32 * 163) + offset, z: 1.6 };
    }

    function path(branch, color, lineWidth = 1, offset = 0, dash = [], start = 0, end = 1) {
      const points = [];
      for (let i = 0; i <= 76; i += 1) {
        const p = route(start + (end - start) * i / 76, branch, offset);
        points.push([p.x, p.y, p.z]);
      }
      line(points, color, lineWidth, dash);
    }

    function drawGround() {
      for (let n = -330; n <= 330; n += 30) {
        const major = n % 90 === 0;
        line([[n, -275], [n, 275]], major ? 'rgba(115,155,118,.10)' : 'rgba(115,155,118,.045)', 0.6);
        line([[-330, n], [330, n]], major ? 'rgba(115,155,118,.10)' : 'rgba(115,155,118,.045)', 0.6);
      }

      // One connected four-way junction with a consistent lane layout.
      const junction = [
        [-306, -39], [-39, -39], [-39, -245], [39, -245],
        [39, -39], [306, -39], [306, 39], [39, 39],
        [39, 245], [-39, 245], [-39, 39], [-306, 39]
      ];
      polygon(junction, 'rgba(17,35,28,.92)', 'rgba(168,205,148,.24)', 1);
      line([[-302, -43], [-43, -43], [-43, -240]], 'rgba(185,255,102,.15)', 0.75);
      line([[43, -240], [43, -43], [302, -43]], 'rgba(185,255,102,.15)', 0.75);
      line([[-302, 43], [-43, 43], [-43, 240]], 'rgba(185,255,102,.15)', 0.75);
      line([[43, 240], [43, 43], [302, 43]], 'rgba(185,255,102,.15)', 0.75);

      [[-302, -51], [51, 302]].forEach(([a, b]) => {
        line([[a, 0], [b, 0]], 'rgba(209,225,196,.32)', 0.8, [7, 10]);
        [-26, 26].forEach(y => line([[a, y], [b, y]], 'rgba(209,225,196,.13)', 0.65, [4, 10]));
      });
      [[-240, -51], [51, 240]].forEach(([a, b]) => {
        line([[0, a], [0, b]], 'rgba(209,225,196,.32)', 0.8, [7, 10]);
        [-26, 26].forEach(x => line([[x, a], [x, b]], 'rgba(209,225,196,.13)', 0.65, [4, 10]));
      });

      // Crossing bars and stop lines are quiet but make the scale legible.
      [-54, 54].forEach((crossing) => {
        for (let x = -31; x <= 27; x += 9) {
          polygon([[x, crossing - 3], [x + 4, crossing - 3], [x + 4, crossing + 3], [x, crossing + 3]], 'rgba(223,238,210,.19)');
        }
        line([[-34, crossing * 1.22], [-3, crossing * 1.22]], 'rgba(223,238,210,.29)', 1.5);
      });

      // Lane-direction chevrons.
      [-194, 175].forEach(x => {
        const direction = x < 0 ? 1 : -1;
        const y = x < 0 ? 13 : -13;
        line([[x - direction * 9, y], [x + direction * 8, y]], 'rgba(209,225,196,.26)', 1);
        line([[x + direction * 2, y - 4], [x + direction * 8, y], [x + direction * 2, y + 4]], 'rgba(209,225,196,.26)', 1);
      });
    }

    function drawBlock(block) {
      const { x, y, w, h, z } = block;
      polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 'rgba(21,42,32,.5)', 'rgba(103,143,100,.14)', 0.7);
      polygon([[x + w, y, 0], [x + w, y + h, 0], [x + w, y + h, z], [x + w, y, z]], 'rgba(18,33,26,.69)', 'rgba(145,181,125,.12)', 0.6);
      polygon([[x, y + h, 0], [x + w, y + h, 0], [x + w, y + h, z], [x, y + h, z]], 'rgba(24,43,32,.68)', 'rgba(145,181,125,.17)', 0.6);
      polygon([[x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z]], 'rgba(26,45,33,.5)', 'rgba(145,181,125,.2)', 0.7);
      line([[x + 6, y + h - 6, z + 0.5], [x + w - 6, y + h - 6, z + 0.5]], 'rgba(185,255,102,.18)', 0.65);
    }

    function drawCloud() {
      cloud.forEach((p) => {
        const alpha = p.alpha * (0.86 + Math.sin(time * 0.45 + p.phase) * 0.14);
        dot(p.x, p.y, p.z, p.radius * Math.max(scale, 0.8), `rgba(184,224,151,${alpha})`);
      });
    }

    function drawPaths() {
      if (mode === 'evaluate') {
        for (let branch = 0; branch < 3; branch += 1) {
          for (let sample = -3; sample <= 3; sample += 1) {
            path(branch, branch === 2 ? 'rgba(255,145,104,.13)' : 'rgba(185,255,102,.12)', 0.75, sample * 2.5, [], 0.06, 0.98);
          }
          path(branch, branch === 2 ? 'rgba(255,145,104,.65)' : 'rgba(185,255,102,.65)', 1.1, 0, branch === 0 ? [] : [3, 5]);
          for (let i = 0; i < 12; i += 1) {
            const t = (i / 12 + time * 0.045) % 1;
            const p = route(t, branch, Math.sin(i * 4.1) * 6);
            dot(p.x, p.y, p.z + 1, 1.5, branch === 2 ? orange : lime);
          }
        }
      } else if (mode === 'evolve') {
        for (let generation = 4; generation >= 0; generation -= 1) {
          const points = [];
          for (let i = 0; i <= 90; i += 1) {
            const t = i / 90;
            const p = route(t, 1);
            const wobble = Math.sin(t * Math.PI * 3.5) * Math.sin(t * Math.PI) * generation * 7;
            points.push([p.x + (t > 0.58 ? wobble : 0), p.y + (t < 0.58 ? wobble : 0), 1.8 + generation * 0.15]);
          }
          line(points, generation === 0 ? lime : `rgba(185,255,102,${0.33 - generation * 0.045})`, generation === 0 ? 1.8 : 0.9, generation === 0 ? [] : [2, 5]);
        }
        path(2, 'rgba(255,145,104,.36)', 0.8, 0, [2, 6], 0.38, 0.92);
        for (let i = 0; i < 9; i += 1) {
          const p = route(0.12 + i * 0.095, 1);
          dot(p.x, p.y, 2.4, i === Math.floor(time * 1.3) % 9 ? 3 : 1.5, lime);
        }
      } else {
        path(0, 'rgba(185,255,102,.26)', 0.8, 0, [3, 6]);
        path(2, 'rgba(255,145,104,.53)', 1, 0, [3, 5], 0.38, 0.94);
        path(1, 'rgba(185,255,102,.08)', 10);
        path(1, 'rgba(185,255,102,.17)', 4);
        path(1, lime, 1.45);
        for (let i = 0; i < 8; i += 1) {
          const p = route((i / 8 + time * 0.047) % 1, 1);
          dot(p.x, p.y, p.z + 1, 1.9, white);
        }
      }
    }

    function car(x, y, heading, color, ego = false) {
      const transform = (u, v, z) => [x + u * Math.cos(heading) - v * Math.sin(heading), y + u * Math.sin(heading) + v * Math.cos(heading), z];
      const points = (coords, z) => coords.map(([u, v]) => transform(u, v, z));
      const outline = [[-10, -5], [8, -5], [11, -3], [11, 3], [8, 5], [-10, 5], [-12, 3], [-12, -3]];
      polygon(points(outline, 0.8), 'rgba(0,0,0,.32)');
      polygon([transform(-10, 5, 1), transform(8, 5, 1), transform(8, 5, 7), transform(-10, 5, 7)], ego ? '#536b39' : '#4a5549', color, 0.5);
      polygon(points(outline, 7), ego ? '#c9f49c' : '#768271', color, 0.85);
      polygon(points([[-5, -3.8], [4, -3.8], [7, -2.9], [7, 2.9], [4, 3.8], [-5, 3.8]], 7.3), '#15271c', ego ? 'rgba(232,255,204,.65)' : 'rgba(220,232,209,.3)', 0.6);
      line([transform(-3, -3.8, 7.5), transform(-3, 3.8, 7.5)], color, 0.7);
      if (ego) {
        dot(x, y, 10, 2, white);
        const front = transform(18, 0, 0.8);
        polygon([front, transform(62, -18, 0.8), transform(62, 18, 0.8)], 'rgba(185,255,102,.037)');
      }
    }

    function drawSensors(p) {
      for (let ring = 0; ring < 3; ring += 1) {
        const radius = 34 + ((time * 15 + ring * 31) % 93);
        const alpha = (1 - (radius - 34) / 93) * 0.19;
        const pts = [];
        for (let i = 0; i <= 70; i += 1) {
          const angle = i / 70 * Math.PI * 2;
          pts.push([p.x + Math.cos(angle) * radius, p.y + Math.sin(angle) * radius, 1]);
        }
        line(pts, `rgba(185,255,102,${alpha})`, 0.65, [2, 5]);
      }
      const target = project(p.x, p.y, 25);
      ctx.strokeStyle = 'rgba(185,255,102,.48)';
      ctx.lineWidth = 0.8;
      const r = 19 * scale;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(target.x + sx * r, target.y + sy * (r - 5));
        ctx.lineTo(target.x + sx * r, target.y + sy * r);
        ctx.lineTo(target.x + sx * (r - 5), target.y + sy * r);
        ctx.stroke();
      });
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawGround();
      blocks.slice().sort((a, b) => a.x + a.y - b.x - b.y).forEach(drawBlock);
      drawCloud();
      drawPaths();

      const t = 0.19 + ((time * 0.027) % 0.68);
      const p = route(t, 1);
      const next = route(Math.min(t + 0.002, 0.999), 1);
      drawSensors(p);
      car(179 - (time * 13) % 360, -14, Math.PI, '#a0b592');
      car(-14, -171 + (time * 8) % 113, Math.PI / 2, '#b0987e');
      car(p.x, p.y, Math.atan2(next.y - p.y, next.x - p.x), lime, true);

      // Fade only the outer canvas: the road geometry stays crisp in the center.
      const fade = ctx.createRadialGradient(width * 0.5, height * 0.49, Math.min(width, height) * 0.28, width * 0.5, height * 0.49, Math.max(width, height) * 0.59);
      fade.addColorStop(0, 'rgba(9,18,15,0)');
      fade.addColorStop(0.77, 'rgba(9,18,15,.12)');
      fade.addColorStop(1, 'rgba(9,18,15,.92)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, width, height);
    }

    const canAnimate = () => !destroyed && !paused && !document.hidden;
    function tick(now) {
      frame = 0;
      if (!canAnimate()) { previous = 0; return; }
      if (previous) time += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      mx += (targetX - mx) * 0.045;
      my += (targetY - my) * 0.045;
      draw();
      frame = requestAnimationFrame(tick);
    }

    invalidate = () => {
      if (destroyed) return;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      draw();
      if (canAnimate()) frame = requestAnimationFrame(tick);
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      scale = Math.min(width / 815, height / 510);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      invalidate();
    }

    function pointer(event) {
      if (paused) return;
      const rect = canvas.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    }

    function resetPointer() { targetX = 0; targetY = 0; }
    const pointerSurface = canvas.parentElement || canvas;
    pointerSurface.addEventListener('pointermove', pointer, { passive: true });
    pointerSurface.addEventListener('pointerleave', resetPointer, { passive: true });
    document.addEventListener('visibilitychange', invalidate);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('resize', resize, { passive: true });
    cleanup = () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', invalidate);
      window.removeEventListener('resize', resize);
      pointerSurface.removeEventListener('pointermove', pointer);
      pointerSurface.removeEventListener('pointerleave', resetPointer);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    resize();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
