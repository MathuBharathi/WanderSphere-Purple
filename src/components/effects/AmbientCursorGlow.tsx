'use client';
import { useEffect, useState } from 'react';

export function AmbientCursorGlow() {
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 overflow-hidden"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div
        className="absolute w-[500px] h-[500px] rounded-full transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${mousePos.x - 250}px, ${mousePos.y - 250}px, 0)`,
          background: 'radial-gradient(circle, rgba(198, 146, 52, 0.12) 0%, rgba(44, 94, 59, 0.05) 45%, rgba(11, 25, 20, 0) 70%)',
          filter: 'blur(30px)',
        }}
      />
    </div>
  );
}
