'use client';

import { Component, Suspense, forwardRef, useImperativeHandle, useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ── Public ref type ──────────────────────────────────────────────────────── */
export interface JetSki3DSketchRef {
  getSketchUrl: () => string;
  getMarks: () => Mark[];
  clearMarks: () => void;
}

type DrawMode = 'view' | 'draw' | 'erase';
interface Mark { id: number; pos: [number, number, number] }

/** Existing marks loaded as read-only reference (e.g., from launch checklist) */
export interface InitialMark { id: number; pos: [number, number, number] }

/* ── Error boundary ───────────────────────────────────────────────────────── */
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

/* ── Inner 3D scene ───────────────────────────────────────────────────────── */
function SketchScene({
  drawMode,
  marks,
  setMarks,
  captureFnRef,
  fillHeight,
  initialMarks,
  markColor,
}: {
  drawMode: DrawMode;
  marks: Mark[];
  setMarks: React.Dispatch<React.SetStateAction<Mark[]>>;
  captureFnRef: React.MutableRefObject<() => string>;
  fillHeight?: boolean;
  initialMarks?: InitialMark[];
  markColor?: string;
}) {
  const { scene: originalScene } = useGLTF('/jetski.glb');
  const model = useMemo(() => {
    const c = originalScene.clone(true);
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
  }, [originalScene]);
  const { gl, scene, camera, raycaster, controls } = useThree();
  const isDown = useRef(false);
  const markRadius = useRef(0.03);
  const eraseRadius = useRef(0.12);
  const idCounter = useRef(0);
  const drawModeRef = useRef(drawMode);
  drawModeRef.current = drawMode;

  // Store default camera position for standardized screenshots
  const defaultCamPos = useRef(new THREE.Vector3());
  const defaultCamTarget = useRef(new THREE.Vector3());

  // Scale mark size to model bounding box AND auto-fit camera (top-down view)
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const diag = size.length();
    if (diag > 0) {
      markRadius.current = diag * 0.012;
      eraseRadius.current = diag * 0.05;
    }

    // Fit camera to show entire model from top-down
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    // In portrait/fillHeight: canvas is tall, so fit x in horizontal FOV and z in vertical FOV
    // In landscape: also guard z fitting horizontally to avoid tiny model
    const fitDist = fillHeight
      ? Math.max(
          (size.x / 2) / Math.tan(hFov / 2),
          (size.z / 2) / Math.tan(vFov / 2),
        ) * 0.88
      : Math.max(
          (size.x / 2) / Math.tan(hFov / 2),
          (size.z / 2) / Math.tan(hFov / 2),
          (size.z / 2) / Math.tan(vFov / 2),
        ) * 1.3;
    cam.position.set(center.x, center.y + fitDist * 0.96, center.z + fitDist * 0.12);
    cam.lookAt(center);
    cam.near = fitDist * 0.001;
    cam.far = fitDist * 50;
    cam.updateProjectionMatrix();
    const ctrl = controls as any;
    if (ctrl?.target) { ctrl.target.copy(center); ctrl.update(); }

    // Save default camera state for standardized screenshots
    defaultCamPos.current.copy(cam.position);
    defaultCamTarget.current.copy(center);
  }, [model, camera, controls, fillHeight]);

  // Register capture function — resets camera to default top-down view
  useEffect(() => {
    captureFnRef.current = () => {
      const cam = camera as THREE.PerspectiveCamera;
      const ctrl = controls as any;

      // Save current user camera state
      const userPos = cam.position.clone();
      const userTarget = ctrl?.target ? ctrl.target.clone() : new THREE.Vector3();

      // Reset to default top-down position
      cam.position.copy(defaultCamPos.current);
      cam.lookAt(defaultCamTarget.current);
      cam.updateProjectionMatrix();
      if (ctrl?.target) { ctrl.target.copy(defaultCamTarget.current); ctrl.update(); }

      // Render at default position
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL('image/jpeg', 0.92);

      // Restore user camera position
      cam.position.copy(userPos);
      cam.lookAt(userTarget);
      cam.updateProjectionMatrix();
      if (ctrl?.target) { ctrl.target.copy(userTarget); ctrl.update(); }

      return dataUrl;
    };
  }, [gl, scene, camera, controls, captureFnRef]);

  // Pointer event handlers directly on the WebGL canvas DOM element
  useEffect(() => {
    const el = gl.domElement;

    const getHit = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      return raycaster.intersectObject(model, true)[0] ?? null;
    };

    const addMark = (hit: THREE.Intersection) => {
      let pos: [number, number, number] = [hit.point.x, hit.point.y, hit.point.z];
      if (hit.face) {
        const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
        const r = markRadius.current * 0.6;
        pos = [hit.point.x + n.x * r, hit.point.y + n.y * r, hit.point.z + n.z * r];
      }
      setMarks(prev => {
        const last = prev[prev.length - 1];
        if (last) {
          const dx = last.pos[0] - pos[0];
          const dy = last.pos[1] - pos[1];
          const dz = last.pos[2] - pos[2];
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) < markRadius.current * 0.5) return prev;
        }
        return [...prev, { id: ++idCounter.current, pos }];
      });
    };

    const eraseMark = (hit: THREE.Intersection) => {
      const pt = hit.point;
      const r = eraseRadius.current;
      setMarks(prev => prev.filter(m => {
        const dx = m.pos[0] - pt.x, dy = m.pos[1] - pt.y, dz = m.pos[2] - pt.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz) > r;
      }));
    };

    const onDown = (e: PointerEvent) => {
      if (drawModeRef.current === 'view') return;
      isDown.current = true;
      try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
      const hit = getHit(e.clientX, e.clientY);
      if (!hit) return;
      if (drawModeRef.current === 'draw') addMark(hit);
      else if (drawModeRef.current === 'erase') eraseMark(hit);
    };

    const onMove = (e: PointerEvent) => {
      if (!isDown.current || drawModeRef.current === 'view') return;
      const hit = getHit(e.clientX, e.clientY);
      if (!hit) return;
      if (drawModeRef.current === 'draw') addMark(hit);
      else if (drawModeRef.current === 'erase') eraseMark(hit);
    };

    const onUp = () => { isDown.current = false; };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [gl, raycaster, camera, model, setMarks]);

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} />
      <OrbitControls makeDefault enabled={drawMode === 'view'} />
      <Suspense fallback={null}>
        <primitive object={model} />
        {/* Initial marks (read-only, red) */}
        {initialMarks?.map(m => (
          <mesh key={`init-${m.id}`} position={m.pos} renderOrder={998}>
            <sphereGeometry args={[markRadius.current, 8, 8]} />
            <meshBasicMaterial color="#ef4444" depthTest={false} />
          </mesh>
        ))}
        {/* New marks (editable, custom color or red) */}
        {marks.map(m => (
          <mesh key={m.id} position={m.pos} renderOrder={999}>
            <sphereGeometry args={[markRadius.current, 8, 8]} />
            <meshBasicMaterial color={markColor || '#ef4444'} depthTest={false} />
          </mesh>
        ))}

      </Suspense>
    </>
  );
}

