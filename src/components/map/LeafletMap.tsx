'use client';
import { useEffect, useRef } from 'react';
import type { Map, Marker, Polyline } from 'leaflet';

interface MapItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  cover_image?: string;
  description?: string;
  type: 'city' | 'place';
  category?: string;
  exploreUrl?: string;
}

interface LeafletMapProps {
  items: MapItem[];
  center?: [number, number];
  zoom?: number;
  routePoints?: [number, number][]; // Line coordinates to visualize routes
  onItemSelect?: (item: MapItem | null) => void;
  activeItemId?: string;
}

export default function LeafletMap({
  items,
  center = [20.5937, 78.9629], // Center of India
  zoom = 5,
  routePoints,
  onItemSelect,
  activeItemId,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<{ [key: string]: Marker }>({});
  const polylineRef = useRef<Polyline | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Dynamically load Leaflet CSS if not already loaded
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let L: any;
    const initMap = async () => {
      L = (await import('leaflet')).default;

      if (mapRef.current) {
        mapRef.current.remove();
      }

      const map = L.map(mapContainerRef.current!, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Use a premium looking dark/light tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Markers and route
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    const updateMapElements = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current!;

      // 1. Remove old markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      // 2. Remove old polyline
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      // 3. Define custom icons
      const createIcon = (type: 'city' | 'place', category?: string, isActive = false) => {
        const primaryColor = isActive ? '#4F46E5' : '#8B5CF6';
        const secondaryColor = isActive ? '#818CF8' : '#A78BFA';
        const size = isActive ? 34 : 26;

        let iconInner = `<div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>`;

        // If it's a place, customize inner dots based on category
        if (type === 'place') {
          const colors: { [key: string]: string } = {
            spiritual: '#F59E0B',
            nature: '#10B981',
            adventure: '#EF4444',
            food: '#EC4899',
            beach: '#3B82F6',
            historical: '#84CC16',
          };
          const dotColor = colors[category || ''] || 'white';
          iconInner = `<div style="width: 8px; height: 8px; background: ${dotColor}; border-radius: 50%;"></div>`;
        }

        return L.divIcon({
          className: `custom-marker ${isActive ? 'active-marker' : ''}`,
          html: `<div style="
            width: ${size}px; height: ${size}px; border-radius: 50%; 
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); 
            border: 2px solid white; 
            box-shadow: 0 3px 10px rgba(139,92,246,0.3);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          ">
            ${iconInner}
          </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      };

      // 4. Add new markers
      items.forEach((item) => {
        if (!item.latitude || !item.longitude) return;

        const isActive = activeItemId === item.id;
        const icon = createIcon(item.type, item.category, isActive);

        const marker = L.marker([item.latitude, item.longitude], { icon }).addTo(map);

        // Customize standard popup card
        const popupContent = `
          <div style="
            min-width: 220px; font-family: system-ui, -apple-system, sans-serif;
            border-radius: 20px; background: white; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          ">
            ${
              item.cover_image
                ? `<div style="
                  width: 100%; height: 110px;
                  background-image: url(${item.cover_image}); background-size: cover; background-position: center;
                "></div>`
                : ''
            }
            <div style="padding: 12px 14px;">
              <span style="
                font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em;
                color: ${item.type === 'city' ? '#8B5CF6' : '#EC4899'};
              ">
                ${item.type === 'city' ? 'Destination' : item.category || 'Sight'}
              </span>
              <h4 style="font-size: 15px; font-weight: 800; color: #1E1B4B; margin: 4px 0 6px 0; line-height: 1.2;">
                ${item.name}
              </h4>
              ${
                item.description
                  ? `<p style="font-size: 11px; color: #4B5563; line-height: 1.4; margin: 0 0 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${item.description}
                  </p>`
                  : ''
              }
              <div style="display: flex; gap: 8px;">
                ${
                  item.exploreUrl
                    ? `<a href="${item.exploreUrl}" style="
                      flex: 1; text-align: center; padding: 7px 10px; background: #8B5CF6; color: white;
                      border-radius: 10px; font-size: 10px; font-weight: 700; text-decoration: none;
                      text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 2px 8px rgba(139,92,246,0.3);
                    ">Explore</a>`
                    : ''
                }
                <a href="https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   style="
                     display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;
                     border: 1px solid #E5E7EB; border-radius: 10px; background: #F9FAFB;
                   "
                   title="Get Directions"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          maxWidth: 260,
          className: 'custom-popup-box',
        });

        marker.on('click', () => {
          if (onItemSelect) onItemSelect(item);
        });

        markersRef.current[item.id] = marker;
      });

      // 5. Add route line polyline if routePoints are provided
      if (routePoints && routePoints.length > 1) {
        const polyline = L.polyline(routePoints, {
          color: '#8B5CF6',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8', // Animated or dashed look
          lineCap: 'round',
        }).addTo(map);

        polylineRef.current = polyline;
      }

      // 6. Fit map bounds to items
      const validPoints = items
        .filter((i) => i.latitude && i.longitude)
        .map((i) => [i.latitude, i.longitude] as [number, number]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    };

    updateMapElements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, routePoints, activeItemId]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Global overrides for Leaflet styles inside container */}
      <style jsx global>{`
        .custom-popup-box .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 20px !important;
          padding: 0 !important;
        }
        .custom-popup-box .leaflet-popup-content {
          margin: 0 !important;
        }
        .custom-popup-box .leaflet-popup-tip {
          background: white !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .custom-marker:hover div {
          transform: scale(1.15) !important;
          box-shadow: 0 4px 12px rgba(139,92,246,0.5) !important;
        }
        .active-marker div {
          animation: float-marker 1.5s infinite alternate ease-in-out;
        }
        @keyframes float-marker {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
