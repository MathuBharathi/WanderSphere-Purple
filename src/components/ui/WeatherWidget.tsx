'use client';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Wind } from 'lucide-react';

export function WeatherWidget({ weather }: { weather: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-28 right-6 z-40 bg-[#143028]/95 border border-[#2C5E3B] rounded-2xl p-4 w-52 backdrop-blur-xl shadow-2xl"
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#C69234] mb-3">Live Weather</p>
      <div className="flex items-center gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-10 h-10 opacity-90"
        />
        <div>
          <p className="text-3xl font-display text-white">{weather.temp}°</p>
          <p className="text-[#A3C2B2] text-[10px] capitalize">{weather.description}</p>
        </div>
      </div>
      <div className="flex gap-3 text-[10px] text-[#A3C2B2]">
        <span className="flex items-center gap-1">
          <Droplets size={10} className="text-[#C69234]" />
          {weather.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Wind size={10} className="text-[#A3C2B2]" />
          {weather.wind_speed} m/s
        </span>
      </div>
    </motion.div>
  );
}
