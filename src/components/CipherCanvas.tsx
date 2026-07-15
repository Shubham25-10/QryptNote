import { ScrollCamera } from './ScrollCamera';
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import CipherShard from './CipherShard';
import { Loader2 } from 'lucide-react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Three.js canvas error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface CipherCanvasProps {

  intensity?: number;
  isCracked?: boolean;
  isHero?: boolean;
  className?: string;
  scrollCamera?: boolean;
}

export default function CipherCanvas({ intensity = 0, isCracked = false, isHero = false, className = '', scrollCamera = false }: CipherCanvasProps) {
  const isIOS = typeof navigator !== 'undefined' ? /iPad|iPhone|iPod/.test(navigator.userAgent) : false;
  
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [useStaticFallback, setUseStaticFallback] = useState(false);

  useEffect(() => {
    if (isIOS) return; // Don't even try to check WebGL if it's iOS
    
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGLSupported(false);
    } catch (e) {
      setWebGLSupported(false);
    }
  }, [isIOS]);

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    console.warn('WebGL context lost, showing fallback');
    setUseStaticFallback(true);
  };

  const showFallback = isIOS || !webGLSupported || useStaticFallback;

  if (showFallback) {
    const baseGlow = 0.5 + Math.min(intensity, 1) * 0.5;
    const dropShadow = `drop-shadow(0 0 ${10 + intensity * 20}px rgba(124,92,255, ${baseGlow}))`;
    const transform = isCracked ? 'scale(1.1) rotate(15deg)' : 'scale(1) rotate(0deg)';
    
    return (
      <div className={`flex items-center justify-center w-full h-full ${className}`}>
        <svg 
          width={isHero ? "200" : "120"} 
          height={isHero ? "200" : "120"} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#7C5CFF" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ 
            opacity: baseGlow, 
            filter: dropShadow,
            transform: transform,
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: isCracked ? 'none' : 'shard-pulse 4s ease-in-out infinite'
          }}
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.29 7.09 12 12.09 20.71 7.09"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>
    );
  }

  const pixelRatio = typeof window !== 'undefined' 
    ? Math.min(window.devicePixelRatio, 2)
    : 2;

  return (
    <div className={className}>
      <ErrorBoundary fallback={
        <div className={`flex items-center justify-center w-full h-full`}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#7C5CFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.29 7.09 12 12.09 20.71 7.09"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
      }>
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-violet animate-spin opacity-50" /></div>}>
          <Canvas 
            camera={{ position: [0, 0, 5], fov: 45 }} 
            dpr={[1, pixelRatio]}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#5EEAD4" />
            <directionalLight position={[-10, -10, 5]} intensity={0.5} color="#7C5CFF" />
            {scrollCamera && <ScrollCamera />}
            <CipherShard intensity={intensity} isCracked={isCracked} isHero={isHero} />
            <Environment preset="city" />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
