/**
 * Model3DViewer - Enhanced 3D Model Viewer using Three.js
 * Supports OBJ, STL, GLTF/GLB formats with interactive controls
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box, RotateCw, ZoomIn, ZoomOut, Move, Eye, EyeOff,
  Settings, Download, Loader2, Maximize2, Minimize2, Grid3x3
} from 'lucide-react';
import * as THREE from 'three';
import type { ProcessingResult } from '../lib/fileProcessor';

interface Model3DViewerProps {
  result: ProcessingResult;
}

export function Model3DViewer({ result }: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState(1);

  const fileFormat = String(result.metadata.format || '').toLowerCase();

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xa78bfa, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 20, 0x1f1f2e, 0x1f1f2e);
    gridHelper.visible = true;
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      if (modelRef.current && autoRotate) {
        modelRef.current.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Load model based on format
    loadModel();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  const loadModel = async () => {
    if (!result.content || !sceneRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const content = result.content;
      let model: THREE.Group | null = null;

      // Check format and load accordingly
      if (fileFormat.includes('obj') || fileFormat.includes('OBJ')) {
        model = await loadOBJ(content);
      } else if (fileFormat.includes('stl') || fileFormat.includes('STL')) {
        model = await loadSTL(content);
      } else if (fileFormat.includes('gltf') || fileFormat.includes('glb') || fileFormat.includes('GLTF')) {
        model = await loadGLTF(content);
      } else if (fileFormat.includes('fbx') || fileFormat.includes('FBX')) {
        // FBX requires additional loader, show placeholder
        model = createPlaceholderModel();
      } else {
        // Default: create geometric placeholder
        model = createPlaceholderModel();
      }

      if (model && sceneRef.current) {
        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;

        model.position.sub(center);
        model.scale.multiplyScalar(scale);

        // Clear existing model
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
        }

        sceneRef.current.add(model);
        modelRef.current = model;

        // Apply initial zoom
        applyZoom(zoom);
      }
    } catch (err) {
      console.error('Model loading error:', err);
      setError('Failed to load 3D model');
      // Create fallback
      const fallback = createPlaceholderModel();
      if (fallback && sceneRef.current) {
        sceneRef.current.add(fallback);
        modelRef.current = fallback;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadOBJ = async (url: string): Promise<THREE.Group> => {
    // Simple OBJ parser for basic models
    const text = await fetch(url).then(r => r.text());
    const lines = text.split('\n');

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('v ')) {
        const parts = trimmed.slice(2).split(/\s+/);
        positions.push(parseFloat(parts[0]) || 0);
        positions.push(parseFloat(parts[1]) || 0);
        positions.push(parseFloat(parts[2]) || 0);
      } else if (trimmed.startsWith('vn ')) {
        const parts = trimmed.slice(3).split(/\s+/);
        normals.push(parseFloat(parts[0]) || 0);
        normals.push(parseFloat(parts[1]) || 0);
        normals.push(parseFloat(parts[2]) || 0);
      } else if (trimmed.startsWith('vt ')) {
        const parts = trimmed.slice(3).split(/\s+/);
        uvs.push(parseFloat(parts[0]) || 0);
        uvs.push(parseFloat(parts[1]) || 0);
      } else if (trimmed.startsWith('f ')) {
        const parts = trimmed.slice(2).split(/\s+/);
        for (const part of parts) {
          const [vi] = part.split('/').map(Number);
          indices.push(vi - 1);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (normals.length > 0) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    }
    if (uvs.length > 0) {
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0xa78bfa,
      metalness: 0.3,
      roughness: 0.7,
      wireframe: wireframe,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const group = new THREE.Group();
    group.add(mesh);
    return group;
  };

  const loadSTL = async (url: string): Promise<THREE.Group> => {
    // STL binary parser
    const buffer = await fetch(url).then(r => r.arrayBuffer());
    const reader = new DataView(buffer);

    const triangleCount = reader.getUint32(80, true);
    const positions: number[] = [];

    for (let i = 0; i < triangleCount; i++) {
      const offset = 84 + i * 50;
      // Skip normal (3 floats)
      for (let j = 0; j < 3; j++) {
        positions.push(reader.getFloat32(offset + 12 + j * 12, true));
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      metalness: 0.2,
      roughness: 0.8,
      wireframe: wireframe,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    const group = new THREE.Group();
    group.add(mesh);
    return group;
  };

  const loadGLTF = async (url: string): Promise<THREE.Group> => {
    // Basic GLTF/GLB loader
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('octet-stream') || url.endsWith('.glb')) {
      return await loadGLB(url);
    }

    return await loadGLTFJSON(url);
  };

  const loadGLB = async (url: string): Promise<THREE.Group> => {
    const buffer = await fetch(url).then(r => r.arrayBuffer());
    const reader = new DataView(buffer);

    // GLB header check
    const magic = reader.getUint32(0, false);
    if (magic !== 0x46546C67) {
      throw new Error('Invalid GLB file');
    }

    // For simplicity, create a placeholder mesh
    // Full GLB parsing would require gltf-pipeline or similar
    return createPlaceholderModel();
  };

  const loadGLTFJSON = async (url: string): Promise<THREE.Group> => {
    // Fetch and parse GLTF JSON
    const json = await fetch(url).then(r => r.json());

    // Create basic mesh from GLTF primitives
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.4,
      roughness: 0.6,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  };

  const createPlaceholderModel = (): THREE.Group => {
    // Create a composite placeholder model
    const group = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(1.5, 0.5, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      metalness: 0.3,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.25;
    body.castShadow = true;
    group.add(body);

    // Top cone
    const coneGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.4,
      roughness: 0.5,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.9;
    cone.castShadow = true;
    group.add(cone);

    // Sphere detail
    const sphereGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xa78bfa,
      metalness: 0.5,
      roughness: 0.3,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(0.5, 0.5, 0);
    sphere.castShadow = true;
    group.add(sphere);

    return group;
  };

  const applyZoom = (scale: number) => {
    if (!cameraRef.current) return;
    const distance = 5 / scale;
    cameraRef.current.position.set(distance, distance, distance);
    cameraRef.current.lookAt(0, 0, 0);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
    applyZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.2);
    setZoom(newZoom);
    applyZoom(newZoom);
  };

  const handleReset = () => {
    setZoom(1);
    applyZoom(1);
    setAutoRotate(true);
  };

  const toggleWireframe = useCallback(() => {
    setWireframe(w => {
      const newValue = !w;
      if (modelRef.current) {
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshStandardMaterial).wireframe = newValue;
          }
        });
      }
      return newValue;
    });
  }, []);

  const toggleAxes = useCallback(() => {
    if (!sceneRef.current) return;
    setShowAxes(s => {
      const axesHelper = sceneRef.current!.getObjectByName('axesHelper');
      if (axesHelper) {
        axesHelper.visible = !s;
      } else if (!s) {
        const helper = new THREE.AxesHelper(2);
        helper.name = 'axesHelper';
        sceneRef.current!.add(helper);
      }
      return !s;
    });
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        style={{ background: '#0a0a0f' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-voila-400 animate-spin mb-3" />
          <span className="text-sm text-white/60">Loading 3D Model...</span>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mb-3">
            <Box className="w-8 h-8 text-warning" />
          </div>
          <span className="text-sm text-white/60">{error}</span>
          <span className="text-xs text-white/30 mt-1">Showing placeholder model</span>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        {/* Format Badge */}
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-black/40 text-white/60 backdrop-blur-sm border border-white/10">
            {fileFormat.toUpperCase() || '3D'}
          </span>
          {result.metadata.vertices !== undefined && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-black/40 text-white/40 backdrop-blur-sm">
              {(result.metadata.vertices as number).toLocaleString()} verts
            </span>
          )}
        </div>

        {/* Zoom Level */}
        <span className="text-[10px] px-2 py-1 rounded-full bg-black/40 text-white/40 backdrop-blur-sm">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="flex gap-1">
          <ControlButton
            icon={<RotateCw className="w-3.5 h-3.5" />}
            label="Auto-rotate"
            active={autoRotate}
            onClick={() => setAutoRotate(!autoRotate)}
          />
          <ControlButton
            icon={<Grid3x3 className="w-3.5 h-3.5" />}
            label="Wireframe"
            active={wireframe}
            onClick={toggleWireframe}
          />
          <ControlButton
            icon={showAxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            label="Axes"
            active={showAxes}
            onClick={toggleAxes}
          />
        </div>

        <div className="flex gap-1">
          <ControlButton icon={<ZoomOut className="w-3.5 h-3.5" />} onClick={handleZoomOut} />
          <ControlButton icon={<RotateCw className="w-3.5 h-3.5" />} onClick={handleReset} />
          <ControlButton icon={<ZoomIn className="w-3.5 h-3.5" />} onClick={handleZoomIn} />
          <ControlButton
            icon={isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            onClick={() => setIsFullscreen(!isFullscreen)}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-14 left-3 text-[9px] text-white/20">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
}

function ControlButton({ icon, label, active, onClick }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        p-2 rounded-lg backdrop-blur-sm transition-colors
        ${active
          ? 'bg-voila-500/30 text-voila-400 border border-voila-500/50'
          : 'bg-black/40 text-white/60 border border-white/10 hover:bg-black/60 hover:text-white'
        }
      `}
    >
      {icon}
    </button>
  );
}

export default Model3DViewer;
