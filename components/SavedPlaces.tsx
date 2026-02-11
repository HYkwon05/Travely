import React, { useState } from 'react';
import { SavedPlace, PlaceCategory, BookingStatus } from '../types';
import { Heart, MapPin, Star, Plus, X, Map, ExternalLink, Trash2 } from 'lucide-react';

interface SavedPlacesProps {
  places: SavedPlace[];
  onToggleSave: (id: string) => void;
  onRemovePlace: (id: string) => void;
  onAddPlace: (place: SavedPlace) => void;
}

const CATEGORIES: (PlaceCategory | 'ALL')[] = [
    'ALL', 'RESTAURANT', 'CAFE', 'GELATO', 'BAR', 'ATTRACTION', 'ACCOMMODATION'
];

const BOOKING_OPTIONS: { value: BookingStatus; label: string; color: string }[] = [
    { value: 'NONE', label: 'No Booking', color: 'bg-gray-100 text-gray-500' },
    { value: 'PENDING', label: 'Need', color: 'bg-[#fef3c7] text-[#92400e]' },
    { value: 'BOOKED', label: 'Booked', color: 'bg-[#dbeafe] text-[#1e40af]' },
];

export const SavedPlaces: React.FC<SavedPlacesProps> = ({ places, onToggleSave, onRemovePlace, onAddPlace }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlace, setNewPlace] = useState<Partial<SavedPlace>>({ 
      category: 'RESTAURANT', 
      rating: 5, 
      reviewCount: 0, 
      bookingStatus: 'NONE',
      // Default coordinates (approx. center of Rome) to encourage map usage
      lat: 41.9028,
      lng: 12.4964
  });

  const filteredPlaces = places.filter(p => filter === 'ALL' || p.category === filter);

  const handleOpenModal = () => {
      setNewPlace(prev => ({
          ...prev,
          category: (filter !== 'ALL' ? filter as PlaceCategory : 'RESTAURANT'),
          name: '',
          description: '',
          imageUrl: '',
          googleMapLink: '',
          lat: 41.9028,
          lng: 12.4964
      }));
      setIsModalOpen(true);
  };

  const handleAddSubmit = () => {
      if (!newPlace.name) return;
      
      const place: SavedPlace = {
          id: crypto.randomUUID(),
          name: newPlace.name,
          category: newPlace.category as PlaceCategory,
          description: newPlace.description || '',
          rating: newPlace.rating || 5,
          reviewCount: 0,
          imageUrl: newPlace.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500', // Default generic image
          isSaved: true,
          bookingStatus: newPlace.bookingStatus || 'NONE',
          googleMapLink: newPlace.googleMapLink,
          lat: newPlace.lat,
          lng: newPlace.lng
      };
      
      onAddPlace(place);
      setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative">
      {/* Category Tabs */}
      <div className="px-4 py-3 bg-white border-b border-[#cbd5e1] overflow-x-auto no-scrollbar flex gap-2">
        {CATEGORIES.map(cat => (
            <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    filter === cat 
                    ? 'bg-[#1e293b] text-white shadow-md' 
                    : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                }`}
            >
                {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredPlaces.map(place => {
            const statusConfig = BOOKING_OPTIONS.find(o => o.value === (place.bookingStatus || 'NONE'));
            return (
            <div key={place.id} className="bg-white p-3 rounded-lg shadow-sm border border-[#e2e8f0] flex flex-col md:flex-row gap-4 relative group hover:border-[#3b82f6] transition-colors">
                <div className="h-32 md:h-32 md:w-32 bg-gray-100 relative shrink-0 p-1 bg-white border border-[#f0f0f0] shadow-sm rotate-1 group-hover:rotate-0 transition-transform">
                     <img 
                        src={place.imageUrl} 
                        alt={place.name} 
                        className="w-full h-full object-cover filter contrast-[1.05]"
                     />
                     <button 
                        onClick={() => onToggleSave(place.id)}
                        className="absolute -top-2 -left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-10 border border-[#e2e8f0]"
                     >
                        <Heart 
                            size={14} 
                            className={place.isSaved ? "fill-red-500 text-red-500" : "text-[#cbd5e1]"} 
                        />
                     </button>
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-hand font-bold text-xl text-[#1e293b]">{place.name}</h3>
                        <div className="flex items-center gap-1 text-xs font-bold text-[#f59e0b]">
                            <Star size={12} fill="currentColor" /> {place.rating}
                        </div>
                    </div>
                    <p className="text-sm font-hand text-[#334155] mb-3 leading-tight">{place.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-auto">
                         <span className="px-2 py-0.5 bg-[#f8fafc] rounded text-[10px] text-[#64748b] font-bold uppercase tracking-wider border border-[#e2e8f0]">{place.category}</span>
                         {/* Booking Status Badge */}
                         {statusConfig && statusConfig.value !== 'NONE' && (
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusConfig.color}`}>
                                 {statusConfig.label}
                             </span>
                         )}
                         {/* Coordinate Badge (Visual confirmation) */}
                         {place.lat && place.lng && (
                             <span className="px-2 py-0.5 bg-[#f0fdf4] text-[#15803d] rounded text-[10px] font-bold uppercase tracking-wider border border-[#dcfce7]">
                                 On Map
                             </span>
                         )}
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                         <div className="text-xs text-[#94a3b8]">Review {place.reviewCount}</div>
                         <div className="flex items-center gap-2">
                            {place.googleMapLink && (
                                <a 
                                    href={place.googleMapLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs font-bold text-[#2563eb] bg-[#dbeafe] px-2 py-1 rounded-full hover:bg-[#bfdbfe] transition-colors"
                                >
                                    <Map size={12} /> Google Map
                                </a>
                            )}
                            <button 
                                onClick={() => onRemovePlace(place.id)} 
                                className="p-1.5 text-[#cbd5e1] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                         </div>
                    </div>
                </div>
            </div>
            );
        })}

        {filteredPlaces.length === 0 && (
            <div className="text-center py-20 text-[#94a3b8]">
                <MapPin className="mx-auto mb-2 opacity-30" size={48} />
                <p className="font-hand text-xl">No places pinned yet.</p>
            </div>
        )}
      </div>

      {/* Add Place FAB */}
      <button 
        onClick={handleOpenModal}
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#1e293b] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#334155] transition-transform hover:scale-105 active:scale-95"
      >
          <Plus size={24} />
      </button>

      {/* Add Place Modal */}
      {isModalOpen && (
          <div className="absolute inset-0 z-50 bg-[#1e293b]/20 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto border border-[#e2e8f0]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-hand font-bold text-[#1e293b]">Add New Place</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-[#e0f2fe] rounded-full text-[#94a3b8]"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      {/* Name & Category */}
                      <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                             <label className="text-xs font-bold text-[#64748b] mb-1 block uppercase">Place Name *</label>
                             <input 
                                 className="w-full p-2 border border-[#e2e8f0] rounded-lg text-lg font-hand focus:border-[#3b82f6] outline-none"
                                 placeholder="e.g. Pompi Tiramisu"
                                 value={newPlace.name || ''}
                                 onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
                             />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-[#64748b] mb-1 block uppercase">Category</label>
                              <select 
                                 className="w-full p-2 border border-[#e2e8f0] rounded-lg text-sm bg-white outline-none"
                                 value={newPlace.category}
                                 onChange={(e) => setNewPlace({...newPlace, category: e.target.value as PlaceCategory})}
                              >
                                  {CATEGORIES.filter(c => c !== 'ALL').map(c => (
                                      <option key={c} value={c}>{c}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-[#64748b] mb-1 block uppercase">Booking</label>
                              <select 
                                 className="w-full p-2 border border-[#e2e8f0] rounded-lg text-sm bg-white outline-none"
                                 value={newPlace.bookingStatus || 'NONE'}
                                 onChange={(e) => setNewPlace({...newPlace, bookingStatus: e.target.value as BookingStatus})}
                              >
                                  {BOOKING_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      
                      {/* Coordinates Section - Critical for Map */}
                      <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                          <label className="text-xs font-bold text-[#64748b] mb-2 block uppercase flex items-center gap-1">
                              <MapPin size={12} /> Map Coordinates (Required for Map)
                          </label>
                          <div className="flex gap-2">
                              <div>
                                  <label className="text-[10px] text-[#94a3b8] uppercase font-bold">Latitude</label>
                                  <input 
                                      type="number"
                                      className="w-full p-2 border border-[#e2e8f0] rounded-lg text-sm outline-none"
                                      placeholder="41.9028"
                                      value={newPlace.lat || ''}
                                      onChange={(e) => setNewPlace({...newPlace, lat: parseFloat(e.target.value)})}
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] text-[#94a3b8] uppercase font-bold">Longitude</label>
                                  <input 
                                      type="number"
                                      className="w-full p-2 border border-[#e2e8f0] rounded-lg text-sm outline-none"
                                      placeholder="12.4964"
                                      value={newPlace.lng || ''}
                                      onChange={(e) => setNewPlace({...newPlace, lng: parseFloat(e.target.value)})}
                                  />
                              </div>
                          </div>
                          <p className="text-[10px] text-[#94a3b8] mt-2 italic">
                              * Tip: Right-click on Google Maps to copy coordinates.
                          </p>
                      </div>

                      {/* Map Link */}
                      <div>
                          <label className="text-xs font-bold text-[#64748b] mb-1 block uppercase">Google Maps Link</label>
                          <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-lg p-2 bg-[#f8fafc] focus-within:bg-white focus-within:border-[#3b82f6] transition-colors">
                              <Map size={16} className="text-[#94a3b8]" />
                              <input 
                                  className="w-full bg-transparent text-sm outline-none"
                                  placeholder="https://maps.app.goo.gl/..."
                                  value={newPlace.googleMapLink || ''}
                                  onChange={(e) => setNewPlace({...newPlace, googleMapLink: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Description */}
                      <div>
                          <label className="text-xs font-bold text-[#64748b] mb-1 block uppercase">Description</label>
                          <textarea 
                              className="w-full p-2 border border-[#e2e8f0] rounded-lg text-lg font-hand resize-none focus:border-[#3b82f6] outline-none"
                              rows={2}
                              placeholder="Notes..."
                              value={newPlace.description || ''}
                              onChange={(e) => setNewPlace({...newPlace, description: e.target.value})}
                          />
                      </div>
                      
                      {/* Image URL */}
                      <div>
                          <label className="text-xs font-bold text-[#64748b] mb-1 block uppercase">Image URL</label>
                          <input 
                              className="w-full p-2 border border-[#e2e8f0] rounded-lg text-sm outline-none focus:border-[#3b82f6]"
                              placeholder="https://..."
                              value={newPlace.imageUrl || ''}
                              onChange={(e) => setNewPlace({...newPlace, imageUrl: e.target.value})}
                          />
                      </div>
                  </div>

                  <button 
                      onClick={handleAddSubmit}
                      disabled={!newPlace.name}
                      className="w-full mt-6 py-3 bg-[#1e293b] text-white rounded-lg font-bold shadow-lg hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      Save Place
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};