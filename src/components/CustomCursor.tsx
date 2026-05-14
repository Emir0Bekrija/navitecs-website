"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const visibilitySetRef = useRef(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 600, mass: 0.1 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Skip entirely on touch devices — cursor is invisible there
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window
    ) {
      setIsTouchDevice(true);
      return;
    }

    cursorX.set(window.innerWidth / 2);
    cursorY.set(window.innerHeight / 2);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // One-time visibility flip — avoids checking on every mousemove
      if (!visibilitySetRef.current) {
        visibilitySetRef.current = true;
        setIsVisible(true);
      }
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  const maskImage = useMotionTemplate`radial-gradient(circle 400px at ${cursorXSpring}px ${cursorYSpring}px, black 0%, rgba(0,0,0,0.1) 100%)`;

  // Don't render anything on touch devices
  if (isTouchDevice) return null;

  const animPlayState = isVisible ? "running" : "paused";

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ contain: "strict" }}
    >
      <motion.div
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      >
        <div
          className="absolute inset-0 w-[200vw] h-[200vh] -left-[50vw] -top-[50vh]"
          style={{
            backgroundImage: `
                linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)
              `,
            backgroundSize: "64px 64px, 64px 64px, 16px 16px, 16px 16px",
            animation: "cursor-grid-scroll 4s linear infinite",
            animationPlayState: animPlayState,
            willChange: "background-position",
          }}
        />

        <div
          className="absolute top-1/2 left-1/2 w-[2400px] h-[2400px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center mix-blend-screen"
          style={{
            animation: "cursor-spin 480s linear infinite",
            animationPlayState: animPlayState,
            willChange: "transform",
          }}
        >
          <div className="absolute w-[1200px] h-[1200px] border-[2px] border-white/30 rounded-full" />
          <div className="absolute w-[800px] h-[800px] border border-dashed border-white/80 rounded-full" />
          <div className="absolute w-full h-[2px] bg-white/30" />
          <div className="absolute w-[2px] h-full bg-white/30" />
        </div>
      </motion.div>
    </div>
  );
}
