import React, { useState, useMemo, useRef } from 'react';
import { SavedPlace, PlaceCategory, BookingStatus } from '../types';
import { Heart, MapPin, Star, Plus, X, Map, Trash2, Search, Upload, LayoutGrid, Utensils, Coffee, IceCream, Wine, Landmark, Bed, Bus, Globe } from 'lucide-react';

interface SavedPlacesProps {
  places: SavedPlace[];
  onToggleSave: (id: string) => void;
  onRemovePlace: (id: string) => void;
  onAddPlace: (place: SavedPlace) => void;
}

const CATEGORIES: (PlaceCategory | 'ALL')[] = [
    'ALL', 'RESTAURANT', 'CAFE', 'GELATO', 'BAR', 'ATTRACTION', 'ACCOMMODATION', 'TRANSPORT'
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'ALL': <LayoutGrid size={16} />,
    'RESTAURANT': <Utensils size={16} />,
    'CAFE': <Coffee size={16} />,
    'GELATO': <IceCream size={16} />,
    'BAR': <Wine size={16} />,
    'ATTRACTION': <Landmark size={16} />,
    'ACCOMMODATION': <Bed size={16} />,
    'TRANSPORT': <Bus size={16} />
};

const CATEGORY_LABELS: Record<string, string> = {
    'ALL': '전체',
    'RESTAURANT': '맛집',
    'CAFE': '카페',
    'GELATO': '디저트',
    'BAR': '바',
    'ATTRACTION': '명소',
    'ACCOMMODATION': '숙소',
    'TRANSPORT': '교통'
};

const BOOKING_OPTIONS: { value: BookingStatus; label: string; color: string }[] = [
    { value: 'PENDING', label: '예약예정', color: 'bg-amber-50 text-amber-700' },
    { value: 'BOOKED', label: '예약됨', color: 'bg-blue-50 text-blue-700' },
    { value: 'NONE', label: '예약필요없음', color: 'bg-slate-100 text-slate-500' },
];

