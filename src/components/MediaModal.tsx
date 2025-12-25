"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface MediaModalProps {
  src: string | null;
  onClose: () => void;
}

export default function MediaModal({ src, onClose }: MediaModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isVideo = src ? /\.(mp4|webm|mov)$/i.test(src) : false;

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isFullscreen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isFullscreen]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className={`relative animate-in zoom-in-95 duration-300 ${isFullscreen ? "w-screen h-screen bg-black" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isFullscreen ? (
          // Fullscreen mode - no frame
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? (
              <video
                src={src}
                autoPlay
                loop
                controls
                playsInline
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <img
                src={src}
                alt="Photo"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        ) : (
          // Normal mode - golden frame
          <div className="p-3 md:p-4 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-400 rounded-lg shadow-[0_0_60px_rgba(255,215,0,0.6)]">
            <div className="bg-gray-900 rounded overflow-hidden">
              {isVideo ? (
                <video
                  src={src}
                  autoPlay
                  loop
                  controls
                  playsInline
                  className="max-w-[85vw] max-h-[80vh] min-w-[300px] min-h-[200px]"
                />
              ) : (
                <img
                  src={src}
                  alt="Photo"
                  className="max-w-[85vw] max-h-[80vh] min-w-[300px] min-h-[200px] object-contain"
                />
              )}
            </div>
          </div>
        )}

        {/* Control buttons */}
        {!isFullscreen && (
          <>
            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="absolute -top-3 -left-3 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
              title="Fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
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
          </>
        )}

        {/* Exit fullscreen button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
