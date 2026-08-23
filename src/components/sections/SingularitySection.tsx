'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { Activity, Radio, Compass, RefreshCw, Zap } from 'lucide-react';

interface SingularityState {
  title: string;
  status: string;
  morph: number;
  compress: number;
  intensity: number;
  rotate: number;
  camY: number;
  camDist: number;
  orbit: number;
  color: string;
  vel: string;
  lensing: string;
}

const CONFIG: SingularityState[] = [
  {
    title: 'Stable Singularity',
    status: 'Topology: Nominal',
    morph: 0.1,
    compress: 1.0,
    intensity: 1.0,
    rotate: 0.4,
    camY: 25,
    camDist: 85,
    orbit: 1.0,
    color: '#00f3ff',
    vel: '0.45c',
    lensing: 'SCHWARZSCHILD',
  },
  {
    title: 'Accretion Turbulence',
    status: 'Topology: Fluctuating',
    morph: 4.5,
    compress: 1.15,
    intensity: 1.4,
    rotate: 1.5,
    camY: 45,
    camDist: 95,
    orbit: 1.8,
    color: '#ffaa00',
    vel: '0.78c',
    lensing: 'KERR DILATION',
  },
  {
    title: 'Relativistic Collapse',
    status: 'Topology: Critical',
    morph: 0.8,
    compress: 0.38,
    intensity: 3.5,
    rotate: 5.0,
    camY: 12,
    camDist: 55,
    orbit: 4.5,
    color: '#ff0044',
    vel: '0.99c',
    lensing: 'EVENT HORIZON',
  },
];

