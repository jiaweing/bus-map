import MapClient from "@/components/MapClient";

export const metadata = {
  title: "Singapore Bus Map",
  description:
    "Interactive map showing live bus locations and stops in Singapore",
};

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* The MapClient component will load our bus map */}
      <MapClient />
    </div>
  );
}
