'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const POSITION: [number, number] = [-7.8055022, 110.3838086]; // Asrama Mahasiswa Kabupaten Sambas Yogyakarta

function ZoomAnimator() {
  const map = useMap();

  useEffect(() => {
    const isLowEnd = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      && window.matchMedia('(pointer: coarse)').matches;

    if (isLowEnd) {
      // Mobile: fast fly, minimal tile download
      const timer = setTimeout(() => {
        map.flyTo(POSITION, 18, { duration: 1 });
      }, 200);
      return () => clearTimeout(timer);
    }
    // Desktop: cinematic zoom
    const timer = setTimeout(() => {
      map.flyTo(POSITION, 18, { duration: 3 });
    }, 800);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function MapLeaflet() {
  return (
    <div className="h-[240px] sm:h-[320px] md:h-[380px] w-full rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 shadow-md relative z-0">
      <MapContainer 
        center={POSITION} 
        zoom={11} // Start zoomed out 
        maxZoom={18}
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={POSITION}>
          <Popup>
            <div className="text-center">
              <strong>Asrama Mahasiswa Kabupaten Sambas Yogyakarta</strong><br/>
              <span className="text-xs text-muted-foreground mt-1 block">
                Gg. Beo No.328, Tahunan, Kec. Umbulharjo<br/>
                Kota Yogyakarta, DIY 55167
              </span>
            </div>
          </Popup>
        </Marker>
        <ZoomAnimator />
      </MapContainer>
    </div>
  );
}
