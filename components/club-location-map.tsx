"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ClubLocationMapProps {
  lat: number;
  lng: number;
  clubName: string;
  address?: string;
}

// Custom padel ball marker icon
const createPadelMarkerIcon = () => {
  return L.divIcon({
    className: "custom-padel-marker",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4), 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            width: 100%;
            height: 2px;
            background: rgba(255,255,255,0.6);
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: 100%;
            height: 2px;
            background: rgba(255,255,255,0.6);
          "></div>
        </div>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid #0369a1;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        "></div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

export function ClubLocationMap({
  lat,
  lng,
  clubName,
  address,
}: ClubLocationMapProps) {
  const [markerIcon, setMarkerIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    setMarkerIcon(createPadelMarkerIcon());
  }, []);

  return (
    <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <style jsx global>{`
        .custom-padel-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          height: 100%;
          width: 100%;
          border-radius: 0.75rem;
          z-index: 1 !important;
        }
        .leaflet-pane {
          z-index: 1 !important;
        }
        .leaflet-map-pane {
          z-index: 1 !important;
        }
        .leaflet-tile-pane {
          z-index: 1 !important;
        }
        .leaflet-overlay-pane {
          z-index: 2 !important;
        }
        .leaflet-shadow-pane {
          z-index: 3 !important;
        }
        .leaflet-marker-pane {
          z-index: 4 !important;
        }
        .leaflet-tooltip-pane {
          z-index: 5 !important;
        }
        .leaflet-popup-pane {
          z-index: 6 !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .leaflet-popup-content {
          margin: 12px 16px;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markerIcon && (
          <Marker position={[lat, lng]} icon={markerIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-slate-900 text-sm mb-1">
                  {clubName}
                </p>
                {address && (
                  <p className="text-slate-500 text-xs">{address}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// Wrapper component that handles missing coordinates gracefully
interface ClubLocationMapWrapperProps {
  lat?: number | null;
  lng?: number | null;
  clubName: string;
  address?: string;
  mapsUrl?: string | null;
}

export function ClubLocationMapWrapper({
  lat,
  lng,
  clubName,
  address,
  mapsUrl,
}: ClubLocationMapWrapperProps) {
  // If no coordinates, don't render the map section at all
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return null;
  }

  return (
    <div className="p-6 rounded-2xl bg-white border shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Location</h3>
      <ClubLocationMap
        lat={lat}
        lng={lng}
        clubName={clubName}
        address={address}
      />
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl font-bold text-slate-900 hover:bg-slate-50 transition-all text-sm"
        >
          Open in Google Maps
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
