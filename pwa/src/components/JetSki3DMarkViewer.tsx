'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export interface MarkPoint { id: number; pos: [number, number, number] }

class ModelErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error)
      return (
        <div className="flex items-center justify-center h-full text-sm text-gray-400 bg-gray-900 rounded-2xl">
          Modelo 3D não disponível
        </div>
      );
    return this.props.children;
  }
}

function ViewerScene({ marks, markColor = '#ef4444', secondaryMarks = [], secondaryMarkColor = '#ff6600', onReady }: { marks: MarkPoint[]; markColor?: string; secondaryMarks?: MarkPoint[]; secondaryMarkColor?: string; onReady?: () => void }) {
  const { scene } = useGLTF('/jetski.glb');
  const { camera, controls } = useThree();
  const markRadius = useRef(0.03);
  const notified = useRef(false);

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

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const diag = size.length();
    if (diag > 0) markRadius.current = diag * 0.012;

    const cam = camera as THREE.PerspectiveCamera;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    const fitDist = Math.max(
      (size.x / 2) / Math.tan(hFov / 2),
      (size.z / 2) / Math.tan(vFov / 2),
    ) * 1.1;
    cam.position.set(center.x, center.y + fitDist * 0.96, center.z + fitDist * 0.12);
    cam.lookAt(center);
    cam.near = fitDist * 0.001;
    cam.far = fitDist * 50;
    cam.updateProjectionMatrix();
    const ctrl = controls as any;
    if (ctrl?.target) { ctrl.target.copy(center); ctrl.update(); }
    if (!notified.current) { notified.current = true; onReady?.(); }
  }, [cloned, camera, controls, onReady]);

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} />
      <OrbitControls makeDefault />
      <Suspense fallback={null}>
        <primitive object={cloned} />
        {marks.map(m => (
          <mesh key={`p-${m.id}`} position={m.pos} renderOrder={999}>
            <sphereGeometry args={[markRadius.current, 8, 8]} />
            <meshBasicMaterial color={markColor} depthTest={false} />
          </mesh>
        ))}
        {secondaryMarks.map(m => (
          <mesh key={`s-${m.id}`} position={m.pos} renderOrder={999}>
            <sphereGeometry args={[markRadius.current, 8, 8]} />
            <meshBasicMaterial color={secondaryMarkColor} depthTest={false} />
          </mesh>
        ))}

      </Suspense>
    </>
  );
}

/** Read-only interactive 3D viewer that renders saved mark positions. */
export default function JetSki3DMarkViewer({
  marksJson,
  height = 260,
  markColor,
  secondaryMarksJson,
  secondaryMarkColor,
}: {
  marksJson?: string | null;
  height?: number;
  markColor?: string;
  secondaryMarksJson?: string | null;
  secondaryMarkColor?: string;
}) {
  let marks: MarkPoint[] = [];
  if (marksJson) {
    try { marks = JSON.parse(marksJson); } catch { /* ignore */ }
  }
  let secondaryMarks: MarkPoint[] = [];
  if (secondaryMarksJson) {
    try { secondaryMarks = JSON.parse(secondaryMarksJson); } catch { /* ignore */ }
  }
  const totalMarks = marks.length + secondaryMarks.length;

  // Delay Canvas mount by one frame so container has proper dimensions
  const [ready, setReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing"
      style={{ height, touchAction: 'none' }}>
      <ModelErrorBoundary>
        {ready && (
        <Canvas
          camera={{ position: [0, 10, 1], fov: 45 }}
          gl={{ preserveDrawingBuffer: true, alpha: false }}
          style={{ background: '#0d1b35', width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            <ViewerScene marks={marks} markColor={markColor} secondaryMarks={secondaryMarks} secondaryMarkColor={secondaryMarkColor} onReady={() => setModelLoaded(true)} />
          </Suspense>
        </Canvas>
        )}
      </ModelErrorBoundary>
      {ready && !modelLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1b35] z-10">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
      {totalMarks > 0 && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg pointer-events-none">
          {totalMarks} avaria{totalMarks !== 1 ? 's' : ''} marcada{totalMarks !== 1 ? 's' : ''}
        </div>
      )}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-lg pointer-events-none">
        Arraste para girar
      </div>
    </div>
  );
}

useGLTF.preload('/jetski.glb');
