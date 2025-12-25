"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import ConfigPanel from "@/components/ConfigPanel";
import TypingMessage from "@/components/TypingMessage";
import HandControl from "@/components/HandControl";
import SnowCanvas from "@/components/SnowCanvas";
import MediaModal from "@/components/MediaModal";
import { ChristmasConfig, defaultConfig } from "@/types/config";

const STORAGE_KEY = "christmas-tree-config";

// Dynamic import to avoid SSR issues with Three.js
const ChristmasTree = dynamic(() => import("@/components/ChristmasTree"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a15]">
      <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
    </div>
  ),
});

// Load config from localStorage
const loadConfig = (): ChristmasConfig => {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with default to handle new properties
      return { ...defaultConfig, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load config:", e);
  }
  return defaultConfig;
};

// Save config to localStorage
const saveConfig = (config: ChristmasConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save config:", e);
  }
};

export default function Home() {
  const [config, setConfig] = useState<ChristmasConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    setConfig(loadConfig());
    setIsLoaded(true);

    // Register service worker for caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Auto-load ornament images from API
  useEffect(() => {
    const fetchOrnaments = async () => {
      try {
        const response = await fetch("/api/ornaments");
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          setConfig((prev) => ({
            ...prev,
            ornamentImages: data.files,
            // Set letterCount to show all ornaments by default
            letterCount: data.files.length,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch ornaments:", error);
      }
    };
    fetchOrnaments();
  }, []);

  // Save config whenever it changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveConfig(config);
    }
  }, [config, isLoaded]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Hand control state
  const [handControlEnabled, setHandControlEnabled] = useState(false);
  // Snow drawing mode
  const [drawMode, setDrawMode] = useState(false);
  const [externalZoom, setExternalZoom] = useState<number | undefined>();
  const [externalRotation, setExternalRotation] = useState<{ x: number; y: number } | undefined>();
  const [externalTap, setExternalTap] = useState<{ x: number; y: number } | null>(null);

  const handleHandZoom = useCallback((delta: number) => {
    setExternalZoom(Date.now() + delta); // Use timestamp to trigger update
  }, []);

  const handleHandDrag = useCallback((deltaX: number, deltaY: number) => {
    setExternalRotation({ x: deltaX, y: deltaY });
  }, []);

  const handleHandTap = useCallback((x: number, y: number) => {
    setExternalTap({ x, y });
    // Reset tap after a short delay
    setTimeout(() => setExternalTap(null), 100);
  }, []);

  const handleOrnamentClick = useCallback((imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Try to autoplay music, if blocked then play on first user interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Try autoplay
    const tryPlay = () => {
      audio.play().then(() => {
        setIsPlaying(true);
        removeListeners();
      }).catch(() => {
        // Autoplay blocked - will play on user interaction
      });
    };

    // Play on any user interaction
    const playOnInteraction = () => {
      if (audio.paused) {
        audio.play().then(() => {
          setIsPlaying(true);
          removeListeners();
        }).catch(() => {});
      }
    };

    const removeListeners = () => {
      document.removeEventListener('click', playOnInteraction);
      document.removeEventListener('touchstart', playOnInteraction);
      document.removeEventListener('keydown', playOnInteraction);
      document.removeEventListener('wheel', playOnInteraction);
      document.removeEventListener('mousemove', playOnInteraction);
    };

    // Add listeners for user interaction
    document.addEventListener('click', playOnInteraction, { once: true });
    document.addEventListener('touchstart', playOnInteraction, { once: true });
    document.addEventListener('keydown', playOnInteraction, { once: true });
    document.addEventListener('wheel', playOnInteraction, { once: true });
    document.addEventListener('mousemove', playOnInteraction, { once: true });

    // Try autoplay after a short delay
    setTimeout(tryPlay, 500);

    return () => removeListeners();
  }, []);

  // Handle music track change
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.src = config.musicTrack;
      audioRef.current.play().catch(() => {});
    }
  }, [config.musicTrack, isPlaying]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <main
      className="w-screen h-screen overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: config.backgroundColor }}
    >
      {/* Three.js Canvas */}
      <ChristmasTree
        config={config}
        onOrnamentClick={handleOrnamentClick}
        externalZoom={externalZoom}
        externalRotation={externalRotation}
        externalTap={externalTap}
        disableInteraction={drawMode}
      />

      {/* Snow Drawing Canvas */}
      <SnowCanvas enabled={drawMode} />

      {/* Typing Message */}
      <TypingMessage />

      {/* Background Music */}
      <audio
        ref={audioRef}
        src={config.musicTrack}
        loop
        className="hidden"
      />
      <button
        onClick={toggleMusic}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-black/50 border border-white/20 text-2xl hover:bg-white/20 transition-colors"
      >
        {isPlaying ? "🔊" : "🔇"}
      </button>

      {/* Config Panel */}
      <ConfigPanel
        config={config}
        onChange={setConfig}
        cameraEnabled={handControlEnabled}
        onCameraToggle={() => setHandControlEnabled(!handControlEnabled)}
        drawMode={drawMode}
        onDrawModeToggle={() => setDrawMode(!drawMode)}
      />

      {/* Hand Control */}
      {handControlEnabled && (
        <HandControl
          enabled={handControlEnabled}
          onToggle={() => setHandControlEnabled(!handControlEnabled)}
          onZoom={handleHandZoom}
          onDrag={handleHandDrag}
          onTap={handleHandTap}
        />
      )}

      {/* Media Modal */}
      <MediaModal src={selectedImage} onClose={closeModal} />
    </main>
  );
}
