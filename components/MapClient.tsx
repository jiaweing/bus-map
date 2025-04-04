"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Import the map component with SSR disabled
const BusMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  ),
});

export default function MapClient() {
  return <BusMap />;
}
