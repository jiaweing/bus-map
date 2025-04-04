"use client";

import {
  BusStop,
  getBusArrivals,
  getBusStops,
  getNearbyBusStops,
} from "@/lib/api";
import useLocation from "@/lib/hooks/useLocation";
import type { Icon } from "leaflet";
import { BusFront, Loader2, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";

// TypeScript declarations to handle window.L
declare global {
  interface Window {
    L: typeof import("leaflet") | undefined;
  }
}

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
  }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  {
    ssr: false,
  }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  {
    ssr: false,
  }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  {
    ssr: false,
  }
);
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  {
    ssr: false,
  }
);

// Helper function to safely create SVG data URLs
const createSvgDataUrl = (svgContent: string): string => {
  if (typeof window === "undefined") return "";
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

// Custom bus icons using Lucide - returns undefined instead of null for compatibility
const createBusIcon = (
  color: string,
  serviceNo: string,
  type: string,
  busStopCode?: string,
  busStopDescription?: string
): Icon | undefined => {
  if (typeof window === "undefined" || !window.L) return undefined;

  // Define background color based on load with better color palette
  const bgColor =
    color === "green"
      ? "#10B981" // Emerald-500
      : color === "yellow"
      ? "#F59E0B" // Amber-500
      : color === "red"
      ? "#EF4444" // Red-500
      : "#3B82F6"; // Blue-500

  // Determine deck type indicator
  const isDeckTypeDefined = type === "DD" || type === "SD";
  const deckTypeSymbol = type === "DD" ? "D" : "S"; // D for Double Deck, S for Single Deck

  // Create a wrapper SVG with enhanced information
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="76" height="68" viewBox="0 0 76 68">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3" />
      </filter>
    </defs>
    
    <!-- Bus Status Circle -->
    <circle cx="38" cy="24" r="20" fill="${bgColor}" stroke="#00000022" stroke-width="1" filter="url(#shadow)" />
    
    <!-- Bus Icon -->
    <g transform="translate(27, 11)">
      ${renderToString(
        <BusFront
          size={18}
          color="white"
          strokeWidth={1.5}
          absoluteStrokeWidth
        />
      )}
    </g>
    
    <!-- Bus number -->
    <text x="38" y="34" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="white">
      ${serviceNo}
    </text>
    
    <!-- Deck type indicator -->
    ${
      isDeckTypeDefined
        ? `<circle cx="52" cy="12" r="8" fill="#FFFFFF" fill-opacity="0.9" stroke="#00000033" />
    <text x="52" y="15" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="${bgColor}">
      ${deckTypeSymbol}
    </text>`
        : ""
    }
    
    <!-- Bus Stop Information Background -->
    ${
      busStopCode
        ? `<rect x="8" y="48" width="60" height="16" rx="4" fill="#FFFFFF" fill-opacity="0.9" stroke="#00000033" stroke-width="1" />
    <text x="38" y="59" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle" fill="#333333">
      ${busStopCode} ${
            busStopDescription
              ? "- " +
                (busStopDescription.length > 15
                  ? busStopDescription.substring(0, 15) + "..."
                  : busStopDescription)
              : ""
          }
    </text>`
        : ""
    }
  </svg>`;

  return new window.L.Icon({
    iconUrl: createSvgDataUrl(svgContent.replace(/style="[^"]*"/g, "")),
    iconSize: [76, 68],
    iconAnchor: [38, 34],
    popupAnchor: [0, -34],
  });
};

// Custom bus stop icon using Lucide
const createStopIcon = (): Icon | undefined => {
  if (typeof window === "undefined" || !window.L) return undefined;

  // Create a wrapper SVG with an elegant white circle and positioned MapPin icon
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.2" />
      </filter>
    </defs>
    <circle cx="14" cy="14" r="11" fill="#FFFFFF" stroke="#00000033" stroke-width="1" filter="url(#shadow)" />
    <g transform="translate(8, 6)">
      ${renderToString(
        <MapPin
          size={12}
          color="#000000"
          strokeWidth={1.5}
          absoluteStrokeWidth
        />
      )}
    </g>
  </svg>`;

  return new window.L.Icon({
    iconUrl: createSvgDataUrl(svgContent.replace(/style="[^"]*"/g, "")),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Custom user location icon
const createUserIcon = (): Icon | undefined => {
  if (typeof window === "undefined" || !window.L) return undefined;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <defs>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feFlood flood-color="#3B82F6" flood-opacity="0.3" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="shadow" />
        <feComposite in="SourceGraphic" in2="shadow" operator="over" />
      </filter>
    </defs>
    <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#1D4ED8" stroke-width="1" opacity="0.8" filter="url(#glow)" />
    <circle cx="12" cy="12" r="3" fill="#1D4ED8" />
  </svg>`;

  return new window.L.Icon({
    iconUrl: createSvgDataUrl(svgContent),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// We'll just use built-in Leaflet methods instead of trying to
// update the map center via a custom component

interface LiveBus {
  serviceNo: string;
  busStopCode: string;
  busStopDescription: string;
  latitude: number;
  longitude: number;
  estimatedArrival: string;
  type: string;
  load: string;
  feature: string;
}

// Custom React component for map controls
const MapControls = ({
  radius,
  setRadius,
}: {
  radius: number;
  setRadius: (value: number) => void;
}) => {
  return (
    <div className="absolute top-4 left-4 z-[9999] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg pointer-events-auto">
      <div className="flex items-center gap-2">
        <label htmlFor="radius" className="text-sm font-medium">
          Radius:
        </label>
        <select
          id="radius"
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="block w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600"
        >
          <option value="500">500m</option>
          <option value="1000">1km</option>
          <option value="2000">2km</option>
          <option value="3000">3km</option>
        </select>
      </div>
    </div>
  );
};

// Legend component
const MapLegend = () => {
  return (
    <div className="absolute bottom-4 right-4 z-[9999] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg pointer-events-auto">
      <div className="text-sm font-medium mb-2">Bus Information</div>
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-xs font-medium mb-1">Bus Load</div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#10B981" }}
              ></div>
              <span className="text-xs">Seats Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#F59E0B" }}
              ></div>
              <span className="text-xs">Standing Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#EF4444" }}
              ></div>
              <span className="text-xs">Limited Standing</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium mb-1">Deck Type</div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-300 text-xs font-bold">
                D
              </div>
              <span className="text-xs">Double Deck</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-300 text-xs font-bold">
                S
              </div>
              <span className="text-xs">Single Deck</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium mb-1">Next Bus Stop</div>
          <div className="flex items-center gap-2">
            <div className="bg-white border border-gray-300 rounded-md px-2 py-0.5 text-2xs">
              12345 - Example Stop
            </div>
          </div>
          <span className="text-2xs text-gray-500 mt-1">
            Shows code and name of the next bus stop
          </span>
        </div>
      </div>
    </div>
  );
};

export default function BusMap() {
  const location = useLocation();
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [nearbyBusStops, setNearbyBusStops] = useState<BusStop[]>([]);
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(1000); // 1km radius
  const [mapReady, setMapReady] = useState(false);

  // Load Leaflet CSS and initialize Leaflet when component mounts
  useEffect(() => {
    // This ensures we only run in the browser
    if (typeof window === "undefined") return;

    const loadLeafletResources = async () => {
      try {
        // Load Leaflet JS
        const L = await import("leaflet");
        window.L = L;

        // Add Leaflet CSS
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        style.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        style.crossOrigin = "";
        document.head.appendChild(style);

        setMapReady(true);
      } catch (error) {
        console.error("Failed to load Leaflet resources:", error);
        setError("Failed to load map resources");
      }
    };

    loadLeafletResources();
  }, []);

  // Fetch all bus stops on component mount
  useEffect(() => {
    const fetchBusStops = async () => {
      try {
        const stops = await getBusStops();
        setBusStops(stops);
      } catch (err) {
        setError("Failed to fetch bus stops. Please check your API key.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusStops();
  }, []);

  // Update nearby bus stops when location changes
  useEffect(() => {
    if (location.latitude && location.longitude && busStops.length > 0) {
      const nearby = getNearbyBusStops(
        busStops,
        location.latitude,
        location.longitude,
        radius
      );
      setNearbyBusStops(nearby);
    }
  }, [location.latitude, location.longitude, busStops, radius]);

  // Fetch bus arrival times for nearby bus stops
  useEffect(() => {
    const fetchBusArrivals = async () => {
      if (nearbyBusStops.length === 0) return;

      // Map to keep track of unique buses by their coordinates and service number
      const uniqueBusesMap = new Map<string, LiveBus>();

      for (const stop of nearbyBusStops) {
        try {
          const arrivals = await getBusArrivals(stop.BusStopCode);

          if (!arrivals.Services) continue;

          arrivals.Services.forEach((service) => {
            // Add buses with valid coordinates
            if (
              service.NextBus &&
              service.NextBus.Latitude &&
              service.NextBus.Longitude
            ) {
              const lat = parseFloat(service.NextBus.Latitude);
              const lng = parseFloat(service.NextBus.Longitude);

              if (!isNaN(lat) && !isNaN(lng)) {
                // Create a unique key based on service number and coordinates
                // Use a precision of 6 decimal places for coordinates
                const uniqueKey = `${service.ServiceNo}-${lat.toFixed(
                  6
                )}-${lng.toFixed(6)}`;

                // Only add this bus if we haven't seen it before
                if (!uniqueBusesMap.has(uniqueKey)) {
                  const bus = {
                    serviceNo: service.ServiceNo,
                    busStopCode: stop.BusStopCode,
                    busStopDescription: stop.Description,
                    latitude: lat,
                    longitude: lng,
                    estimatedArrival: service.NextBus.EstimatedArrival,
                    type: service.NextBus.Type,
                    load: service.NextBus.Load,
                    feature: service.NextBus.Feature,
                  };
                  uniqueBusesMap.set(uniqueKey, bus);
                }
              }
            }

            if (
              service.NextBus2 &&
              service.NextBus2.Latitude &&
              service.NextBus2.Longitude
            ) {
              const lat = parseFloat(service.NextBus2.Latitude);
              const lng = parseFloat(service.NextBus2.Longitude);

              if (!isNaN(lat) && !isNaN(lng)) {
                const uniqueKey = `${service.ServiceNo}-${lat.toFixed(
                  6
                )}-${lng.toFixed(6)}`;

                if (!uniqueBusesMap.has(uniqueKey)) {
                  const bus = {
                    serviceNo: service.ServiceNo,
                    busStopCode: stop.BusStopCode,
                    busStopDescription: stop.Description,
                    latitude: lat,
                    longitude: lng,
                    estimatedArrival: service.NextBus2.EstimatedArrival,
                    type: service.NextBus2.Type,
                    load: service.NextBus2.Load,
                    feature: service.NextBus2.Feature,
                  };
                  uniqueBusesMap.set(uniqueKey, bus);
                }
              }
            }

            if (
              service.NextBus3 &&
              service.NextBus3.Latitude &&
              service.NextBus3.Longitude
            ) {
              const lat = parseFloat(service.NextBus3.Latitude);
              const lng = parseFloat(service.NextBus3.Longitude);

              if (!isNaN(lat) && !isNaN(lng)) {
                const uniqueKey = `${service.ServiceNo}-${lat.toFixed(
                  6
                )}-${lng.toFixed(6)}`;

                if (!uniqueBusesMap.has(uniqueKey)) {
                  const bus = {
                    serviceNo: service.ServiceNo,
                    busStopCode: stop.BusStopCode,
                    busStopDescription: stop.Description,
                    latitude: lat,
                    longitude: lng,
                    estimatedArrival: service.NextBus3.EstimatedArrival,
                    type: service.NextBus3.Type,
                    load: service.NextBus3.Load,
                    feature: service.NextBus3.Feature,
                  };
                  uniqueBusesMap.set(uniqueKey, bus);
                }
              }
            }
          });
        } catch (err) {
          console.error(
            `Error fetching arrivals for stop ${stop.BusStopCode}:`,
            err
          );
        }
      }

      // Convert map values to array for state update
      setLiveBuses(Array.from(uniqueBusesMap.values()));
    };

    fetchBusArrivals();

    // Refresh bus positions every 15 seconds
    const interval = setInterval(fetchBusArrivals, 15000);
    return () => clearInterval(interval);
  }, [nearbyBusStops]);

  // Get bus load color
  const getBusLoadColor = (load: string) => {
    switch (load) {
      case "SEA":
        return "green"; // Seats Available
      case "SDA":
        return "yellow"; // Standing Available
      case "LSD":
        return "red"; // Limited Standing
      default:
        return "blue";
    }
  };

  // Format arrival time
  const formatArrivalTime = (dateString: string) => {
    if (!dateString) return "NA";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins <= 0) return "Arriving";
      if (diffMins === 1) return "1 min";
      return `${diffMins} mins`;
    } catch (error) {
      console.error("Error formatting arrival time:", error);
      return "NA";
    }
  };

  // No need for handleMapReady function since we use declarative center prop

  // If no location and not loading, show error
  if (!location.loading && !location.latitude && !location.longitude) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-muted-foreground">
          {location.error ||
            "Unable to get your location. Please enable location services and refresh the page."}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || location.loading || !mapReady) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-muted-foreground">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      {/* Map container - absolute positioned so we can overlay our controls */}
      <div className="absolute inset-0">
        {location.latitude && location.longitude && mapReady && (
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            {/* Zoom control */}
            <ZoomControl position="bottomleft" />

            {/* Map tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Current location marker */}
            <Marker
              position={[location.latitude, location.longitude]}
              icon={createUserIcon()}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">Your Location</h3>
                </div>
              </Popup>
            </Marker>

            {/* Radius circle */}
            <Circle
              center={[location.latitude, location.longitude]}
              radius={radius}
              pathOptions={{ fillColor: "blue", fillOpacity: 0.1, weight: 1 }}
            />

            {/* Bus stop markers */}
            {nearbyBusStops.map((stop) => (
              <Marker
                key={stop.BusStopCode}
                position={[stop.Latitude, stop.Longitude]}
                icon={createStopIcon()}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{stop.Description}</h3>
                    <p className="text-sm">Bus Stop: {stop.BusStopCode}</p>
                    <p className="text-xs text-gray-600">{stop.RoadName}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Live bus markers */}
            {liveBuses.map((bus, index) => (
              <Marker
                key={`${bus.serviceNo}-${bus.busStopCode}-${index}`}
                position={[bus.latitude, bus.longitude]}
                icon={createBusIcon(
                  getBusLoadColor(bus.load),
                  bus.serviceNo,
                  bus.type,
                  bus.busStopCode,
                  bus.busStopDescription
                )}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">Bus {bus.serviceNo}</h3>
                    <p>
                      Arriving in: {formatArrivalTime(bus.estimatedArrival)}
                    </p>
                    <p>
                      Type:{" "}
                      {bus.type === "DD"
                        ? "Double Deck"
                        : bus.type === "SD"
                        ? "Single Deck"
                        : bus.type}
                    </p>
                    <p>
                      Features:{" "}
                      {bus.feature === "WAB"
                        ? "Wheelchair Accessible"
                        : bus.feature}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Controls overlaid above the map with high z-index to ensure visibility */}
      {!loading &&
        !error &&
        location.latitude &&
        location.longitude &&
        mapReady && (
          <>
            <MapControls radius={radius} setRadius={setRadius} />
            <MapLegend />
          </>
        )}
    </div>
  );
}
