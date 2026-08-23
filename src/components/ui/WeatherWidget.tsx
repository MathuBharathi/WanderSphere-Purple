'use client';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Wind } from 'lucide-react';

export function WeatherWidget({ weather }: { weather: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-28 right-6 z-40 ws-glass-strong border rounded-2xl p-4 w-52 backdrop-blur-xl shadow-2xl"
    >
      <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--ws-accent)' }}>Live Weather</p>
      <div className="flex items-center gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-10 h-10 opacity-90"
        />
        <div>
          <p className="text-3xl font-display" style={{ color: 'var(--ws-text)' }}>{weather.temp}°</p>
          <p className="text-[10px] capitalize" style={{ color: 'var(--ws-text-secondary)' }}>{weather.description}</p>
        </div>
      </div>
      <div className="flex gap-3 text-[10px]" style={{ color: 'var(--ws-text-secondary)' }}>
        <span className="flex items-center gap-1">
          <Droplets size={10} style={{ color: 'var(--ws-accent)' }} />
          {weather.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Wind size={10} style={{ color: 'var(--ws-accent)' }} />
          {weather.wind_speed} m/s
        </span>
      </div>
    </motion.div>
  );
}
