'use client';
import React, { useEffect, useRef, useState } from 'react';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js';

function randomColors(count: number) {
  return Array.from({ length: count }, () =>
    '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
  );
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

interface TubesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  enableClickInteraction?: boolean;
}

export function TubesBackground({ children, className = '', enableClickInteraction = true }: TubesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tubesRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!canvasRef.current) return;
      try {
        await loadScript(CDN_URL);
        if (!mounted) return;
        // The script exposes itself as a global
        const factory = (window as any).tubes1 ?? (window as any).default;
        if (!factory) {
          console.error('TubesBackground: tubes1 global not found after script load');
          return;
        }
        const app = factory(canvasRef.current, {
          tubes: {
            colors: ['#2C5E3B', '#C69234', '#A65D29'],
            lights: {
              intensity: 220,
              colors: ['#143028', '#2C5E3B', '#C69234', '#A65D29'],
            },
          },
        });
        tubesRef.current = app;
        setLoaded(true);
      } catch (e) {
        console.error('TubesBackground failed to load:', e);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const handleClick = () => {
    if (!enableClickInteraction || !tubesRef.current) return;
    tubesRef.current.tubes?.setColors?.(['#2C5E3B', '#C69234', '#A65D29']);
    tubesRef.current.tubes?.setLightsColors?.(['#143028', '#2C5E3B', '#C69234', '#A65D29']);
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      onClick={handleClick}
      style={{ cursor: enableClickInteraction ? 'pointer' : 'default' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none', opacity: loaded ? 1 : 0, transition: 'opacity 1s ease' }}
      />
      {/* Gradient overlay to blend with page */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B1914] pointer-events-none" />
      <div className="relative z-10 w-full h-full pointer-events-none">
        {children}
      </div>
    </div>
  );
}

export default TubesBackground;