/* ── Loading fallback ─────────────────────────────────────────────────────── */
function LoadingModel() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#0d1b35]">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-gray-400">Carregando modelo 3D…</p>
    </div>
  );
}

/* ── Public component ─────────────────────────────────────────────────────── */
const JetSki3DSketch = forwardRef<JetSki3DSketchRef, { fillHeight?: boolean; initialMarks?: InitialMark[]; markColor?: string }>(({ fillHeight, initialMarks, markColor }, ref) => {
  const [drawMode, setDrawMode] = useState<DrawMode>('view');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loaded, setLoaded] = useState(false);
  const captureFn = useRef<() => string>(() => '');

  useImperativeHandle(ref, () => ({
    getSketchUrl: () => captureFn.current(),
    getMarks: () => marks,
    clearMarks: () => setMarks([]),
  }));

  const cursorClass =
    drawMode === 'view' ? 'cursor-grab active:cursor-grabbing' :
    drawMode === 'draw' ? 'cursor-crosshair' : 'cursor-cell';

  const btnBase = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all';
  const btnInactive = 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <div className={fillHeight ? 'h-full flex flex-col min-h-0' : 'space-y-2'}>
      {/* Mode controls */}
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={() => setDrawMode('view')}
          className={`${btnBase} ${drawMode === 'view' ? 'bg-blue-500 border-blue-500 text-white' : btnInactive}`}>
          🔄 Girar
        </button>
        <button onClick={() => setDrawMode('draw')}
          className={`${btnBase} ${drawMode === 'draw' ? (markColor ? 'bg-green-500 border-green-500 text-white' : 'bg-red-500 border-red-500 text-white') : btnInactive}`}>
          ✏️ Marcar avaria
        </button>
        <button onClick={() => setDrawMode('erase')}
          className={`${btnBase} ${drawMode === 'erase' ? 'bg-gray-600 border-gray-600 text-white' : btnInactive}`}>
          🧹 Apagar
        </button>
        <button onClick={() => setMarks([])}
          className={`ml-auto ${btnBase} ${btnInactive}`}>
          🗑️ Limpar
        </button>
      </div>

      {/* 3D canvas */}
      <ModelErrorBoundary>
        <div
          className={fillHeight
            ? `relative overflow-hidden flex-1 min-h-0 ${cursorClass}`
            : `relative rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 ${cursorClass}`}
          style={fillHeight ? { touchAction: 'none' } : { aspectRatio: '2/1', touchAction: 'none' }}
        >
          {!loaded && <div className="absolute inset-0 z-20"><LoadingModel /></div>}
          <Canvas
            camera={{ position: [0, 10, 1], fov: 45 }}
            gl={{ preserveDrawingBuffer: true, alpha: false }}
            style={{ background: '#0d1b35' }}
            onCreated={() => setLoaded(true)}
          >
            <SketchScene
              drawMode={drawMode}
              marks={marks}
              setMarks={setMarks}
              captureFnRef={captureFn}
              fillHeight={fillHeight}
              initialMarks={initialMarks}
              markColor={markColor}
            />
          </Canvas>

          {marks.length > 0 && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg pointer-events-none">
              {marks.length} nova{marks.length !== 1 ? 's' : ''} marca{marks.length !== 1 ? 's' : ''}
            </div>
          )}
          {drawMode !== 'view' && (
            <div className={`absolute top-2 right-2 px-2 py-1 text-white text-xs rounded-lg font-medium pointer-events-none ${
              drawMode === 'draw' ? (markColor ? 'bg-green-500/90' : 'bg-red-500/90') : 'bg-gray-600/90'
            }`}>
              {drawMode === 'draw' ? '✏️ Marcando' : '🧹 Apagando'}
            </div>
          )}
        </div>
      </ModelErrorBoundary>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {drawMode === 'view' && 'Arraste para girar e ver todos os ângulos da embarcação.'}
        {drawMode === 'draw' && (markColor
          ? 'Toque ou clique diretamente no local da nova avaria para marcar em verde.'
          : 'Toque ou clique diretamente no local da avaria para marcar em vermelho.')}
        {drawMode === 'erase' && (markColor
          ? 'Toque sobre as marcas verdes para apagá-las.'
          : 'Toque sobre as marcas vermelhas para apagá-las.')}
      </p>
    </div>
  );
});

JetSki3DSketch.displayName = 'JetSki3DSketch';
export default JetSki3DSketch;
useGLTF.preload('/jetski.glb');
