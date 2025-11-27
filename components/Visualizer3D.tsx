import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { VisualizationState } from '../types';

interface VisualizerProps {
  data: VisualizationState;
}

const SceneContent: React.FC<VisualizerProps> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Safe access to arrays with optional chaining on data
  const points = data?.points || [];
  const lines = data?.lines || [];
  const polygons = data?.polygons || [];
  
  // Create a map of point labels to coordinates for easy line lookup
  const pointMap = new Map<string, [number, number, number]>();
  points.forEach(p => pointMap.set(p.label || '', [p.x, p.y, p.z]));

  useFrame((state) => {
    if (groupRef.current) {
        // slight auto rotation if user isn't interacting could be added here, 
        // but explicit control is usually better for math.
    }
  });

  return (
    <group ref={groupRef}>
      <gridHelper args={[20, 20, 0x44403c, 0x292524]} position={[0, -5, 0]} />
      
      {/* Points */}
      {points.map((point, idx) => (
        <group key={`pt-${idx}`} position={[point.x, point.y, point.z]}>
          <Sphere args={[0.2, 16, 16]}>
            <meshStandardMaterial 
              color={point.color || "#0ea5e9"} 
              emissive={point.color || "#0ea5e9"} 
              emissiveIntensity={0.5} 
            />
          </Sphere>
          <Html distanceFactor={10}>
            <div className="bg-stone-900/80 text-amber-500 px-1 py-0.5 text-xs font-mono border border-amber-500/30 rounded">
              {point.label}
            </div>
          </Html>
        </group>
      ))}

      {/* Lines */}
      {lines.map((line, idx) => {
        const start = pointMap.get(line.from);
        const end = pointMap.get(line.to);
        
        if (!start || !end) return null;

        return (
          <group key={`ln-${idx}`}>
            <Line
              points={[start, end]}
              color={line.color || "#57534e"}
              lineWidth={line.dashed ? 1 : 2}
              dashed={line.dashed}
            />
            {line.label && (
                <Html position={[
                    (start[0] + end[0]) / 2, 
                    (start[1] + end[1]) / 2, 
                    (start[2] + end[2]) / 2
                ]} distanceFactor={8}>
                     <div className="text-stone-400 bg-black/50 px-1 text-[10px]">{line.label}</div>
                </Html>
            )}
          </group>
        );
      })}
      
      {/* Polygons (Transparent Faces) */}
      {polygons.map((poly, idx) => {
         const vertices = (poly.points || []).map(label => pointMap.get(label)).filter(Boolean) as [number, number, number][];
         if (vertices.length < 3) return null;
         
         const vectorPoints = vertices.map(v => new THREE.Vector3(...v));
         const geometry = new THREE.BufferGeometry().setFromPoints(vectorPoints);
         // For a simple filled polygon, we need indices. 
         // Assuming convex polygon fan from first point for simplicity in this generated context
         const indices = [];
         for(let i = 1; i < vertices.length - 1; i++) {
             indices.push(0, i, i+1);
         }
         geometry.setIndex(indices);
         geometry.computeVertexNormals();

         return (
             <mesh key={`poly-${idx}`} geometry={geometry}>
                 <meshBasicMaterial 
                    color={poly.color || "#f59e0b"} 
                    transparent 
                    opacity={poly.opacity || 0.1} 
                    side={THREE.DoubleSide}
                />
             </mesh>
         )
      })}
    </group>
  );
};

export const Visualizer3D: React.FC<VisualizerProps> = ({ data }) => {
  return (
    <div className="w-full h-full bg-[#0c0a09] relative overflow-hidden">
        {/* Retro Grid Background Overlay (CSS) */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }}
        ></div>

      <Canvas camera={{ position: [5, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#f59e0b" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0ea5e9" />
        
        {data ? (
            <SceneContent data={data} />
        ) : (
            <Html center>
                <div className="text-stone-500 font-mono text-xs">VISUAL DATA MISSING</div>
            </Html>
        )}
        
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      <div className="absolute top-8 left-4 text-xs font-mono text-stone-500 select-none pointer-events-none z-10">
        <div>CAM_FEED_01</div>
        <div>REC ●</div>
      </div>
    </div>
  );
};
