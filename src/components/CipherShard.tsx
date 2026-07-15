import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { Icosahedron, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface CipherShardProps {
  intensity?: number; // 0 to 1 scaling based on text
  isCracked?: boolean;
  isHero?: boolean;
}

function Particles({ count = 500, isHero = false }) {
  const points = useRef<THREE.Points>(null);
  
  const actualCount = useMemo(() => {
    if (typeof window === 'undefined') return count;
    const isMobile = window.innerWidth < 768 || /iPhone|iPad|iPod/.test(navigator.userAgent);
    // Reduce particle count specifically on mobile by 70%
    return isMobile ? Math.floor(count * 0.3) : count;
  }, [count]);

  const [positions, setPositions] = useState(() => new Float32Array(actualCount * 3));
  
  useEffect(() => {
    const newPositions = new Float32Array(actualCount * 3);
    for (let i = 0; i < actualCount; i++) {
      newPositions[i * 3] = (Math.random() - 0.5) * 10;
      newPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      newPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    setPositions(newPositions);
  }, [actualCount]);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.05;
      points.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#7C5CFF" size={0.05} sizeAttenuation={true} depthWrite={false} />
    </Points>
  );
}

export default function CipherShard({ intensity = 0, isCracked = false, isHero = false }: CipherShardProps) {
  const group = useRef<THREE.Group>(null);
  const coreMesh = useRef<THREE.Mesh>(null);
  const shellMesh = useRef<THREE.Mesh>(null);
  
  const prefersReducedMotion = useReducedMotion();
  const hovered = useRef(false);
  
  const currentScale = useRef(1);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);
  
  const lightIntensity = useMemo(() => {
    return 1 + intensity * 5; // Maps 0-1 to 1-6
  }, [intensity]);

  useFrame((state, delta) => {
    if (!prefersReducedMotion && group.current) {
      if (isHero) {
        group.current.rotation.y += delta * 0.1;
      } else {
        group.current.rotation.y += delta * 0.05;
      }
    }
    
    // Animate scale/crack
    if (shellMesh.current && !prefersReducedMotion) {
      const targetScale = isCracked || hovered.current ? 1.1 : 1;
      currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, 0.1);
      
      if (isCracked) {
        // Expand and rotate pieces if cracked
        shellMesh.current.scale.setScalar(currentScale.current);
        shellMesh.current.rotation.x += delta * 0.5;
        shellMesh.current.rotation.y += delta * 0.5;
        (shellMesh.current.material as THREE.MeshPhysicalMaterial).opacity = Math.max(0, 1 - (currentScale.current - 1) * 2);
      } else {
        // Just scale slightly on hover
        shellMesh.current.scale.setScalar(currentScale.current);
        (shellMesh.current.material as THREE.MeshPhysicalMaterial).opacity = 0.8;
      }
      
      if (coreMaterial.current) {
        coreMaterial.current.color.set(hovered.current || isCracked ? "#5EEAD4" : "#7C5CFF");
      }
    }
  });

  return (
    <group ref={group} dispose={null}>
      <pointLight position={[0, 0, 0]} color="#7C5CFF" intensity={lightIntensity} distance={5} />
      
      {/* Core glowing element */}
      <Icosahedron ref={coreMesh} args={[1, 0]} scale={0.8}>
        <meshBasicMaterial ref={coreMaterial} color="#7C5CFF" wireframe />
      </Icosahedron>
      
      {/* Outer shell */}
      <Icosahedron 
        ref={shellMesh} 
        args={[1.2, 0]} 
        onPointerOver={(e) => { e.stopPropagation(); hovered.current = true; }}
        onPointerOut={(e) => { hovered.current = false; }}
      >
        <meshPhysicalMaterial 
          color="#0A0B0F"
          emissive="#7C5CFF"
          emissiveIntensity={0.1}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.8}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </Icosahedron>

      {/* Particles only for hero or specific states */}
      {(isHero || intensity > 0.5) && !prefersReducedMotion && (
        <Particles count={isHero ? 150 : 50} isHero={isHero} />
      )}
    </group>
  );
}
