import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useLocation } from 'react-router';

// Create a stable random array for points
const generateParticles = (count: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Distribute in a large volume
    positions[i * 3] = (Math.random() - 0.5) * 20; // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2; // z (slightly pushed back)
  }
  return positions;
};

const ParticleField = ({ count = 400, color = "#7C5CFF", size = 0.05, speed = 1 }) => {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => generateParticles(count), [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    
    // Parallax effect with scroll
    const scrollY = window.scrollY;
    
    // Slight continuous rotation
    ref.current.rotation.y = time * 0.05 * speed;
    ref.current.rotation.x = time * 0.02 * speed;

    // Shift Y based on scroll (parallax)
    // We adjust position.y. Because it's fixed, we move it opposite to scroll
    ref.current.position.y = scrollY * 0.002 * speed;
    
    // Cursor reaction
    const mouseX = (state.pointer.x * state.viewport.width) / 2;
    const mouseY = (state.pointer.y * state.viewport.height) / 2;
    
    // Subtly move entire particle field towards mouse
    ref.current.position.x += (mouseX * 0.1 - ref.current.position.x) * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

export const AmbientBackground = () => {
  const location = useLocation();
  
  // Don't render on message view page to save resources and keep it simple
  if (location.pathname.startsWith('/msg/')) return null;

  // iOS check
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  // Prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isIOS || prefersReducedMotion) {
    return null; // Don't render WebGL background on iOS or reduced motion
  }

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-ink">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]}>
        <ParticleField count={300} color="#7C5CFF" size={0.04} speed={0.8} />
        <ParticleField count={150} color="#5EEAD4" size={0.06} speed={1.2} />
      </Canvas>
    </div>
  );
};
