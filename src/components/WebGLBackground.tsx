'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uTheme; // 0.0 = DAY, 1.0 = NIGHT
uniform float uMotionFactor; // 1.0 = normal, 0.2 = reduced motion

varying vec2 vUv;

// --- NOISE & WAVES ---
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// FBM wave octaves
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// Ocean height function
float seaOctave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
}

float mapSea(vec3 p, float time) {
    float freq = 0.18;
    float amp = 0.55;
    float choppy = 2.0;
    vec2 uv = p.xz;
    float d = 0.0;
    
    // Wave animation vectors
    vec2 dir1 = vec2(0.8, 0.6);
    vec2 dir2 = vec2(-0.7, 0.7);

    for (int i = 0; i < 4; i++) {
        float wave = seaOctave((uv + dir1 * time * 0.8) * freq, choppy);
        wave += seaOctave((uv + dir2 * time * 0.5) * freq, choppy);
        d += wave * amp;
        uv *= 1.9;
        freq *= 1.8;
        amp *= 0.48;
        choppy = mix(choppy, 1.0, 0.2);
    }
    return p.y - d;
}

// Calculate normal for specular highlights
vec3 getSeaNormal(vec3 p, float eps, float time) {
    vec3 n;
    n.y = mapSea(p, time);
    n.x = mapSea(vec3(p.x + eps, p.y, p.z), time) - n.y;
    n.z = mapSea(vec3(p.x, p.y, p.z + eps), time) - n.y;
    n.y = eps;
    return normalize(n);
}

