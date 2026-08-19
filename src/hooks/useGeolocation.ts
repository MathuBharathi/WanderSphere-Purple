'use client';
import { useEffect } from 'react';
import { useAppStore } from '../store';

export function useGeolocation() {
  const setUserLocation = useAppStore((s) => s.setUserLocation);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.warn('Geolocation denied:', err.message),
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [setUserLocation]);
}