export const SavedPlaces: React.FC<SavedPlacesProps> = ({ places, onToggleSave, onRemovePlace, onAddPlace }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);
  
  const [newPlace, setNewPlace] = useState<Partial<SavedPlace>>({ 
      category: 'RESTAURANT', 
      rating: 5, 
      reviewCount: 0, 
      bookingStatus: 'NONE',
      lat: 41.9028,
      lng: 12.4964,
      region: ''
  });

  // Drag to scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const regionScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const startDragging = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>) => {
      if(!ref.current) return;
      setIsDragging(true);
      setStartX(e.pageX - ref.current.offsetLeft);
      setScrollLeft(ref.current.scrollLeft);
  };

  const stopDragging = () => {
      setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>) => {
      if (!isDragging || !ref.current) return;
      e.preventDefault();
      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - startX) * 1.5;
      ref.current.scrollLeft = scrollLeft - walk;
  };

  // Extract unique regions
  const uniqueRegions = useMemo(() => {
      const regions = new Set(places.map(p => p.region).filter(Boolean));
      return Array.from(regions);
  }, [places]);

  const filteredPlaces = places.filter(p => {
      const catMatch = filter === 'ALL' || p.category === filter;
      const regionMatch = selectedRegion === 'ALL' || p.region === selectedRegion;
      return catMatch && regionMatch;
  });

  const handleOpenModal = () => {
      setNewPlace(prev => ({
          ...prev,
          category: (filter !== 'ALL' ? filter as PlaceCategory : 'RESTAURANT'),
          name: '',
          description: '',
          imageUrl: '',
          googleMapLink: '',
          lat: 41.9028,
          lng: 12.4964,
          region: ''
      }));
      setIsModalOpen(true);
  };

  const handleAutoGeocode = async () => {
    if (!newPlace.name) return;
    setIsSearchingGeo(true);
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(newPlace.name)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude } = data.results[0];
            setNewPlace(prev => ({ ...prev, lat: latitude, lng: longitude }));
        } else {
            alert("좌표를 찾을 수 없습니다.");
        }
    } catch (e) {
        console.error(e);
        alert("좌표 검색 중 오류가 발생했습니다.");
    } finally {
        setIsSearchingGeo(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert("파일 크기는 5MB 이하여야 합니다.");
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setNewPlace(prev => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
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
          imageUrl: newPlace.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500', 
          isSaved: true,
          bookingStatus: newPlace.bookingStatus || 'NONE',
          googleMapLink: newPlace.googleMapLink,
          lat: newPlace.lat,
          lng: newPlace.lng,
          region: newPlace.region
      };
      
      onAddPlace(place);
      setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative">
      
      <div className="flex flex-col border-b border-white/30 shrink-0">
          {/* 1. Category Icons (Scrollable & Draggable) */}
          <div 
            ref={scrollRef}
            className="px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => startDragging(e, scrollRef)}
            onMouseLeave={stopDragging}
            onMouseUp={stopDragging}
            onMouseMove={(e) => onMouseMove(e, scrollRef)}
          >
            {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => !isDragging && setFilter(cat)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[3.5rem] h-[3.5rem] gap-1 shrink-0 ${
                        filter === cat 
                        ? 'bg-slate-800 text-white shadow-lg scale-105' 
                        : 'bg-white/50 text-slate-500 hover:bg-white hover:text-slate-800 shadow-sm'
                    }`}
                    title={CATEGORY_LABELS[cat] || cat}
                >
                    {CATEGORY_ICONS[cat]}
                    <span className="text-[10px] font-bold whitespace-nowrap">{CATEGORY_LABELS[cat]}</span>
                </button>
            ))}
            {/* Spacer to ensure last item is visible */}
            <div className="w-2 shrink-0"></div>
          </div>

          {/* 2. Region Filter (Pills) */}
          {uniqueRegions.length > 0 && (
              <div 
                ref={regionScrollRef}
                className="px-6 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => startDragging(e, regionScrollRef)}
                onMouseLeave={stopDragging}
                onMouseUp={stopDragging}
                onMouseMove={(e) => onMouseMove(e, regionScrollRef)}
              >
                  <button
                      onClick={() => !isDragging && setSelectedRegion('ALL')}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                          selectedRegion === 'ALL' 
                          ? 'bg-blue-100 text-blue-700 border-blue-200' 
                          : 'bg-white/40 text-slate-500 border-transparent hover:bg-white'
                      }`}
                  >
                      전체 지역
                  </button>
                  {uniqueRegions.map(region => (
                       <button
                          key={region}
                          onClick={() => !isDragging && setSelectedRegion(region as string)}
                          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                              selectedRegion === region 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-white/40 text-slate-500 border-transparent hover:bg-white'
                          }`}
                      >
                          {region}
                      </button>
                  ))}
                  {/* Spacer */}
                  <div className="w-4 shrink-0"></div>
              </div>
          )}
      </div>

      {/* List View (Horizontal Cards) - COMPACT */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="space-y-3 pb-24">
            {filteredPlaces.map(place => {
                const statusConfig = BOOKING_OPTIONS.find(o => o.value === (place.bookingStatus || 'NONE'));
                return (
                <div key={place.id} className="group bg-white rounded-2xl shadow-soft hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/50 flex flex-row h-28 relative">
                    {/* Left: Image */}
                    <div className="w-28 min-w-[112px] relative h-full">
                        <img 
                            src={place.imageUrl} 
                            alt={place.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
                             {CATEGORY_ICONS[place.category]}
                             {CATEGORY_LABELS[place.category] || place.category}
                        </span>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0 relative">
                         {/* Header */}
                         <div className="pr-8">
                             <div className="flex justify-between items-start mb-0.5">
                                <h3 className="font-bold text-sm text-slate-800 leading-tight truncate">{place.name}</h3>
                             </div>
                             <div className="flex items-center gap-1 mb-1">
                                <Star size={10} className="fill-amber-400 text-amber-400" />
                                <span className="text-[10px] font-bold text-slate-600">{place.rating}</span>
                                <span className="text-[9px] text-slate-400">({place.reviewCount})</span>
                             </div>
                             <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{place.description}</p>
                         </div>

                         {/* Actions/Footer */}
                         <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-slate-50">
                             <div className="flex items-center gap-2">
                                {statusConfig && statusConfig.value !== 'NONE' && (
                                     <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${statusConfig.color}`}>
                                         {statusConfig.label}
                                     </span>
                                 )}
                                 {place.googleMapLink && (
                                     <a 
                                        href={place.googleMapLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                                        title="지도 열기"
                                     >
                                         <Map size={12} />
                                     </a>
                                 )}
                             </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); onRemovePlace(place.id); }} 
                                className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-full transition-colors relative z-20 cursor-pointer"
                            >
                                <Trash2 size={12} />
                            </button>
                         </div>

                         {/* Like Button (Floating Top Right) */}
                         <button 
                            onClick={(e) => { e.stopPropagation(); onToggleSave(place.id); }}
                            className="absolute top-2 right-2 p-1.5 text-slate-300 hover:scale-110 transition-transform active:scale-95 z-20 cursor-pointer"
                        >
                            <Heart 
                                size={14} 
                                className={place.isSaved ? "fill-rose-500 text-rose-500" : "text-slate-200"} 
                            />
                        </button>
                    </div>
                </div>
                );
            })}
        </div>

        {filteredPlaces.length === 0 && (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="opacity-40" size={24} />
                </div>
                <p className="font-medium text-base text-slate-500">저장된 장소가 없습니다.</p>
                <p className="text-xs mt-1">마음에 드는 장소를 추가해보세요!</p>
            </div>
        )}
      </div>

      {/* Floating Add Button (Higher position) */}
      <button 
        onClick={handleOpenModal}
        className="absolute bottom-24 right-6 w-14 h-14 bg-slate-800 text-white rounded-full shadow-glow flex items-center justify-center hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all z-20"
      >
          <Plus size={24} />
      </button>

      {/* Add Place Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
              <div className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 max-h-[85vh] flex flex-col border border-white/50">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
                      <h3 className="text-xl font-bold text-slate-800">장소 추가</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
                  </div>
                  
                  {/* Modal Body (Scrollable) */}
                  <div className="p-6 overflow-y-auto space-y-4 overscroll-contain">
                      {/* Name & Category */}
                      <div className="space-y-3">
                          <div>
                             <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">이름</label>
                             <input 
                                 className="w-full p-3 bg-slate-50 border-none rounded-2xl text-base font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                 placeholder="예: 콜로세움"
                                 value={newPlace.name || ''}
                                 onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
                             />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">카테고리</label>
                                  <select 
                                     className="w-full p-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
                                     value={newPlace.category}
                                     onChange={(e) => setNewPlace({...newPlace, category: e.target.value as PlaceCategory})}
                                  >
                                      {CATEGORIES.filter(c => c !== 'ALL').map(c => (
                                          <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">상태</label>
                                  <select 
                                     className="w-full p-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
                                     value={newPlace.bookingStatus || 'NONE'}
                                     onChange={(e) => setNewPlace({...newPlace, bookingStatus: e.target.value as BookingStatus})}
                                  >
                                      {BOOKING_OPTIONS.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>

                           {/* Region (New) */}
                           <div>
                              <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">지역 (도시/구역)</label>
                              <div className="relative">
                                <Globe size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    list="region-suggestions"
                                    className="w-full p-2.5 pl-9 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none"
                                    placeholder="예: 로마, 돌로미티 (직접 입력)"
                                    value={newPlace.region || ''}
                                    onChange={(e) => setNewPlace({...newPlace, region: e.target.value})}
                                />
                                <datalist id="region-suggestions">
                                    {uniqueRegions.map(r => <option key={r} value={r} />)}
                                </datalist>
                              </div>
                          </div>
                      </div>
                      
                      {/* Coordinates Section with Auto-Find */}
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 relative">
                          <label className="text-[10px] font-bold text-blue-400 mb-2 block uppercase tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1.5"><MapPin size={10} /> 지도 좌표</span>
                              <button 
                                onClick={handleAutoGeocode}
                                disabled={!newPlace.name || isSearchingGeo}
                                className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                  {isSearchingGeo ? '검색 중...' : <><Search size={10} /> 자동 찾기</>}
                              </button>
                          </label>
                          <div className="flex gap-2">
                              <input 
                                  type="number"
                                  className="w-full p-2 bg-white border-none rounded-lg text-xs font-medium text-slate-600 outline-none shadow-sm placeholder-slate-300"
                                  placeholder="위도 (Lat)"
                                  value={newPlace.lat || ''}
                                  onChange={(e) => setNewPlace({...newPlace, lat: parseFloat(e.target.value)})}
                              />
                              <input 
                                  type="number"
                                  className="w-full p-2 bg-white border-none rounded-lg text-xs font-medium text-slate-600 outline-none shadow-sm placeholder-slate-300"
                                  placeholder="경도 (Lng)"
                                  value={newPlace.lng || ''}
                                  onChange={(e) => setNewPlace({...newPlace, lng: parseFloat(e.target.value)})}
                              />
                          </div>
                      </div>

                      {/* Map Link */}
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">구글 맵 링크</label>
                          <div className="flex items-center gap-2 rounded-xl p-2.5 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                              <Map size={16} className="text-slate-400" />
                              <input 
                                  className="w-full bg-transparent text-xs font-medium text-slate-700 outline-none placeholder-slate-300"
                                  placeholder="링크를 붙여넣으세요"
                                  value={newPlace.googleMapLink || ''}
                                  onChange={(e) => setNewPlace({...newPlace, googleMapLink: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Description */}
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">메모</label>
                          <textarea 
                              className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-medium text-slate-700 resize-none outline-none focus:ring-2 focus:ring-blue-100"
                              rows={2}
                              placeholder="이 장소의 특징이나 기억할 점을 적어보세요"
                              value={newPlace.description || ''}
                              onChange={(e) => setNewPlace({...newPlace, description: e.target.value})}
                          />
                      </div>
                      
                      {/* Image URL & Upload */}
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider flex justify-between">
                              사진 (URL 또는 업로드)
                          </label>
                          <div className="flex gap-2">
                              <input 
                                  className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                                  placeholder="https://..."
                                  value={newPlace.imageUrl || ''}
                                  onChange={(e) => setNewPlace({...newPlace, imageUrl: e.target.value})}
                              />
                              <label className="p-3 bg-slate-100 text-slate-500 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors flex items-center justify-center">
                                  <Upload size={16} />
                                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                              </label>
                          </div>
                      </div>
                  </div>

                  {/* Modal Footer (Fixed Button) */}
                  <div className="p-6 pt-2 shrink-0 bg-white sm:rounded-b-3xl pb-8 sm:pb-6 border-t border-slate-50">
                      <button 
                          onClick={handleAddSubmit}
                          disabled={!newPlace.name}
                          className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-slate-700 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                          보관함에 저장
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};