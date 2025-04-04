# Singapore Bus Map

An interactive web application that displays real-time Singapore bus locations and bus stops around the user's current location. The app provides live updates of bus arrivals and their statuses.

## Features

- 📍 **Current Location**: Shows the user's current location on the map
- 🚏 **Nearby Bus Stops**: Displays all bus stops within a configurable radius
- 🚌 **Live Bus Locations**: Shows real-time positions of buses on the map
- ⏱️ **Arrival Times**: Provides estimated arrival times for upcoming buses
- 📱 **Responsive Design**: Works on both mobile and desktop devices
- 🔄 **Real-time Updates**: Refreshes bus positions automatically every 15 seconds

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Leaflet for interactive maps
- LTA DataMall APIs for Singapore bus data
- Tailwind CSS for styling
- SWR for data fetching and caching

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- PNPM package manager
- LTA DataMall API Key (obtainable from [LTA DataMall](https://datamall.lta.gov.sg/))

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create an `.env.local` file and add your LTA API key:
   ```
   NEXT_PUBLIC_LTA_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Allow location access when prompted
2. Adjust the radius to see more or fewer bus stops
3. Click on bus stops or buses to see more information
4. The map will automatically update with new bus positions every 15 seconds

## API Documentation

The application uses the following LTA DataMall APIs:

- **Bus Stops**: Retrieves all bus stop locations
- **Bus Arrivals**: Gets real-time bus arrival information for specific bus stops
- **Bus Services**: Provides information about bus service routes

## License

This project is open-source and available under the MIT License.

## Acknowledgements

- [LTA DataMall](https://datamall.lta.gov.sg/) for providing the APIs
- [Leaflet](https://leafletjs.com/) for the mapping library
- [Next.js](https://nextjs.org/) for the React framework
