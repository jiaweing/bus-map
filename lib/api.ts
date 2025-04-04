import axios from "axios";

// Configure axios with a base URL of our local API endpoints
const api = axios.create({
  baseURL: "/api",
});

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
}

export interface Bus {
  ServiceNo: string;
  Operator: string;
  NextBus: BusArrival;
  NextBus2: BusArrival;
  NextBus3: BusArrival;
}

export interface BusArrival {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string;
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: string;
  Feature: string;
  Type: string;
}

export interface BusStopsResponse {
  value: BusStop[];
}

export interface BusArrivalsResponse {
  BusStopCode: string;
  Services: Bus[];
}

// Fetch all bus stops
export async function getBusStops(): Promise<BusStop[]> {
  try {
    console.log("Fetching bus stops from API");
    const response = await api.get<BusStop[]>("/bus-stops");
    return response.data;
  } catch (error) {
    console.error("Error fetching bus stops:", error);
    throw error;
  }
}

// Get bus stops near the user's location
export function getNearbyBusStops(
  busStops: BusStop[],
  latitude: number,
  longitude: number,
  radius: number = 1000
): BusStop[] {
  // Calculate distance using the Haversine formula
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return busStops.filter((stop) => {
    const distance = getDistance(
      latitude,
      longitude,
      stop.Latitude,
      stop.Longitude
    );
    return distance <= radius;
  });
}

// Fetch bus arrivals for a specific bus stop
export async function getBusArrivals(
  busStopCode: string
): Promise<BusArrivalsResponse> {
  try {
    console.log(`Fetching arrivals for stop ${busStopCode} from API`);
    const response = await api.get<BusArrivalsResponse>(
      `/bus-arrivals?BusStopCode=${busStopCode}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching arrivals for stop ${busStopCode}:`, error);
    throw error;
  }
}
