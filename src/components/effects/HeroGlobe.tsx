'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CityPoint {
  name: string;
  lat: number;
  lng: number;
  description: string;
}

const FEATURED_CITIES: CityPoint[] = [
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, description: 'Capital of rich history & monuments' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, description: 'The Royal Pink City of Palaces' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, description: 'The City of Dreams & Coastal Vibe' },
  { name: 'Goa', lat: 15.2993, lng: 74.1240, description: 'Tropical Beaches & Heritage Trails' },
  { name: 'Kerala (Kochi)', lat: 9.9312, lng: 76.2673, description: 'God’s Own Country Backwaters' },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739, description: 'Spiritual Ghats of River Ganges' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, description: 'Garden City & Modern Hub' },
  { name: 'Agra', lat: 27.1767, lng: 78.0081, description: 'Home of the Iconic Taj Mahal' },
  { name: 'Udaipur', lat: 24.5854, lng: 73.7125, description: 'The City of Lakes & Royal Romance' },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export function HeroGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCity, setHoveredCity] = useState<CityPoint | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 280;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Main Group
    const globeGroup = new THREE.Group();
    // Default tilt towards India
    globeGroup.rotation.x = 0.35;
    globeGroup.rotation.y = -1.2;
    scene.add(globeGroup);

    // Globe Radius
    const radius = 80;

    // 1. Core Sphere
    const sphereGeo = new THREE.SphereGeometry(radius - 0.5, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x0b1914,
      transparent: true,
      opacity: 0.85,
    });
    const coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(coreSphere);

    // 2. Latitude/Longitude Grid Wireframe
    const gridGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(radius, 24, 24));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x2c5e3b,
      transparent: true,
      opacity: 0.25,
    });
    const gridMesh = new THREE.LineSegments(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // 3. Equatorial Rings
    const ringGeo = new THREE.RingGeometry(radius + 12, radius + 14, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc69234,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    globeGroup.add(ringMesh);

    // 4. Star Particles Background
    const particlesCount = 350;
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 600;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 1.5,
      color: 0xc69234,
      transparent: true,
      opacity: 0.4,
    });
    const starParticles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(starParticles);

    // 5. City Pins & Glowing Markers
    const cityPinsGroup = new THREE.Group();
    const pinMeshes: { mesh: THREE.Mesh; city: CityPoint }[] = [];

    FEATURED_CITIES.forEach((city) => {
      const pos = latLngToVector3(city.lat, city.lng, radius + 1);

      // Pin Dot
      const dotGeo = new THREE.SphereGeometry(2.2, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xc69234,
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pos);

      // Pulse Ring around pin
      const pulseGeo = new THREE.RingGeometry(2.5, 4, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0xf5d77f,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.position.copy(pos);
      pulseMesh.lookAt(new THREE.Vector3(0, 0, 0));

      cityPinsGroup.add(dotMesh);
      cityPinsGroup.add(pulseMesh);
      pinMeshes.push({ mesh: dotMesh, city });
    });

    globeGroup.add(cityPinsGroup);

    // Interactive Raycasting for City Pins
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      mouse.x = (x / width) * 2 - 1;
      mouse.y = -(y / height) * 2 + 1;

      // Mouse drag rotation
      if (isMouseDown) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        globeGroup.rotation.y += deltaX * 0.005;
        globeGroup.rotation.x += deltaY * 0.005;
      }

      previousMousePosition = { x: event.clientX, y: event.clientY };

      // Raycast check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinMeshes.map((p) => p.mesh));

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const matchedPin = pinMeshes.find((p) => p.mesh === hitMesh);
        if (matchedPin) {
          setHoveredCity(matchedPin.city);
          setHoverPos({ x: event.clientX, y: event.clientY });
          document.body.style.cursor = 'pointer';
        }
      } else {
        setHoveredCity(null);
        document.body.style.cursor = 'default';
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousemove', handlePointerMove);
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Resize listener
    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow idle rotation if user is not dragging
      if (!isMouseDown) {
        globeGroup.rotation.y += 0.002;
      }

      // Rotate particle background opposite
      starParticles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousemove', handlePointerMove);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[380px] flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* City Tooltip Popup */}
      {hoveredCity && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-4 py-2.5 rounded-xl bg-[#143028]/95 border border-[#C69234] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-left"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C69234] animate-ping" />
            <h4 className="font-bold text-sm text-white">{hoveredCity.name}</h4>
          </div>
          <p className="text-xs text-[#A3C2B2] mt-0.5">{hoveredCity.description}</p>
        </div>
      )}

      {/* Decorative controls hint */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] uppercase tracking-widest text-[#A3C2B2]/60 pointer-events-none bg-[#0B1914]/60 px-3 py-1 rounded-full border border-[#2C5E3B]/40 backdrop-blur-sm">
        Drag to rotate 3D Globe ✦ Hover hotspots
      </div>
    </div>
  );
}
