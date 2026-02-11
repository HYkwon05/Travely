import React, { useState } from 'react';
import { Trip, BlockType, PlaceCategory } from '../types';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Filter } from 'lucide-react';

interface MapViewProps {
  trip: Trip;
}

// Default Rome Coordinates
const DEFAULT_CENTER: [number, number] = [41.9028, 12.4964]; 

// Helper to get Icon and Color by Category
const getCategoryStyle = (category: PlaceCategory) => {
    switch (category) {
        case 'RESTAURANT':
            return { 
                bg: 'bg-[#f59e0b]', // Amber 500
                iconPath: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2s-7 0-8 0zm8 11h-1v8h1v-8zm5-9a3 3 0 0 1 3 3v4h-1v8h-1v-8h-1v-4a3 3 0 0 1 .57-1.85' // Utensils-ish
            };
        case 'CAFE':
            return { 
                bg: 'bg-[#8b5cf6]', // Violet 500
                iconPath: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z M6 2v2 M10 2v2 M14 2v2' // Coffee
            };
        case 'GELATO':
            return { 
                bg: 'bg-[#ec4899]', // Pink 500
                iconPath: 'M7 11c.3-.6 1.1-.6 1.4 0 .3.6 1.1.6 1.4 0 .3-.6 1.1-.6 1.4 0 M12 22l-5-9h10l-5 9Z' // Ice cream cone-ish
            };
        case 'BAR':
            return { 
                bg: 'bg-[#1e293b]', // Slate 800
                iconPath: 'M8 22h8 M12 15v7 M6.5 2h11l-2 10.2a3 3 0 0 1-3 2.8h-1a3 3 0 0 1-3-2.8L6.5 2Z' // Wine glass
            };
        case 'ATTRACTION':
            return { 
                bg: 'bg-[#3b82f6]', // Blue 500
                iconPath: 'M3 22v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8 M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4 M12 2v4' // Landmark/Bank
            };
        case 'ACCOMMODATION':
            return { 
                bg: 'bg-[#0ea5e9]', // Sky 500
                iconPath: 'M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9' // Bed
            };
        default:
            return { 
                bg: 'bg-[#cbd5e1]', 
                iconPath: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' // Heart
            };
    }
};

export const MapView: React.FC<MapViewProps> = ({ trip }) => {
  const [selectedDayId, setSelectedDayId] = useState<string>('ALL');
  
  const savedLocations = trip.savedPlaces.filter(p => p.isSaved && p.lat && p.lng);
  
  // Collect all day locations that have coordinates
  const dayRoutes = trip.days.map((day, idx) => {
      const locations: { lat: number; lng: number; name: string; id: string }[] = [];
      const lines: { positions: [number, number][]; color: string; dashArray?: string }[] = [];
      
      let previousLocBlock: any = null;
      let pendingTransport: any = null;
      
      day.blocks.forEach(block => {
          if (block.type === BlockType.LOCATION && block.meta?.lat && block.meta?.lng) {
              const currentLoc = { lat: block.meta.lat, lng: block.meta.lng };
              locations.push({ ...currentLoc, name: block.content, id: block.id });
              
              if (previousLocBlock) {
                  lines.push({
                       positions: [[previousLocBlock.meta.lat, previousLocBlock.meta.lng], [block.meta.lat, block.meta.lng]],
                       color: pendingTransport?.meta?.color || '#3b82f6', // Use transport color or default Blue
                       dashArray: pendingTransport ? '5, 5' : undefined // Dotted if explicit transport, solid if implicit
                  });
              }
              previousLocBlock = block;
              pendingTransport = null;
          }
          if (block.type === BlockType.TRANSPORT) {
              pendingTransport = block;
          }
      });

      return { id: day.id, idx, locations, lines };
  });

  const filteredRoutes = selectedDayId === 'ALL' 
    ? dayRoutes 
    : dayRoutes.filter(d => d.id === selectedDayId);

  return (
    <div className="h-full w-full relative z-0">
      
      {/* Day Filter Control */}
      <div className="absolute top-4 right-4 z-[400] bg-white rounded-lg shadow-md p-2 flex items-center gap-2 border border-[#e2e8f0]">
          <Filter size={16} className="text-[#64748b]" />
          <select 
            className="bg-transparent text-sm font-bold text-[#1e293b] outline-none"
            value={selectedDayId}
            onChange={(e) => setSelectedDayId(e.target.value)}
          >
              <option value="ALL">All Days</option>
              {trip.days.map((day, i) => (
                  <option key={day.id} value={day.id}>Day {i + 1}</option>
              ))}
          </select>
      </div>

      <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* --- 1. Saved Places Markers (Category Styled) --- */}
        {savedLocations.map(place => {
            const style = getCategoryStyle(place.category);
            return (
                <Marker 
                    key={place.id} 
                    position={[place.lat!, place.lng!]}
                    icon={createCustomIcon(`
                        <div class="w-9 h-9 ${style.bg} rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="${style.iconPath}" />
                            </svg>
                        </div>
                    `)}
                >
                    <Popup>
                        <div className="flex flex-col gap-1 min-w-[150px]">
                            <div className="font-bold text-base font-hand text-[#1e293b]">{place.name}</div>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f8fafc] w-fit font-medium text-[#64748b]">{place.category}</span>
                            <div className="text-xs text-[#334155] mt-1">{place.description}</div>
                        </div>
                    </Popup>
                </Marker>
            );
        })}

        {/* --- 2. Itinerary Locations (Numbers) --- */}
        {filteredRoutes.flatMap((day) => 
            day.locations.map((loc, idx) => (
                <Marker 
                    key={loc.id} 
                    position={[loc.lat, loc.lng]}
                    icon={createCustomIcon(`
                        <div class="w-8 h-8 bg-[#1e293b] rounded-full flex items-center justify-center shadow-lg text-white font-bold text-sm border-2 border-white relative">
                            ${idx + 1}
                            <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-[#3b82f6] rounded-full flex items-center justify-center text-[8px] text-white border border-white">D${day.idx + 1}</div>
                        </div>
                    `)}
                >
                    <Popup>
                        <div className="font-bold font-hand">Day {day.idx + 1}: {loc.name}</div>
                    </Popup>
                </Marker>
            ))
        )}

        {/* --- 3. Routes (Lines) --- */}
        {filteredRoutes.flatMap(day => 
            day.lines.map((line, idx) => (
                <Polyline 
                    key={`${day.id}-${idx}`}
                    positions={line.positions}
                    pathOptions={{ color: line.color, dashArray: line.dashArray, weight: 4, opacity: 0.8 }}
                />
            ))
        )}

      </MapContainer>
    </div>
  );
};

// Helper to create HTML Icon
function createCustomIcon(html: string) {
    return L.divIcon({
        html: html,
        className: 'custom-div-icon', // defined in index.html style
        iconSize: [36, 36],
        iconAnchor: [18, 36], // Bottom center anchor
        popupAnchor: [0, -36]
    });
}