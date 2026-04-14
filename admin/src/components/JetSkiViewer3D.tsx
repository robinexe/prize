'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function JetSkiModelAuto() {
  const { scene } = useGLTF('/jetski.glb', true);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child: any) => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m: THREE.Material) => {
            const mc = m.clone();
            mc.needsUpdate = true;
            return mc;
          });
        } else {
          child.material = child.material.clone();
          child.material.needsUpdate = true;
        }
      }
    });
    return c;
  }, [scene]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}

function JetSkiModelStatic() {
  const { scene } = useGLTF('/jetski.glb', true);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child: any) => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m: THREE.Material) => {
            const mc = m.clone();
            mc.needsUpdate = true;
            return mc;
          });
        } else {
          child.material = child.material.clone();
          child.material.needsUpdate = true;
        }
      }
    });
    return c;
  }, [scene]);
  return <primitive object={cloned} />;
}

export default function JetSkiViewer3D({ interactive }: { interactive?: boolean } = {}) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 4], fov: 45 }}
      style={{ background: 'transparent', ...(interactive ? {} : { pointerEvents: 'none' }) }}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-5, 3, -3]} intensity={0.5} />
      <Suspense fallback={null}>
        {interactive ? <JetSkiModelStatic /> : <JetSkiModelAuto />}
        <ContactShadows position={[0, -0.8, 0]} opacity={0.4} scale={8} blur={2} />
        <Environment preset="dawn" />
      </Suspense>
      {interactive && <OrbitControls enablePan={false} minDistance={2} maxDistance={8} />}
    </Canvas>
  );
}
