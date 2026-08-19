'use client';
import { useRouter, usePathname } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Home, Search, Map, LayoutDashboard, User, Compass, Sparkles } from 'lucide-react';
import { useRef, useState, useEffect, Children, cloneElement, useMemo } from 'react';
import type { MotionValue } from 'framer-motion';
import { useAppStore } from '@/store';

type SpringOptions = { mass?: number; stiffness?: number; damping?: number };

type DockItemData = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

type DockItemProps = {
  children: React.ReactNode;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({ children, onClick, mouseX, spring, distance, magnification, baseItemSize }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onClick={onClick}
      className="relative inline-flex items-center justify-center rounded-full cursor-pointer bg-[#1B432C]/80 border border-[#2C5E3B] hover:border-[#C69234] transition-colors"
    >
      {Children.map(children, (child) =>
        // @ts-ignore
        child && typeof child === 'object' ? cloneElement(child, { isHovered }) : child
      )}
    </motion.div>
  );
}

function DockLabel({ children, isHovered }: { children: React.ReactNode; isHovered?: MotionValue<number> }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!isHovered) return;
    return isHovered.on('change', (v) => setVisible(v === 1));
  }, [isHovered]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          className="absolute -top-9 left-1/2 whitespace-nowrap rounded-lg bg-[#143028] border border-[#2C5E3B] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#C69234] shadow-xl"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, isHovered }: { children: React.ReactNode; isHovered?: MotionValue<number> }) {
  return <div className="flex items-center justify-center text-[#A3C2B2] hover:text-[#C69234] transition-colors">{children}</div>;
}

export function NavDock() {
  const router = useRouter();
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const { generatedItinerary } = useAppStore();

  const spring = { mass: 0.1, stiffness: 150, damping: 12 };
  const magnification = 72;
  const distance = 180;
  const baseItemSize = 48;
  const panelHeight = 64;

  const items: DockItemData[] = [
    { icon: <Home size={20} />, label: 'Home', onClick: () => router.push('/') },
    { icon: <Search size={20} />, label: 'Search', onClick: () => router.push('/#explore') },
    { icon: <Map size={20} />, label: 'Map', onClick: () => router.push('/map') },
    { 
      icon: <Sparkles size={20} />, 
      label: 'Itinerary', 
      onClick: () => {
        if (generatedItinerary) {
          router.push('/itinerary');
        } else {
          router.push('/dashboard');
        }
      } 
    },
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <User size={20} />, label: 'Profile', onClick: () => router.push('/profile') },
  ];

  const maxHeight = useMemo(() => Math.max(256, magnification + magnification / 2 + 4), [magnification]);
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none print:hidden">
      <motion.div style={{ height }} className="flex items-end pointer-events-auto">
        <motion.div
          onMouseMove={({ pageX }) => { isHovered.set(1); mouseX.set(pageX); }}
          onMouseLeave={() => { isHovered.set(0); mouseX.set(Infinity); }}
          className="flex items-end gap-2 rounded-3xl bg-[#143028]/90 border border-[#2C5E3B]/60 pb-2 px-4 shadow-2xl backdrop-blur-xl"
          style={{ height: panelHeight }}
        >
          {items.map((item, i) => (
            <DockItem
              key={i}
              onClick={item.onClick}
              mouseX={mouseX}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
            >
              <DockIcon>{item.icon}</DockIcon>
              <DockLabel>{item.label}</DockLabel>
            </DockItem>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
