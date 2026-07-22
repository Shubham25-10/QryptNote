import { motion, useScroll, useSpring } from "motion/react";
import { RefObject } from "react";

interface ScrollJourneyLineProps {
  containerRef: RefObject<HTMLElement | null>;
}

export function ScrollJourneyLine({ containerRef }: ScrollJourneyLineProps) {
  // Track scroll position of the section relative to the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef as any,
    offset: ["start end", "end start"],
  });

  // Smooth out the scroll progress using a spring
  const pathLength = useSpring(scrollYProgress, {
    damping: 35,
    stiffness: 80,
    restDelta: 0.001,
  });

  // Desktop path: Gracefully curves and snakes behind the three columns
  const desktopPath = "M 16 0 C 16 22, 20 22, 20 40 C 20 54, 50 46, 50 60 C 50 74, 80 66, 80 80 C 80 94, 84 94, 84 100";

  // Mobile path: A gentle vertical snake line that fits vertical card stacks
  const mobilePath = "M 50 0 C 40 18, 40 18, 40 32 C 40 46, 60 46, 60 60 C 60 74, 40 74, 40 84 C 40 94, 50 94, 50 100";

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* SVG Filters and Gradients */}
      <svg className="hidden">
        <defs>
          <linearGradient id="journey-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7C5CFF" /> {/* Violet */}
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#5EEAD4" /> {/* Teal */}
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Desktop Journey Line */}
      <svg
        className="hidden md:block absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* 1. Ghost/Background Path - shows the complete potential path in a subtle gray */}
        <path
          d={desktopPath}
          fill="none"
          stroke="#1F2937"
          strokeWidth={2}
          strokeOpacity={0.4}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />

        {/* 2. Soft Glowing Aura - drawn on scroll */}
        <motion.path
          d={desktopPath}
          fill="none"
          stroke="url(#journey-grad)"
          strokeWidth={8}
          strokeOpacity={0.25}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          style={{ pathLength }}
        />

        {/* 3. Sharp Foreground Path - drawn on scroll */}
        <motion.path
          d={desktopPath}
          fill="none"
          stroke="url(#journey-grad)"
          strokeWidth={2.5}
          strokeOpacity={0.9}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          style={{ pathLength }}
        />

        {/* 4. Animated Flowing Data Packets - dashed line that translates infinitely */}
        <motion.path
          d={desktopPath}
          fill="none"
          stroke="url(#journey-grad)"
          strokeWidth={3}
          strokeOpacity={1}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeDasharray="8 16"
          animate={{ strokeDashoffset: [0, -48] }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear",
          }}
          style={{ pathLength }}
        />
      </svg>

      {/* Mobile Journey Line */}
      <svg
        className="block md:hidden absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* 1. Ghost/Background Path */}
        <path
          d={mobilePath}
          fill="none"
          stroke="#1F2937"
          strokeWidth={2}
          strokeOpacity={0.4}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />

        {/* 2. Soft Glowing Aura */}
        <motion.path
          d={mobilePath}
          fill="none"
          stroke="url(#journey-grad)"
          strokeWidth={6}
          strokeOpacity={0.2}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          style={{ pathLength }}
        />

        {/* 3. Sharp Foreground Path */}
        <motion.path
          d={mobilePath}
          fill="none"
          stroke="url(#journey-grad)"
          strokeWidth={2}
          strokeOpacity={0.9}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          style={{ pathLength }}
        />

        {/* 4. Animated Flowing Data Packets */}
        <motion.path
          d={mobilePath}
          fill="none"
          stroke="url(#journey-grad)"
          strokeWidth={2.5}
          strokeOpacity={1}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeDasharray="6 12"
          animate={{ strokeDashoffset: [0, -36] }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "linear",
          }}
          style={{ pathLength }}
        />
      </svg>
    </div>
  );
}
