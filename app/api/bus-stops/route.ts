import { BusStop, BusStopsResponse } from "@/lib/api";
import axios from "axios";
import { NextResponse } from "next/server";

// Access API key - try both environment variable formats
const API_KEY = process.env.LTA_API_KEY || process.env.NEXT_PUBLIC_LTA_API_KEY;

// Log the API key (but mask it for security)
console.log(
  `Bus stops using API key: ${
    API_KEY ? API_KEY.substring(0, 5) + "..." : "undefined"
  }`
);

// Create the API client with proper headers
const api = axios.create({
  baseURL: "https://datamall2.mytransport.sg/ltaodataservice",
  headers: {
    AccountKey: API_KEY,
    accept: "application/json",
  },
});

export async function GET() {
  try {
    let allStops: BusStop[] = [];
    let skip = 0;
    const limit = 500; // LTA API has a limit of 500 records per request

    while (true) {
      try {
        console.log(`Fetching bus stops with skip=${skip}`);
        const response = await api.get<BusStopsResponse>(
          `/BusStops?$skip=${skip}`
        );
        console.log(`Received ${response.data.value.length} bus stops`);

        const stops = response.data.value;

        if (stops.length === 0) {
          break;
        }

        allStops = [...allStops, ...stops];
        skip += limit;

        // Break if fewer than limit records returned (last page)
        if (stops.length < limit) {
          break;
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Axios error fetching bus stops:", error.message);
          console.error("Status:", error.response?.status);
          console.error("Response data:", error.response?.data);
        } else {
          console.error("Error fetching bus stops:", error);
        }

        // Return what we've got so far instead of breaking with nothing
        if (allStops.length > 0) {
          console.log(
            `Returning ${allStops.length} bus stops collected so far`
          );
          return NextResponse.json(allStops);
        }

        break;
      }
    }

    return NextResponse.json(allStops);
  } catch (error) {
    console.error("Failed to fetch bus stops:", error);
    return NextResponse.json(
      { error: "Failed to fetch bus stops" },
      { status: 500 }
    );
  }
}
