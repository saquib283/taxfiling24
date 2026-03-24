"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Dynamically import the map component with SSR disabled
// Leaflet heavily relies on the window object which is not available during Next.js server-side rendering
const DynamicMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />,
});

// A sleek loading state while the map tiles and library load
const MapLoadingPlaceholder = () => (
  <div className="w-full h-[500px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200" style={{ borderRadius: "inherit" }}>
    <div className="h-16 w-16 mb-4 rounded-full bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
      <MapPin className="h-8 w-8" />
    </div>
    <div className="h-4 w-48 bg-slate-200 rounded-full animate-pulse mb-2"></div>
    <div className="h-3 w-32 bg-slate-100 rounded-full animate-pulse"></div>
  </div>
);

interface ContactMapProps {
  address: string;
}

export default function ContactMap({ address }: ContactMapProps) {
  return (
    <div className="relative w-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-2 bg-white/50 backdrop-blur-xl group">
      {/* Decorative background glows */}
      <div className="absolute -inset-1 rounded-[3rem] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-5 blur-xl group-hover:opacity-10 transition-opacity duration-500 -z-10" />
      
      {/* Map Inner Container */}
      <div className="w-full h-full min-h-[500px] bg-slate-50 rounded-[2.2rem] overflow-hidden relative border border-slate-100/50 relative z-10">
        <DynamicMap address={address} />
        
        {/* Floating Contact Card over Map */}
        <div className="absolute top-6 left-6 z-[400] bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white max-w-xs transition-transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-[var(--primary)]">
               <MapPin className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-900 leading-tight">Corporate<br/>Headquarters</h4>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed pl-1">
            {address}
          </p>
        </div>
      </div>
    </div>
  );
}
