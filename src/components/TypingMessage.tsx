"use client";

import { useState, useEffect } from "react";

const message = `Giáng sinh năm nay, bố không ở cùng 2 mẹ con được, yêu 2 mẹ con nhiều, bố hi vọng một ngày nào đó về bố sẽ bù đắp cho 2 mẹ con.

Chúc 2 mẹ con giáng sinh vui vẻ!`;

export default function TypingMessage() {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + message[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 80); // Speed of typing

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex]);

  // Restart animation after completion
  useEffect(() => {
    if (isComplete) {
      const timeout = setTimeout(() => {
        setDisplayedText("");
        setCurrentIndex(0);
        setIsComplete(false);
      }, 10000); // Wait 10 seconds before restarting

      return () => clearTimeout(timeout);
    }
  }, [isComplete]);

  return (
    <div className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 z-30 max-w-[260px] md:max-w-[300px] pointer-events-none">
      <div
        className="text-xl md:text-2xl leading-relaxed font-medium"
        style={{
          fontFamily: "var(--font-caveat), 'Caveat', cursive",
          color: "#ffd700",
          textShadow: "0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4), 0 0 45px rgba(255, 215, 0, 0.2)",
          whiteSpace: "pre-wrap",
        }}
      >
        {displayedText}
        {!isComplete && (
          <span className="animate-pulse text-white">|</span>
        )}
      </div>
    </div>
  );
}
