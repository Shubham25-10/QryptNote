import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  className?: string;
  onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  className = '',
  onComplete,
}) => {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!text) {
      setDisplayedLength(0);
      setIsTyping(false);
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);

    const totalLength = text.length;
    // Target duration around 0.8s to 1.6s max for dynamic response
    const targetDurationMs = Math.min(1600, Math.max(500, totalLength * 12));
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / targetDurationMs);
      
      // Gentle ease-out for natural cinematic typing feel
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      const nextLength = Math.min(totalLength, Math.floor(easedProgress * totalLength));
      
      setDisplayedLength(nextLength);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedLength(totalLength);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text, onComplete]);

  const handleSkip = () => {
    if (isTyping) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setDisplayedLength(text.length);
      setIsTyping(false);
      if (onComplete) onComplete();
    }
  };

  const displayedText = text.slice(0, displayedLength);

  return (
    <span className={`relative cursor-pointer ${className}`} onClick={handleSkip} title={isTyping ? "Click to reveal full text instantly" : undefined}>
      {displayedText}
      {isTyping && (
        <span
          className="inline-block w-2.5 h-5 ml-1 bg-violet align-middle animate-pulse shadow-[0_0_10px_rgba(239,35,60,0.8)] rounded-xs"
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export default TypewriterText;
