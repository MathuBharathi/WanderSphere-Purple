'use client';
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  maxDegree?: number;
  scaleOnHover?: number;
}

export function Card3DTilt({
  children,
  className = '',
  maxDegree = 12,
  scaleOnHover = 1.03,
}: Card3DTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rY = ((mouseX - width / 2) / (width / 2)) * maxDegree;
    const rX = -((mouseY - height / 2) / (height / 2)) * maxDegree;

    const glareX = (mouseX / width) * 100;
    const glareY = (mouseY / height) * 100;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePos({ x: glareX, y: glareY, opacity: 0.2 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="perspective-container">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
        }}
        whileHover={{
          scale: scaleOnHover,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
        className={`relative rounded-3xl overflow-hidden glass-card-3d ${className}`}
      >
        {/* Dynamic Light Glare Overlay */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-30"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(245, 215, 127, 0.4) 0%, rgba(255, 255, 255, 0) 65%)`,
          }}
        />
        {children}
      </motion.div>
    </div>
  );
}
