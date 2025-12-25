"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface SnowCanvasProps {
  enabled: boolean;
}

interface Snowflake {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
}

interface DrawPoint {
  x: number;
  y: number;
  age: number;
}

interface Stroke {
  points: DrawPoint[];
  createdAt: number;
}

export default function SnowCanvas({ enabled }: SnowCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const snowLayerRef = useRef<number[]>([]); // Height of snow at each x position
  const strokesRef = useRef<Stroke[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number>(0);
  const [snowReady, setSnowReady] = useState(false);

  const SNOW_BUILD_TIME = 3000; // 3 seconds to build snow layer
  const MAX_SNOW_HEIGHT = 150; // Max snow height at bottom
  const FADE_DURATION = 10000; // Drawing fades in 10 seconds

  // Initialize snowflakes
  const initSnow = useCallback((width: number, height: number) => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 300; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 2,
        speed: Math.random() * 2 + 1,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
      });
    }
    snowflakesRef.current = flakes;

    // Initialize snow layer
    snowLayerRef.current = new Array(Math.ceil(width)).fill(0);
  }, []);

  // Add drawing point
  const addPoint = useCallback((x: number, y: number, canvasHeight: number) => {
    // Only draw on snow layer area
    const snowHeight = snowLayerRef.current[Math.floor(x)] || 0;
    const snowTop = canvasHeight - snowHeight;

    if (y < snowTop - 10) return; // Not on snow

    const strokes = strokesRef.current;
    if (!isDrawingRef.current || strokes.length === 0) {
      strokes.push({
        points: [{ x, y, age: 0 }],
        createdAt: Date.now(),
      });
    } else {
      const currentStroke = strokes[strokes.length - 1];
      const lastPoint = lastPointRef.current;

      if (lastPoint) {
        const dist = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
        const steps = Math.max(1, Math.floor(dist / 2));

        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const ix = lastPoint.x + (x - lastPoint.x) * t;
          const iy = lastPoint.y + (y - lastPoint.y) * t;
          currentStroke.points.push({ x: ix, y: iy, age: 0 });
        }
      }
    }
    lastPointRef.current = { x, y };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled || !snowReady) return;
    e.preventDefault();
    e.stopPropagation();
    isDrawingRef.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && canvasRef.current) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addPoint(x, y, canvasRef.current.height);
    }
  }, [enabled, snowReady, addPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!enabled || !isDrawingRef.current || !snowReady) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && canvasRef.current) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addPoint(x, y, canvasRef.current.height);
    }
  }, [enabled, snowReady, addPoint]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSnowReady(false);
      snowflakesRef.current = [];
      snowLayerRef.current = [];
      strokesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initSnow(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const startTime = Date.now();
    let buildPhase = true;

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const elapsed = Date.now() - startTime;
      const buildProgress = Math.min(1, elapsed / SNOW_BUILD_TIME);

      // Update and draw snowflakes
      snowflakesRef.current.forEach((flake) => {
        flake.wobble += flake.wobbleSpeed;
        flake.x += Math.sin(flake.wobble) * 0.5;
        flake.y += flake.speed;

        // Check if snowflake hits the snow layer
        const floorX = Math.floor(flake.x);
        if (floorX >= 0 && floorX < snowLayerRef.current.length) {
          const currentSnowHeight = snowLayerRef.current[floorX];
          const targetHeight = MAX_SNOW_HEIGHT * buildProgress;
          const snowSurface = canvas.height - currentSnowHeight;

          if (flake.y >= snowSurface && currentSnowHeight < targetHeight) {
            // Add to snow pile
            snowLayerRef.current[floorX] = Math.min(targetHeight, currentSnowHeight + 0.5);

            // Spread to neighbors
            if (floorX > 0) {
              snowLayerRef.current[floorX - 1] = Math.min(
                targetHeight,
                Math.max(snowLayerRef.current[floorX - 1], currentSnowHeight - 1)
              );
            }
            if (floorX < snowLayerRef.current.length - 1) {
              snowLayerRef.current[floorX + 1] = Math.min(
                targetHeight,
                Math.max(snowLayerRef.current[floorX + 1], currentSnowHeight - 1)
              );
            }

            // Reset snowflake to top
            flake.y = -10;
            flake.x = Math.random() * canvas.width;
          }
        }

        // Reset if out of bounds
        if (flake.y > canvas.height || flake.x < -10 || flake.x > canvas.width + 10) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }

        // Draw snowflake
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fill();
      });

      // Draw snow layer
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      for (let x = 0; x < snowLayerRef.current.length; x++) {
        const height = snowLayerRef.current[x];
        // Add slight waviness
        const wave = Math.sin(x * 0.02 + Date.now() * 0.0005) * 2;
        ctx.lineTo(x, canvas.height - height + wave);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();

      // Snow gradient
      const snowGradient = ctx.createLinearGradient(0, canvas.height - MAX_SNOW_HEIGHT, 0, canvas.height);
      snowGradient.addColorStop(0, "rgba(240, 248, 255, 0.95)");
      snowGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.98)");
      snowGradient.addColorStop(1, "rgba(230, 240, 250, 1)");
      ctx.fillStyle = snowGradient;
      ctx.fill();

      // Snow surface highlight
      ctx.beginPath();
      for (let x = 0; x < snowLayerRef.current.length; x++) {
        const height = snowLayerRef.current[x];
        const wave = Math.sin(x * 0.02 + Date.now() * 0.0005) * 2;
        if (x === 0) {
          ctx.moveTo(x, canvas.height - height + wave);
        } else {
          ctx.lineTo(x, canvas.height - height + wave);
        }
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Check if build phase is complete
      if (buildPhase && buildProgress >= 1) {
        buildPhase = false;
        setSnowReady(true);
      }

      // Draw strokes on snow
      const now = Date.now();
      strokesRef.current = strokesRef.current.filter(
        (stroke) => now - stroke.createdAt < FADE_DURATION
      );

      strokesRef.current.forEach((stroke) => {
        const strokeAge = now - stroke.createdAt;
        const alpha = Math.max(0, 1 - strokeAge / FADE_DURATION);

        if (stroke.points.length > 1) {
          // Draw the carved line in snow
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }

          // Dark line (carved into snow)
          ctx.strokeStyle = `rgba(150, 170, 190, ${alpha * 0.8})`;
          ctx.lineWidth = 8;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();

          // Lighter inner line
          ctx.strokeStyle = `rgba(180, 200, 220, ${alpha * 0.6})`;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Highlight edge
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Show "Draw here" hint when ready
      if (snowReady && strokesRef.current.length === 0) {
        ctx.font = "20px var(--font-handwriting), 'Dancing Script', cursive";
        ctx.fillStyle = "rgba(100, 130, 160, 0.5)";
        ctx.textAlign = "center";
        ctx.fillText("Draw on the snow...", canvas.width / 2, canvas.height - MAX_SNOW_HEIGHT / 2);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [enabled, initSnow]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-20"
      style={{
        touchAction: "none",
        cursor: snowReady ? "crosshair" : "wait"
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
