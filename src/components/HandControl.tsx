"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface HandControlProps {
  onZoom: (delta: number) => void;
  onDrag: (deltaX: number, deltaY: number) => void;
  onTap: (x: number, y: number) => void;
  enabled: boolean;
  onToggle: () => void;
}

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export default function HandControl({
  onZoom,
  onDrag,
  onTap,
  enabled,
  onToggle,
}: HandControlProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const tapCooldownRef = useRef(false);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Calculate distance between two points
  const getDistance = (p1: HandLandmark, p2: HandLandmark) => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
    );
  };

  // Process hand landmarks
  const processHands = useCallback(
    (results: any) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks: HandLandmark[] = results.multiHandLandmarks[0];

        // Draw hand landmarks
        ctx.fillStyle = "#ffd700";
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 2;

        // Draw connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [0, 9], [9, 10], [10, 11], [11, 12], // Middle
          [0, 13], [13, 14], [14, 15], [15, 16], // Ring
          [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
          [5, 9], [9, 13], [13, 17], // Palm
        ];

        connections.forEach(([i, j]) => {
          ctx.beginPath();
          ctx.moveTo(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height);
          ctx.lineTo(landmarks[j].x * canvas.width, landmarks[j].y * canvas.height);
          ctx.stroke();
        });

        // Draw points
        landmarks.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Get key landmarks
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const palm = landmarks[0];
        const indexBase = landmarks[5];

        // Calculate palm center for drag
        const palmCenter = {
          x: (palm.x + indexBase.x + landmarks[17].x) / 3,
          y: (palm.y + indexBase.y + landmarks[17].y) / 3,
        };

        // Pinch detection (thumb and index finger)
        const pinchDist = getDistance(thumbTip, indexTip);
        const isPinching = pinchDist < 0.08;

        // Two-finger pinch for zoom (thumb and middle)
        const zoomPinchDist = getDistance(thumbTip, middleTip);

        // Handle zoom with two-hand pinch or thumb-middle pinch
        if (lastPinchDistRef.current !== null) {
          const pinchDelta = zoomPinchDist - lastPinchDistRef.current;
          if (Math.abs(pinchDelta) > 0.005) {
            onZoom(pinchDelta * 20);
          }
        }
        lastPinchDistRef.current = zoomPinchDist;

        // Handle drag when hand is open (not pinching)
        if (!isPinching && lastPositionRef.current) {
          const deltaX = (palmCenter.x - lastPositionRef.current.x) * 5;
          const deltaY = (palmCenter.y - lastPositionRef.current.y) * 5;

          if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
            onDrag(-deltaX * 100, deltaY * 100);
          }
        }
        lastPositionRef.current = palmCenter;

        // Tap detection (quick pinch)
        if (isPinching && !tapCooldownRef.current) {
          tapCooldownRef.current = true;
          onTap(indexTip.x, indexTip.y);
          setTimeout(() => {
            tapCooldownRef.current = false;
          }, 500);
        }

        // Draw pinch indicator
        if (isPinching) {
          ctx.fillStyle = "#00ff00";
          ctx.beginPath();
          ctx.arc(
            ((thumbTip.x + indexTip.x) / 2) * canvas.width,
            ((thumbTip.y + indexTip.y) / 2) * canvas.height,
            15,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      } else {
        lastPositionRef.current = null;
        lastPinchDistRef.current = null;
      }
    },
    [onZoom, onDrag, onTap]
  );

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (!enabled) {
      // Cleanup when disabled
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraReady(false);
      return;
    }

    const initHands = async () => {
      try {
        // Dynamically import MediaPipe
        const { Hands } = await import("@mediapipe/hands");
        const { Camera } = await import("@mediapipe/camera_utils");

        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0, // Faster
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(processHands);
        handsRef.current = hands;

        // Start camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240,
          });

          await camera.start();
          cameraRef.current = camera;
          setCameraReady(true);
          setError(null);
        }
      } catch (err) {
        console.error("Hand tracking error:", err);
        setError("Camera not available");
        setCameraReady(false);
      }
    };

    initHands();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [enabled, processHands]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Camera preview */}
      <div className="relative rounded-lg overflow-hidden border-2 border-yellow-400/50 shadow-lg">
        <video
          ref={videoRef}
          className="w-44 h-33 object-cover transform scale-x-[-1]"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className="absolute inset-0 w-44 h-33 transform scale-x-[-1]"
        />
        {!cameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="text-yellow-400 text-sm animate-pulse">Loading camera...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        {cameraReady && (
          <div className="absolute top-1 right-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        )}
      </div>
    </div>
  );
}
