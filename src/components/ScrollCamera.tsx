import { useFrame } from '@react-three/fiber';
import { useEffect, useState } from 'react';

export const ScrollCamera = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state) => {
    // Push camera forward and rotate slightly based on scroll
    // Max scroll effect at around 1000px
    const progress = Math.min(scrollY / 1000, 1);
    
    // Base position is [0, 0, 5]
    // Move forward to [0, -1, 3]
    state.camera.position.z = 5 - progress * 2;
    state.camera.position.y = -progress * 1;
    
    // Slight rotation to look at the shard while passing
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};