// Procedural stars for night sky
float renderStars(vec2 uv, float time) {
    vec2 p = uv * 80.0;
    vec2 id = floor(p);
    vec2 r = fract(p) - 0.5;
    float h = hash(id);
    if (h > 0.94) {
        float size = (h - 0.94) * 15.0;
        float twinkle = sin(time * 2.5 + h * 6.28) * 0.5 + 0.5;
        float d = length(r);
        return smoothstep(0.12 * size, 0.0, d) * (0.4 + 0.6 * twinkle);
    }
    return 0.0;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    float animTime = uTime * uMotionFactor;

    // Camera setup
    vec3 cameraPos = vec3(0.0, 2.5, -4.0);
    vec3 cameraTarget = vec3(0.0, 0.5, 5.0);
    
    // Subtle camera swaying
    cameraPos.x += sin(animTime * 0.2) * 0.3 * uMotionFactor;
    cameraPos.y += cos(animTime * 0.15) * 0.1 * uMotionFactor;

    vec3 ww = normalize(cameraTarget - cameraPos);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = cross(uu, ww);
    vec3 rayDir = normalize(uv.x * uu + uv.y * vv + 1.3 * ww);

    // --- DAY PALETTE ---
    vec3 DAY_SKY_TOP = vec3(0.12, 0.45, 0.85);
    vec3 DAY_SKY_HORIZON = vec3(0.65, 0.82, 0.96);
    vec3 DAY_SUN_COLOR = vec3(1.0, 0.96, 0.85);
    vec3 DAY_SEA_BASE = vec3(0.04, 0.22, 0.45);
    vec3 DAY_SEA_WATER = vec3(0.08, 0.48, 0.72);
    vec3 DAY_FOG = vec3(0.68, 0.83, 0.95);
    vec3 DAY_CLOUD = vec3(1.0, 1.0, 1.0);

    // --- NIGHT PALETTE ---
    vec3 NIGHT_SKY_TOP = vec3(0.015, 0.035, 0.08);
    vec3 NIGHT_SKY_HORIZON = vec3(0.04, 0.08, 0.18);
    vec3 NIGHT_MOON_COLOR = vec3(0.92, 0.96, 1.0);
    vec3 NIGHT_SEA_BASE = vec3(0.01, 0.03, 0.08);
    vec3 NIGHT_SEA_WATER = vec3(0.03, 0.12, 0.25);
    vec3 NIGHT_FOG = vec3(0.03, 0.06, 0.14);
    vec3 NIGHT_CLOUD = vec3(0.06, 0.10, 0.20);

    // Dynamic interpolated theme parameters
    vec3 skyTop = mix(DAY_SKY_TOP, NIGHT_SKY_TOP, uTheme);
    vec3 skyHorizon = mix(DAY_SKY_HORIZON, NIGHT_SKY_HORIZON, uTheme);
    vec3 celestialColor = mix(DAY_SUN_COLOR, NIGHT_MOON_COLOR, uTheme);
    vec3 seaBase = mix(DAY_SEA_BASE, NIGHT_SEA_BASE, uTheme);
    vec3 seaWater = mix(DAY_SEA_WATER, NIGHT_SEA_WATER, uTheme);
    vec3 fogColor = mix(DAY_FOG, NIGHT_FOG, uTheme);
    vec3 cloudColor = mix(DAY_CLOUD, NIGHT_CLOUD, uTheme);

    // Celestial body directions (Sun / Moon)
    vec3 sunDir = normalize(vec3(0.2, 0.4, 1.0));
    vec3 moonDir = normalize(vec3(-0.15, 0.35, 1.0));
    vec3 lightDir = normalize(mix(sunDir, moonDir, uTheme));

    vec3 finalColor = vec3(0.0);

    if (rayDir.y > 0.0) {
        // --- SKY RENDERING ---
        float skyGradient = pow(max(1.0 - rayDir.y, 0.0), 2.2);
        vec3 sky = mix(skyTop, skyHorizon, skyGradient);

        // Sun / Moon Disc & Halo
        float distToLight = dot(rayDir, lightDir);
        float lightDisc = smoothstep(0.997, 0.999, distToLight);
        float lightHalo = pow(max(distToLight, 0.0), mix(12.0, 32.0, uTheme)) * mix(0.7, 0.5, uTheme);

        // Day Sun Flare vs Night Moon Glow
        sky += celestialColor * (lightDisc * 2.0 + lightHalo);

        // Stars (Night only)
        if (uTheme > 0.05) {
            float starAlpha = smoothstep(0.05, 0.8, uTheme) * (1.0 - skyGradient * 0.8);
            sky += vec3(renderStars(uv + vec2(0.5), animTime)) * starAlpha;
        }

        // Drifting Clouds
        vec2 cloudUv = (rayDir.xz / rayDir.y) * 0.4 + vec2(animTime * 0.015, 0.0);
        float cloudNoise = fbm(cloudUv * 2.0);
        float cloudAlpha = smoothstep(0.4, 0.75, cloudNoise) * (1.0 - rayDir.y * 0.8);
        sky = mix(sky, cloudColor, cloudAlpha * mix(0.35, 0.2, uTheme));

        finalColor = sky;
    } else {
        // --- OCEAN RAYMARCHING ---
        float t = (0.0 - cameraPos.y) / rayDir.y;
        vec3 hitPos = cameraPos + rayDir * t;
        
        // Raymarch refinement for waves
        for (int i = 0; i < 6; i++) {
            float heightErr = mapSea(hitPos, animTime);
            hitPos += rayDir * heightErr * 0.5;
        }

        vec3 N = getSeaNormal(hitPos, 0.1, animTime);
        vec3 V = -rayDir;
        
        // Fresnel reflection
        float fresnel = clamp(1.0 - dot(N, V), 0.0, 1.0);
        fresnel = pow(fresnel, 3.0) * 0.65;

        // Sea shading & Specular reflections
        vec3 R = reflect(rayDir, N);
        float spec = pow(max(dot(R, lightDir), 0.0), mix(64.0, 128.0, uTheme));
        float diff = max(dot(N, lightDir), 0.0);

        vec3 waterCol = mix(seaBase, seaWater, diff);
        vec3 skyReflect = mix(skyHorizon, skyTop, R.y * 0.5 + 0.5);
        
        vec3 seaColor = mix(waterCol, skyReflect, fresnel);
        seaColor += celestialColor * spec * mix(1.2, 0.8, uTheme);

        // Distance Fog
        float dist = length(hitPos - cameraPos);
        float fogFactor = 1.0 - exp(-dist * 0.035);
        finalColor = mix(seaColor, fogColor, clamp(fogFactor, 0.0, 1.0));
    }

    // Vignette & Subtle film grain
    float vignette = uv.x * uv.x + uv.y * uv.y;
    finalColor *= 1.0 - vignette * 0.18;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function WebGLBackground() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef<number>(theme === 'dark' ? 1.0 : 0.0);
  const targetThemeRef = useRef<number>(theme === 'dark' ? 1.0 : 0.0);

  // Sync theme changes to target
  useEffect(() => {
    targetThemeRef.current = theme === 'dark' ? 1.0 : 0.0;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!gl) {
      console.warn('WebGLBackground: WebGL context not supported.');
      return;
    }

    // Compile Shaders
    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error('Shader compilation error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad Buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform Locations
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uThemeLoc = gl.getUniformLocation(program, 'uTheme');
    const uMotionFactorLoc = gl.getUniformLocation(program, 'uMotionFactor');

    // Mobile & Reduced Motion Handling
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const MAX_DPR = isMobile ? 1.15 : 1.5;
    const QUALITY_MIN = isMobile ? 0.65 : 0.82;
    let currentQuality = QUALITY_MIN;

    let animFrameId: number;
    let startTime = performance.now();
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR) * currentQuality;
      const displayWidth = Math.floor(window.innerWidth * dpr);
      const displayHeight = Math.floor(window.innerHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl!.viewport(0, 0, displayWidth, displayHeight);
      }
    }

    window.addEventListener('resize', resize);
    resize();

    // Render Loop
    function render(now: number) {
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      // FPS performance adaptation
      frameCount++;
      if (now - fpsTimer >= 1000) {
        const fps = (frameCount * 1000) / (now - fpsTimer);
        frameCount = 0;
        fpsTimer = now;

        if (fps < 30 && currentQuality > 0.5) {
          currentQuality = Math.max(0.5, currentQuality - 0.1);
          resize();
        } else if (fps > 55 && currentQuality < (isMobile ? 1.0 : 1.2)) {
          currentQuality = Math.min(isMobile ? 1.0 : 1.2, currentQuality + 0.05);
          resize();
        }
      }

      // Smooth Theme Interpolation (1.2–1.8 seconds transition)
      const themeSpeed = dt / 1.4;
      if (themeRef.current < targetThemeRef.current) {
        themeRef.current = Math.min(targetThemeRef.current, themeRef.current + themeSpeed);
      } else if (themeRef.current > targetThemeRef.current) {
        themeRef.current = Math.max(targetThemeRef.current, themeRef.current - themeSpeed);
      }

      const totalTime = (now - startTime) / 1000;

      const activeGl = gl;
      if (!activeGl || !canvas) return;

      activeGl.useProgram(program);
      activeGl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      activeGl.uniform1f(uTimeLoc, totalTime);
      activeGl.uniform1f(uThemeLoc, themeRef.current);
      activeGl.uniform1f(uMotionFactorLoc, prefersReducedMotion ? 0.2 : 1.0);

      activeGl.drawArrays(activeGl.TRIANGLES, 0, 6);

      animFrameId = requestAnimationFrame(render);
    }

    animFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameId);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, []);

  return <canvas id="webgl_canvas" ref={canvasRef} aria-hidden="true" />;
}

export default WebGLBackground;
