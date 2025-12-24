"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import ConfigPanel from "@/components/ConfigPanel";
import TypingMessage from "@/components/TypingMessage";
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

  const handleOrnamentClick = useCallback((imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Handle music track change
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = isPlaying;
      audioRef.current.src = config.musicTrack;
      if (wasPlaying) {
        audioRef.current.play().catch(() => {});
      }
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
      <ChristmasTree config={config} onOrnamentClick={handleOrnamentClick} />

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
      <ConfigPanel config={config} onChange={setConfig} />

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Golden Frame */}
            <div className="p-3 md:p-4 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-400 rounded-lg shadow-[0_0_40px_rgba(255,215,0,0.5)]">
              <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px] bg-gray-900 rounded overflow-hidden">
                <Image
                  src={selectedImage}
                  alt="Ornament photo"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback for missing images
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                {/* Placeholder if image fails */}
                <div className="absolute inset-0 flex items-center justify-center text-white/60">
                  <div className="text-center p-4">
                    <p className="text-yellow-400 text-lg mb-2">Photo</p>
                    <p className="text-sm">Add your image at:</p>
                    <p className="text-xs mt-1 font-mono">{selectedImage}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
