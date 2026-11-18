import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RotateCcw, Grid, Eye } from 'lucide-react';

interface ModelViewer3DProps {
  file: File | null;
  colorHex: string;
  buildVolume?: { x: number; y: number; z: number };
  dimensionsMm?: { x: number; y: number; z: number } | null;
}

const isSoftwareGlProbe = (): boolean => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
};

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({
  file,
  colorHex,
  buildVolume = { x: 300, y: 300, z: 300 },
  dimensionsMm,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const resetCamRef = useRef<() => void>(() => {});

  const [wireframe, setWireframe] = useState(false);
  const [viewerNotice, setViewerNotice] = useState<string>('');
  const [localDims, setLocalDims] = useState<{ x: number; y: number; z: number } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = isSoftwareGlProbe();
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1324);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 4000);
    camera.position.set(180, 140, 200);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3-Point Studio Lighting
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.75);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(160, 260, 180);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-180, 120, -160);
    scene.add(rimLight);

    // Printer Build Plate Grid
    const plateSize = Math.max(buildVolume.x, buildVolume.y, 250);
    const grid = new THREE.GridHelper(plateSize, 15, 0x38bdf8, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    const plateGeom = new THREE.PlaneGeometry(buildVolume.x, buildVolume.y);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.75,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = -0.2;
    plate.receiveShadow = !isSoftwareGl;
    scene.add(plate);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    meshGroupRef.current = modelGroup;

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || '#2563eb'),
      roughness: 0.42,
      metalness: 0.12,
      wireframe: false,
    });
    materialRef.current = material;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 20, 0);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    requestRenderRef.current = requestRender;
    resetCamRef.current = () => {
      const box = new THREE.Box3().setFromObject(modelGroup);
      if (box.isEmpty()) {
        camera.position.set(180, 140, 200);
        controls.target.set(0, 20, 0);
      } else {
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 30);
        camera.position.set(center.x + maxDim * 1.4, center.y + maxDim * 1.1, center.z + maxDim * 1.5);
        controls.target.copy(center);
      }
      requestRender();
    };

    controls.addEventListener('change', requestRender);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    // Default reference bracket silhouette when no file is uploaded yet
    const sampleShape = new THREE.Shape();
    sampleShape.moveTo(-25, -18);
    sampleShape.lineTo(25, -18);
    sampleShape.lineTo(25, 18);
    sampleShape.lineTo(-25, 18);
    sampleShape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 8, 0, Math.PI * 2, true);
    sampleShape.holes.push(hole);
    const sampleGeo = new THREE.ExtrudeGeometry(sampleShape, {
      depth: 12,
      bevelEnabled: true,
      bevelThickness: 1.5,
      bevelSize: 1.5,
      bevelSegments: 2,
    });
    sampleGeo.rotateX(-Math.PI / 2);
    const sampleMesh = new THREE.Mesh(sampleGeo, material);
    sampleMesh.position.y = 1.5;
    modelGroup.add(sampleMesh);

    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      plateGeom.dispose();
      plateMat.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [buildVolume.x, buildVolume.y]);

  // Update color & wireframe without recreating WebGL context
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.set(colorHex || '#2563eb');
      materialRef.current.wireframe = wireframe;
      materialRef.current.needsUpdate = true;
      requestRenderRef.current();
    }
  }, [colorHex, wireframe]);

  // Load STL or OBJ file into Three.js scene
  useEffect(() => {
    const group = meshGroupRef.current;
    const mat = materialRef.current;
    if (!group || !mat || !file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'stl' && ext !== 'obj') {
      setLocalDims(null);
      setViewerNotice(
        `${ext.toUpperCase()} CAD package uploaded. Interactive WebGL mesh preview supports STL & OBJ; STEP/3MF packages are validated directly by our engineering team.`
      );
      return;
    }

    setViewerNotice('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        while (group.children.length > 0) {
          const child = group.children[0];
          group.remove(child);
        }

        if (ext === 'stl') {
          const loader = new STLLoader();
          const geometry = loader.parse(reader.result as ArrayBuffer);
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();

          const mesh = new THREE.Mesh(geometry, mat);
          // Rotate Z-up CAD models to Three.js Y-up print bed orientation
          mesh.rotation.x = -Math.PI / 2;
          mesh.updateMatrixWorld(true);

          const box = new THREE.Box3().setFromObject(mesh);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          mesh.position.set(-center.x, -box.min.y, -center.z);
          group.add(mesh);

          setLocalDims({
            x: Number(size.x.toFixed(1)),
            y: Number(size.z.toFixed(1)),
            z: Number(size.y.toFixed(1)),
          });
        } else if (ext === 'obj') {
          const loader = new OBJLoader();
          const obj = loader.parse(reader.result as string);
          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).material = mat;
            }
          });
          const box = new THREE.Box3().setFromObject(obj);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          obj.position.set(-center.x, -box.min.y, -center.z);
          group.add(obj);
          setLocalDims({
            x: Number(size.x.toFixed(1)),
            y: Number(size.y.toFixed(1)),
            z: Number(size.z.toFixed(1)),
          });
        }

        resetCamRef.current();
      } catch {
        setViewerNotice('Could not parse 3D mesh for live preview. Server engineering validation will inspect the file.');
      }
    };

    if (ext === 'stl') reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }, [file]);

  const activeDims = dimensionsMm && dimensionsMm.x > 0 ? dimensionsMm : localDims;

  return (
    <div className="relative w-full h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-[#0b1324]">
      <div ref={mountRef} className="w-full h-full" />

      {/* Minimal Top-Left Spec Overlay */}
      <div className="absolute top-3 left-3 bg-slate-950/85 border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono tabular-nums pointer-events-none">
        {file ? (
          <span>
            {file.name}
            {activeDims ? ` · ${activeDims.x} × ${activeDims.y} × ${activeDims.z} mm` : ''}
          </span>
        ) : (
          <span>Sample Reference Geometry · Upload STL / OBJ / 3MF / STEP</span>
        )}
      </div>

      {viewerNotice && (
        <div className="absolute inset-x-4 top-14 bg-amber-950/90 border border-amber-500/40 rounded-lg px-3.5 py-2.5 text-xs text-amber-100">
          {viewerNotice}
        </div>
      )}

      {/* Compact Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-slate-200">
        <button
          type="button"
          onClick={() => resetCamRef.current()}
          className="px-2.5 py-1 rounded hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Camera
        </button>
        <span className="text-slate-600">|</span>
        <button
          type="button"
          onClick={() => setWireframe((w) => !w)}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 whitespace-nowrap ${
            wireframe ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          Wireframe
        </button>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="hidden sm:flex items-center gap-1 text-slate-400 whitespace-nowrap">
          <Eye className="w-3.5 h-3.5" />
          Drag to Rotate · Scroll to Zoom
        </span>
      </div>
    </div>
  );
};