const noiseChunk = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
`;

export function SingularitySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAutoCycle, setIsAutoCycle] = useState(true);

  // HUD state refs for GSAP smooth text update
  const titleRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const velValRef = useRef<HTMLSpanElement>(null);
  const lensingValRef = useRef<HTMLSpanElement>(null);

  // Three.js object refs to trigger manual state changes via GSAP
  const diskMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const auraMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const camControlRef = useRef<{ distance: number }>({ distance: 85 });
  const activeIdxRef = useRef(0);

  const triggerTransitionTo = useCallback((targetIdx: number) => {
    activeIdxRef.current = targetIdx;
    setActiveIdx(targetIdx);
    const s = CONFIG[targetIdx];

    if (!diskMatRef.current || !auraMatRef.current || !controlsRef.current || !cameraRef.current) {
      return;
    }

    const diskMat = diskMatRef.current;
    const auraMat = auraMatRef.current;
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    const camControl = camControlRef.current;

    const tl = gsap.timeline({ defaults: { duration: 3.5, ease: 'power2.inOut' } });
    tl.to(diskMat.uniforms.uMorph, { value: s.morph }, 0);
    tl.to(diskMat.uniforms.uCompression, { value: s.compress }, 0);
    tl.to(diskMat.uniforms.uIntensity, { value: s.intensity }, 0);
    tl.to(diskMat.uniforms.uOrbitScale, { value: s.orbit }, 0);
    tl.to(auraMat.uniforms.uIntensity, { value: s.intensity }, 0);
    tl.to(controls, { autoRotateSpeed: s.rotate }, 0);
    tl.to(camera.position, { y: s.camY }, 0);
    tl.to(camControl, { distance: s.camDist }, 0);

    const elementsToAnimate = [
      titleRef.current,
      statusRef.current,
      velValRef.current,
      lensingValRef.current,
    ].filter(Boolean);

    gsap.to(elementsToAnimate, {
      opacity: 0,
      duration: 0.6,
      onComplete: () => {
        if (titleRef.current) titleRef.current.innerText = s.title;
        if (statusRef.current) {
          statusRef.current.innerText = s.status;
          statusRef.current.style.color = s.color;
          statusRef.current.style.borderColor = s.color;
        }
        if (velValRef.current) {
          velValRef.current.innerText = s.vel;
          velValRef.current.style.color = s.color;
        }
        if (lensingValRef.current) {
          lensingValRef.current.innerText = s.lensing;
          lensingValRef.current.style.color = s.color;
        }
        gsap.to(elementsToAnimate, { opacity: 1, duration: 1.0 });
      },
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(60, 30, 60);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.03;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controlsRef.current = controls;

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bhGeo = new THREE.SphereGeometry(4, 64, 64);
    coreGroup.add(new THREE.Mesh(bhGeo, bhMat));

    const auraMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 1.0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
            float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 4.0);
            gl_FragColor = vec4(vec3(1.0, 0.45, 0.1) * rim * uIntensity * 5.0, 1.0);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    auraMatRef.current = auraMat;
    coreGroup.add(new THREE.Mesh(new THREE.SphereGeometry(4.25, 64, 64), auraMat));

    const instanceCount = 5000;
    const streakGeo = new THREE.CylinderGeometry(0.01, 0.12, 2.2, 3);
    streakGeo.rotateX(Math.PI / 2);

    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0.1 },
        uCompression: { value: 1.0 },
        uIntensity: { value: 1.0 },
        uOrbitScale: { value: 1.0 },
      },
      vertexShader: `
        ${noiseChunk}
        uniform float uTime;
        uniform float uMorph;
        uniform float uCompression;
        uniform float uIntensity;
        uniform float uOrbitScale;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
            vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            float rOriginal = length(instPos.xz);
            float r = rOriginal * uCompression;
            float initialAngle = atan(instPos.z, instPos.x);
            float orbitalVelocity = (1.5 / sqrt(rOriginal)) * uOrbitScale;
            float currentAngle = initialAngle + (uTime * orbitalVelocity);
            vec3 morphedWorldPos = vec3(cos(currentAngle) * r, instPos.y, sin(currentAngle) * r);
            float noise = snoise(vec3(morphedWorldPos.x * 0.08, morphedWorldPos.z * 0.08, uTime * 0.3));
            morphedWorldPos.y += noise * uMorph * 4.0;
            vec3 viewDir = normalize(cameraPosition - morphedWorldPos);
            vec3 orbitDir = normalize(vec3(-sin(currentAngle), 0.0, cos(currentAngle)));
            float doppler = dot(orbitDir, viewDir);
            vec3 hot = vec3(1.0, 0.95, 0.9);
            vec3 warm = vec3(1.0, 0.45, 0.1);
            vec3 cool = vec3(0.1, 0.35, 1.0);
            vec3 color = mix(cool, warm, smoothstep(45.0, 12.0, r));
            color = mix(color, hot, smoothstep(10.0, 4.0, r));
            vColor = color * (1.3 + doppler * 0.7) * uIntensity;
            vOpacity = (smoothstep(3.8, 5.5, r) * (1.0 - smoothstep(38.0, 48.0, r))) * 0.8;
            float deltaAngle = currentAngle - initialAngle;
            float c = cos(deltaAngle);
            float s = sin(deltaAngle);
            mat3 rotY = mat3(
                c, 0, s,
                0, 1, 0,
               -s, 0, c
            );
            vec3 localPos = (instanceMatrix * vec4(position, 0.0)).xyz;
            vec3 rotatedLocalPos = rotY * localPos;
            gl_Position = projectionMatrix * viewMatrix * vec4(morphedWorldPos + rotatedLocalPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    diskMatRef.current = diskMaterial;

    const instancedDisk = new THREE.InstancedMesh(streakGeo, diskMaterial, instanceCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < instanceCount; i++) {
      const r = 5 + Math.pow(Math.random(), 1.3) * 40;
      const angle = Math.random() * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * (8 / r), Math.sin(angle) * r);
      dummy.lookAt(dummy.position.x + Math.sin(angle), dummy.position.y, dummy.position.z - Math.cos(angle));
      dummy.updateMatrix();
      instancedDisk.setMatrixAt(i, dummy.matrix);
    }
    scene.add(instancedDisk);

    const clock = new THREE.Clock();
    let animFrameId: number;

    const animate = () => {
      const time = clock.getElapsedTime();
      diskMaterial.uniforms.uTime.value = time;
      auraMat.uniforms.uTime.value = time;
      instancedDisk.rotation.y += 0.0005;

      const currentDir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
      camera.position.x = controls.target.x + currentDir.x * camControlRef.current.distance;
      camera.position.z = controls.target.z + currentDir.z * camControlRef.current.distance;

      controls.update();
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      controls.dispose();
      streakGeo.dispose();
      diskMaterial.dispose();
      bhGeo.dispose();
      bhMat.dispose();
      auraMat.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Auto transition interval effect
  useEffect(() => {
    if (!isAutoCycle) return;

    const interval = setInterval(() => {
      const nextIdx = (activeIdxRef.current + 1) % CONFIG.length;
      triggerTransitionTo(nextIdx);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAutoCycle, triggerTransitionTo]);

  const currState = CONFIG[activeIdx];

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 my-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#143028] border border-[#2C5E3B] text-[#C69234] text-xs font-semibold uppercase tracking-widest mb-3">
          <Zap size={14} className="animate-pulse text-[#C69234]" />
          WanderSphere Quantum Engine
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#ffaa00] to-[#ff0044]">Stable Singularity</span>
        </h2>
        <p className="mt-3 text-[#A3C2B2] max-w-2xl mx-auto text-sm md:text-base">
          Experience real-time WebGL relativistic accretion simulation. Drag to orbit, zoom to inspect event horizon geometry, and toggle quantum state topologies.
        </p>
      </div>

      {/* Canvas Box */}
      <div
        ref={containerRef}
        className="relative w-full h-[550px] md:h-[680px] rounded-3xl overflow-hidden bg-[#010103] border border-[#2C5E3B]/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] group"
      >
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none p-6 md:p-10 flex flex-col justify-between z-20">
          {/* Header HUD */}
          <div className="text-center">
            <div
              ref={titleRef}
              className="text-lg md:text-2xl font-light uppercase tracking-[0.6em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
            >
              {currState.title}
            </div>
            <div className="mt-3">
              <span
                ref={statusRef}
                className="inline-block px-5 py-1.5 bg-white/5 border border-white/20 rounded-full text-[10px] md:text-xs font-mono tracking-[0.25em] uppercase transition-all duration-1000"
                style={{ color: currState.color, borderColor: currState.color }}
              >
                {currState.status}
              </span>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="flex justify-between items-end font-mono text-xs text-white/70 tracking-wider">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio size={13} className="text-[#00f3ff]" />
                <span>MASS_INDEX:</span>
                <span className="font-bold text-white">4.2M SOL</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass size={13} className="text-[#C69234]" />
                <span>LENSING:</span>
                <span ref={lensingValRef} className="font-bold text-[#00f3ff]">
                  {currState.lensing}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div className="flex items-center justify-end gap-2">
                <span>RELATIVITY:</span>
                <span ref={velValRef} className="font-bold text-[#00f3ff]">
                  {currState.vel}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Activity size={13} className="text-emerald-400 animate-pulse" />
                <span>RADIATION:</span>
                <span className="font-bold text-emerald-400">DETECTION ON</span>
              </div>
            </div>
          </div>
        </div>

        {/* State Switching Control Panel (Interactive) */}
        <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
          {CONFIG.map((state, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAutoCycle(false);
                triggerTransitionTo(idx);
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-mono font-bold transition-all duration-300 backdrop-blur-md border ${
                activeIdx === idx
                  ? 'bg-white/20 text-white border-white scale-105 shadow-lg'
                  : 'bg-black/40 text-white/60 border-white/10 hover:text-white hover:border-white/30'
              }`}
              style={{
                borderColor: activeIdx === idx ? state.color : undefined,
                color: activeIdx === idx ? state.color : undefined,
              }}
            >
              Mode {idx + 1}: {state.title.split(' ')[0]}
            </button>
          ))}
          <button
            onClick={() => setIsAutoCycle(!isAutoCycle)}
            className={`mt-2 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-mono font-bold flex items-center gap-1.5 backdrop-blur-md border transition-all duration-300 ${
              isAutoCycle
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                : 'bg-black/40 text-white/40 border-white/10 hover:text-white'
            }`}
          >
            <RefreshCw size={11} className={isAutoCycle ? 'animate-spin' : ''} />
            Auto-Cycle: {isAutoCycle ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default SingularitySection;
