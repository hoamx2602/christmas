"use client";

import { useState, useEffect } from "react";

// const message = `Giáng sinh năm nay, bố không ở cùng 2 mẹ con được, yêu 2 mẹ con nhiều, bố hi vọng một ngày nào đó về bố sẽ bù đắp cho 2 mẹ con.
const message = `Giáng sinh năm nay, bố không thể ở bên cạnh hai mẹ con. Dù khoảng cách có xa, nhưng tình yêu bố dành cho hai mẹ con thì chưa bao giờ vơi đi. Trong mỗi khoảnh khắc, mỗi ngày trôi qua, bố luôn nghĩ về hai mẹ con với tất cả sự yêu thương đặc biệt nhất.

Bố biết bản thân chưa tốt, chưa thể bù đắp trọn vẹn cho những hy sinh thầm lặng của mẹ và những thiệt thòi của con. Nhưng bố luôn tin rằng, bố có thể cố gắng, dùng sự yêu thương và trách nhiệm của mình để bù đắp cho hai mẹ con.

Mong rằng trong mùa Giáng sinh ấm áp này, hai mẹ con luôn mạnh khỏe, bình an và cảm nhận được tình yêu của bố, dù bố không ở bên.
Chúc hai mẹ con một mùa Giáng sinh an lành, hạnh phúc và tràn đầy yêu thương. Bố yêu 2 mẹ con nhiều!`;

export default function TypingMessage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < message.length) {
      const timeout = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 80);

      return () => clearTimeout(timeout);
    } else {
      // Wait 10 seconds before restarting
      const timeout = setTimeout(() => {
        setCurrentIndex(0);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  const displayedText = message.slice(0, currentIndex);
  const isComplete = currentIndex >= message.length;

  return (
    <div className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 z-30 max-w-[350px] md:max-w-[450px] pointer-events-none">
      <div
        className="text-xl md:text-2xl leading-relaxed font-medium"
        style={{
          fontFamily: "var(--font-handwriting), 'Dancing Script', cursive",
          color: "#ffd700",
          textShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
          whiteSpace: "pre-wrap",
          willChange: "contents",
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
