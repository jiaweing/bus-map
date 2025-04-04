import { BusArrivalsResponse } from "@/lib/api";
import axios from "axios";
import { NextResponse } from "next/server";

// Access API key - try both environment variable formats
const API_KEY = process.env.LTA_API_KEY || process.env.NEXT_PUBLIC_LTA_API_KEY;

// Log the API key (but mask it for security)
console.log(
  `Bus arrivals using API key: ${
    API_KEY ? API_KEY.substring(0, 5) + "..." : "undefined"
  }`
);

const api = axios.create({
  baseURL: "https://datamall2.mytransport.sg/ltaodataservice",
  headers: {
    AccountKey: API_KEY,
    accept: "application/json",
  },
});

export async function GET(request: Request) {
  // Extract bus stop code from the query parameters
  const { searchParams } = new URL(request.url);
  const busStopCode = searchParams.get("BusStopCode");

  if (!busStopCode) {
    return NextResponse.json(
      { error: "BusStopCode is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching arrivals for bus stop ${busStopCode}`);
    const response = await api.get<BusArrivalsResponse>(
      `/BusArrivalv2?BusStopCode=${busStopCode}`
    );
    console.log(`Successfully received bus arrivals data`);
    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Axios error fetching arrivals for stop ${busStopCode}:`,
        error.message
      );
      console.error("Status:", error.response?.status);
      console.error("Response data:", error.response?.data);
    } else {
      console.error(`Error fetching arrivals for stop ${busStopCode}:`, error);
    }
    return NextResponse.json(
      { error: `Failed to fetch bus arrivals for stop ${busStopCode}` },
      { status: 500 }
    );
  }
}
