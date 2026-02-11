import React, { useState, useEffect } from 'react';
import { 
  Trip, DayPlan, ViewMode, BlockType, SavedPlace, Scrap, ManualExpense, ChecklistItem, ChecklistGroup, TravelDoc 
} from './types';
import { INITIAL_TRIP } from './data/initialData';
import { BlockEditor } from './components/BlockEditor';
import { MapView } from './components/MapView';
import { TravelTools } from './components/TravelTools';
import { SavedPlaces } from './components/SavedPlaces';
import { 
  Calendar, Map as MapIcon, 
  Heart, Briefcase, Download, Menu, Trash2
} from 'lucide-react';

const STORAGE_KEY = 'travel_log_ai_v9_mediterranean_yellow';

// Colors from palette
const COLOR_BG = '#FFFDF5'; // Light Butter Yellow / Cream
const COLOR_NEBULA = '#C0DDDA'; // Nebula
const COLOR_YELLOW = '#FBE29D'; // Butter Yellow
const COLOR_COPPER = '#775537'; // Old Copper
const COLOR_BLUE_ACTION = '#3b82f6'; // Standard Blue for actions
const COLOR_BORDER = '#FBE29D'; // Replacing grey borders

export default function App() {
  const [trip, setTrip] = useState<Trip>(INITIAL_TRIP);
  const [view, setView] = useState<ViewMode>('SCHEDULE');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(INITIAL_TRIP.days.length > 0 ? INITIAL_TRIP.days[0].id : null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Load/Save
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setTrip(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  }, [trip]);

  // Handlers
  const updateDayBlocks = (dayId: string, newBlocks: any[]) => {
    setTrip(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, blocks: newBlocks } : d)
    }));
  };

  const updateDayDate = (dayId: string, newDate: string) => {
    setTrip(prev => ({
        ...prev,
        days: prev.days.map(d => d.id === dayId ? { ...d, date: newDate } : d)
    }));
  };

  const handleAddDay = () => {
    const lastDay = trip.days[trip.days.length - 1];
    let newDateStr = trip.startDate;
    
    if (lastDay) {
        const dateObj = new Date(lastDay.date);
        dateObj.setDate(dateObj.getDate() + 1);
        newDateStr = dateObj.toISOString().split('T')[0];
    }

    const newDay: DayPlan = {
        id: crypto.randomUUID(),
        date: newDateStr,
        location: 'New Day',
        blocks: []
    };
    setTrip(prev => ({ ...prev, days: [...prev.days, newDay] }));
    setSelectedDayId(newDay.id);
  };

  const handleDeleteDay = (dayId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (trip.days.length <= 1) {
          alert("You must have at least one day.");
          return;
      }
      if (confirm("Are you sure you want to delete this day?")) {
          const newDays = trip.days.filter(d => d.id !== dayId);
          setTrip(prev => ({ ...prev, days: newDays }));
          if (selectedDayId === dayId) {
              setSelectedDayId(newDays[0].id);
          }
      }
  };

  const handleToggleSave = (placeId: string) => {
    setTrip(prev => ({
        ...prev,
        savedPlaces: prev.savedPlaces.map(p => p.id === placeId ? { ...p, isSaved: !p.isSaved } : p)
    }));
  };

  const handleRemovePlace = (placeId: string) => {
      if(confirm("Remove this place from your saved list?")) {
          setTrip(prev => ({
              ...prev,
              savedPlaces: prev.savedPlaces.filter(p => p.id !== placeId)
          }));
      }
  };

  const handleAddPlace = (newPlace: SavedPlace) => {
      setTrip(prev => ({
          ...prev,
          savedPlaces: [newPlace, ...prev.savedPlaces]
      }));
  };

  const handleUpdateScraps = (newScraps: Scrap[]) => {
      setTrip(prev => ({ ...prev, scraps: newScraps }));
  };

  // Tools Handlers
  const handleUpdateManualExpenses = (expenses: ManualExpense[]) => {
      setTrip(prev => ({ ...prev, manualExpenses: expenses }));
  };

  const handleUpdateBudget = (newBudget: number) => {
      setTrip(prev => ({ ...prev, budget: newBudget }));
  };

  const handleUpdateChecklists = (checklists: ChecklistGroup[]) => {
      setTrip(prev => ({ ...prev, checklists }));
  };

  const handleUpdateDocuments = (docs: TravelDoc[]) => {
      setTrip(prev => ({ ...prev, documents: docs }));
  };

  const handleImportTrip = (importedTrip: Trip) => {
      if(confirm("This will overwrite your current plan. Are you sure?")) {
          setTrip(importedTrip);
          // Also reset selection to first day to avoid errors
          if(importedTrip.days.length > 0) {
              setSelectedDayId(importedTrip.days[0].id);
          }
          alert("Plan imported successfully!");
      }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getDayImage = (day: DayPlan) => {
      // 1. Check direct image blocks
      const imgBlock = day.blocks.find(b => b.type === BlockType.IMAGE && b.content);
      if (imgBlock) return imgBlock.content;
      
      // 2. Check location children for images
      for (const block of day.blocks) {
          if (block.type === BlockType.LOCATION && block.children) {
              const childImg = block.children.find(c => c.type === BlockType.IMAGE && c.content);
              if (childImg) return childImg.content;
          }
      }
      return null;
  };

  const selectedDay = trip.days.find(d => d.id === selectedDayId);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-[#1e293b]" style={{ backgroundColor: COLOR_BG }}>
      
      {/* HEADER */}
      <header className="flex-none h-16 bg-white border-b px-4 flex items-center justify-between z-30 no-print" style={{ borderColor: COLOR_BORDER }}>
        <div className="flex items-center gap-3 flex-1">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[#FFFDF5] rounded-lg md:hidden text-[#334155]">
                 <Menu size={20} />
             </button>
             <div className="flex flex-col">
                <input 
                    className="font-hand font-bold text-2xl leading-tight outline-none focus:border-b bg-transparent"
                    style={{ color: COLOR_COPPER, borderColor: COLOR_NEBULA }}
                    value={trip.title}
                    onChange={(e) => setTrip({...trip, title: e.target.value})}
                    placeholder="Trip Title"
                />
                <div className="flex items-center gap-1 text-xs text-[#64748b] font-medium tracking-wide">
                    <input 
                        className="bg-transparent outline-none w-20 hover:bg-[#FFFDF5] rounded px-1 transition-colors"
                        value={trip.startDate}
                        onChange={(e) => setTrip({...trip, startDate: e.target.value})}
                    />
                    <span>~</span>
                    <input 
                        className="bg-transparent outline-none w-20 hover:bg-[#FFFDF5] rounded px-1 transition-colors"
                        value={trip.endDate}
                        onChange={(e) => setTrip({...trip, endDate: e.target.value})}
                    />
                </div>
             </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExportPDF} className="p-2 text-[#334155] hover:bg-[#FFFDF5] rounded-full transition-colors" title="Export PDF">
                <Download size={20} />
            </button>
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* SCHEDULE VIEW with Sidebar Layout */}
        {view === 'SCHEDULE' && (
            <div className="flex w-full h-full">
                {/* SIDEBAR (Day List) */}
                <div className={`sidebar ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'} md:translate-x-0 md:opacity-100 md:w-64 bg-white border-r transition-all duration-300 flex flex-col absolute md:static z-20 h-full shadow-[2px_0_10px_rgba(0,0,0,0.03)] md:shadow-none`} style={{ borderColor: COLOR_BORDER }}>
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {trip.days.map((day, idx) => {
                            const bgImage = getDayImage(day);
                            return (
                                <button
                                    key={day.id}
                                    onClick={() => { setSelectedDayId(day.id); if(window.innerWidth < 768) setSidebarOpen(false); }}
                                    className={`group w-full text-left rounded-xl transition-all border relative flex flex-col overflow-hidden ${
                                        selectedDayId === day.id 
                                        ? 'shadow-md border-[#C0DDDA]' 
                                        : 'hover:border-[#C0DDDA] hover:shadow-sm'
                                    }`}
                                    style={{
                                        minHeight: '80px',
                                        backgroundColor: selectedDayId === day.id ? COLOR_NEBULA : 'white',
                                        borderColor: selectedDayId === day.id ? COLOR_NEBULA : '#FEF08A'
                                    }}
                                >
                                    {/* Image Background Layer */}
                                    {bgImage && (
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
                                            style={{ backgroundImage: `url(${bgImage})` }}
                                        />
                                    )}
                                    {/* Gradient Overlay for Text Readability */}
                                    <div className={`absolute inset-0 bg-gradient-to-r ${selectedDayId === day.id ? 'from-[#C0DDDA]/90' : 'from-white/90'} via-transparent to-transparent`} />

                                    <div className="relative z-10 p-3 w-full flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: selectedDayId === day.id ? '#775537' : '#94a3b8' }}>
                                                Day {idx + 1}
                                            </div>
                                            <div className="font-hand font-bold text-lg truncate" style={{ color: '#1e293b' }}>{day.location || 'New Day'}</div>
                                            <div className="text-xs font-sans mt-1" style={{ color: selectedDayId === day.id ? '#5e4835' : '#64748b' }}>{day.date}</div>
                                        </div>
                                        <div 
                                            onClick={(e) => handleDeleteDay(day.id, e)}
                                            className="p-1.5 text-[#94a3b8] hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 backdrop-blur-sm"
                                            title="Delete Day"
                                        >
                                            <Trash2 size={14} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        <button 
                            onClick={handleAddDay}
                            className="w-full py-3 text-sm text-[#94a3b8] border-2 border-dashed rounded-xl hover:text-[#775537] hover:bg-[#FFFDF5] mt-4 transition-all"
                            style={{ borderColor: '#FEF08A', color: '#775537' }}
                        >
                            + Add Page
                        </button>
                    </div>
                </div>

                {/* MAIN EDITOR AREA */}
                <div className="flex-1 overflow-y-auto bg-transparent relative print-break">
                    {selectedDay ? (
                        <div className="max-w-2xl mx-auto p-6 md:p-10 pb-32">
                             <div className="mb-8 flex items-end justify-between border-b pb-4" style={{ borderColor: COLOR_BORDER }}>
                                <div className="w-full">
                                    <div className="flex justify-between items-start">
                                        <div className="text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: COLOR_COPPER }}>
                                            Day {trip.days.findIndex(d => d.id === selectedDayId) + 1} • 
                                            <input 
                                                type="date"
                                                className="bg-transparent outline-none focus:bg-[#e0f2fe] rounded px-1 text-[#334155]"
                                                value={selectedDay.date}
                                                onChange={(e) => updateDayDate(selectedDay.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <input 
                                        className="text-4xl font-hand font-bold bg-transparent outline-none placeholder-[#cbd5e1] w-full text-[#1e293b]"
                                        value={selectedDay.location}
                                        placeholder="City Name"
                                        onChange={(e) => {
                                            const newDays = trip.days.map(d => d.id === selectedDayId ? { ...d, location: e.target.value } : d);
                                            setTrip({...trip, days: newDays});
                                        }}
                                    />
                                </div>
                             </div>

                             <BlockEditor 
                                blocks={selectedDay.blocks} 
                                onChange={(blocks) => updateDayBlocks(selectedDay.id, blocks)} 
                                currency={trip.currency}
                             />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-[#94a3b8]">
                            <div className="text-center">
                                <span className="font-hand text-2xl block mb-2" style={{color: COLOR_COPPER}}>Ready to plan?</span>
                                <span className="text-sm">Select a day from the left</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* OTHER VIEWS (Full Width) */}
        {view !== 'SCHEDULE' && (
            <div className="w-full h-full overflow-hidden bg-transparent">
                {view === 'SAVED' && <SavedPlaces places={trip.savedPlaces} onToggleSave={handleToggleSave} onRemovePlace={handleRemovePlace} onAddPlace={handleAddPlace} />}
                {view === 'TOOLS' && (
                    <TravelTools 
                        trip={trip} 
                        onUpdateScraps={handleUpdateScraps} 
                        onUpdateManualExpenses={handleUpdateManualExpenses}
                        onUpdateBudget={handleUpdateBudget}
                        onUpdateChecklists={handleUpdateChecklists}
                        onUpdateDocuments={handleUpdateDocuments}
                        onImportTrip={handleImportTrip}
                    />
                )}
                {view === 'MAP' && <MapView trip={trip} />}
            </div>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="flex-none bg-white border-t pb-safe px-6 py-3 flex justify-around items-center z-30 no-print shadow-[0_-5px_15px_rgba(0,0,0,0.02)]" style={{ borderColor: COLOR_BORDER }}>
         <NavBtn active={view === 'SCHEDULE'} icon={<Calendar size={22} />} label="Journal" onClick={() => setView('SCHEDULE')} />
         <NavBtn active={view === 'SAVED'} icon={<Heart size={22} />} label="Saved" onClick={() => setView('SAVED')} />
         <NavBtn active={view === 'TOOLS'} icon={<Briefcase size={22} />} label="Kit" onClick={() => setView('TOOLS')} />
         <NavBtn active={view === 'MAP'} icon={<MapIcon size={22} />} label="Map" onClick={() => setView('MAP')} />
      </nav>

    </div>
  );
}

const NavBtn = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${active ? 'font-bold scale-110' : 'text-[#94a3b8] hover:text-[#775537]'}`}
    style={{ color: active ? COLOR_COPPER : undefined }}
  >
    <div className={`mb-1`}>{icon}</div>
    <span className="text-[10px] uppercase tracking-wide">{label}</span>
  </button>
);