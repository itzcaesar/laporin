// ── components/map/LocationPicker.tsx ──
"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Crosshair, Loader2 } from "lucide-react";

// Fix Leaflet default marker icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom blue marker icon
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to recenter map
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : [-6.9175, 107.6191] // Default: Bandung
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    
    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      onLocationSelect(lat, lng, address);
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolocation.");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        
        // Reverse geocode
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          onLocationSelect(latitude, longitude, address);
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          onLocationSelect(latitude, longitude, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (!isClient) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Get Location Button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={isGettingLocation}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue bg-blue/5 px-4 py-3 text-sm font-semibold text-blue transition-all hover:bg-blue/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGettingLocation ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Mendeteksi Lokasi...
          </>
        ) : (
          <>
            <Crosshair size={18} />
            Gunakan Lokasi Saat Ini
          </>
        )}
      </button>

      {/* Map Container */}
      <div className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-sm">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: "320px", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onLocationSelect={handleMapClick} />
          <RecenterMap lat={mapCenter[0]} lng={mapCenter[1]} />
          
          {position && (
            <Marker position={position} icon={blueIcon} />
          )}
        </MapContainer>
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
        <div className="flex gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-blue" />
          <p className="text-xs text-blue-700">
            <strong>Cara menggunakan:</strong> Klik pada peta untuk menandai lokasi, atau gunakan tombol "Lokasi Saat Ini" untuk deteksi otomatis.
          </p>
        </div>
      </div>

      {/* Coordinates Display */}
      {position && (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-muted mb-1">Koordinat yang dipilih:</p>
          <p className="font-mono text-sm font-semibold text-navy">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}
