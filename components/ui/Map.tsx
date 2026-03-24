"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Small helper component to fix Leaflet "half-loaded" tile bug
// This forces Leaflet to recalculate the container size once it's fully mounted in the UI
function InvalidateMapSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

// Fix standard Leaflet icon path issues in Next.js by creating a custom SVG marker
const customMarkerIcon = new L.DivIcon({
  className: "custom-leaflet-marker",
  html: renderToStaticMarkup(
    <div style={{ color: "var(--primary)", filter: "drop-shadow(0px 8px 12px rgba(0,0,0,0.4))", transform: "translate(-50%, -100%)", marginTop: "40px", marginLeft: "20px" }}>
      <svg 
        width="48" 
        height="48" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        stroke="white" 
        strokeWidth="1.5"
        strokeLinecap="round" 
        strokeLinejoin="round" 
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    </div>
  ),
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
});

export default function Map({ address }: { address: string }) {
  // Use Shaheen Bagh, Okhla coordinates as base
  const position: [number, number] = [28.5458, 77.3039];
  
  // Sleek, minimal monochrome maps (CartoDB Positron) without the retina tag to prevent 404s
  const tileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full relative" style={{ height: "500px", borderRadius: "inherit" }}>
      <MapContainer 
        center={position} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        <InvalidateMapSize />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />
        <ZoomControl position="bottomright" />
        <Marker position={position} icon={customMarkerIcon}>
          <Popup className="custom-leaflet-popup">
            <div className="p-2 text-center min-w-[150px]">
              <h3 className="font-bold text-slate-900 text-[16px] mb-1.5 leading-tight tracking-tight">TaxFiling24 HQ</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">{address}</p>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block w-full text-center bg-[var(--primary)] !text-white text-[11px] font-bold py-2 rounded-lg hover:bg-opacity-90 transition-all shadow-sm"
              >
                Get Directions
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Global styles specifically targeting leaflet elements to match our theme */}
      <style jsx global>{`
        .custom-leaflet-marker {
          background: transparent;
          border: none;
        }
        .leaflet-container {
          font-family: inherit;
          background-color: #f8fafc;
        }
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 8px;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .leaflet-control-zoom a {
          color: var(--primary) !important;
          border-radius: 8px !important;
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        .leaflet-control-zoom {
          border: none !important;
        }
      `}</style>
    </div>
  );
}
