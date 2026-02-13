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
  Heart, Briefcase, Download, Menu, Trash2, Home, X
} from 'lucide-react';

const STORAGE_KEY = 'travel_log_ai_v9_mediterranean_yellow';

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
        location: '새로운 일정',
        blocks: []
    };
    setTrip(prev => ({ ...prev, days: [...prev.days, newDay] }));
    setSelectedDayId(newDay.id);
  };

  const handleDeleteDay = (dayId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (trip.days.length <= 1) {
          alert("최소 하루의 일정은 있어야 합니다.");
          return;
      }
      if (confirm("정말 이 일정을 삭제하시겠습니까?")) {
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
      if(confirm("저장된 장소에서 삭제하시겠습니까?")) {
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
  
  const handleUpdatePlace = (updatedPlace: SavedPlace) => {
      setTrip(prev => ({
          ...prev,
          savedPlaces: prev.savedPlaces.map(p => p.id === updatedPlace.id ? updatedPlace : p)
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

  // Helper to remove block expense from any day
  const handleRemoveBlockExpense = (blockId: string) => {
      if(!confirm("일정표에 포함된 항목입니다. 정말 삭제하시겠습니까?")) return;

      setTrip(prev => ({
          ...prev,
          days: prev.days.map(day => ({
              ...day,
              blocks: day.blocks.filter(b => {
                  // Remove if it matches blockId
                  if (b.id === blockId) return false;
                  return true;
              }).map(b => {
                  // Check children
                  if (b.children && b.children.length > 0) {
                      return {
                          ...b,
                          children: b.children.filter(c => c.id !== blockId)
                      };
                  }
                  return b;
              })
          }))
      }));
  };

  const handleImportTrip = (importedTrip: Trip) => {
      if(confirm("현재 일정을 덮어쓰시겠습니까? 복구할 수 없습니다.")) {
          setTrip(importedTrip);
          if(importedTrip.days.length > 0) {
              setSelectedDayId(importedTrip.days[0].id);
          }
          alert("일정을 성공적으로 불러왔습니다!");
      }
  };

  const handleExportPDF = () => {
    // Check if html2pdf is available
    if ((window as any).html2pdf) {
        const element = document.getElementById('printable-content');
        if(!element) {
            alert("내용을 찾을 수 없습니다.");
            return;
        }

        // Temporary style adjustment for PDF generation
        const originalStyle = element.style.cssText;
        element.style.height = 'auto';
        element.style.overflow = 'visible';
        
        const opt = {
          margin: 0.5,
          filename: `${trip.title.replace(/\s+/g, '_') || 'travel_plan'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        // Generate PDF
        (window as any).html2pdf().set(opt).from(element).save().then(() => {
            // Restore styles if needed (though React renders might handle it)
            element.style.cssText = originalStyle;
        });
    } else {
        // Fallback to browser print if script fails to load
        window.print();
    }
  };

  const getDayImage = (day: DayPlan) => {
      const imgBlock = day.blocks.find(b => b.type === BlockType.IMAGE && b.content);
      if (imgBlock) return imgBlock.content;
      
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
    <div className="flex flex-col h-screen overflow-hidden text-slate-800 relative">
      
      {/* MOBILE HEADER - Only visible on small screens to toggle sidebar */}
      <div className="md:hidden flex items-center justify-between p-4 pb-0 z-30 no-print">
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-slate-600">
              <Menu size={20} />
          </button>
      </div>

      {/* BODY */}
      <main className="flex-1 flex overflow-hidden relative p-4 gap-4">
        
        {/* SCHEDULE VIEW with Floating Sidebar Layout */}
        {view === 'SCHEDULE' && (
            <div className="flex w-full h-full gap-4 relative">
                
                {/* FLOATING SIDEBAR */}
                <div className={`
                    fixed inset-y-0 left-0 z-50 md:static md:z-0 h-full transition-all duration-300 ease-in-out no-print
                    ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:opacity-0 md:translate-x-0'}
                `}>
                     {/* Mobile Overlay */}
                    <div 
                        className={`md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1] transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onClick={() => setSidebarOpen(false)}
                    />

                    <div className="glass-card md:rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl md:shadow-soft border-r md:border border-white/60 bg-white/90">
                        
                        {/* SIDEBAR HEADER */}
                        <div className="p-5 border-b border-slate-100 bg-white/50 space-y-3 relative">
                             <button 
                                onClick={() => setSidebarOpen(false)} 
                                className="absolute top-4 right-4 md:hidden p-1 text-slate-400 hover:bg-slate-100 rounded-full"
                             >
                                 <X size={20} />
                             </button>

                             <div>
                                 <input 
                                    className="font-bold text-2xl w-full bg-transparent outline-none text-slate-800 placeholder-slate-300 mb-1"
                                    value={trip.title}
                                    onChange={(e) => setTrip({...trip, title: e.target.value})}
                                    placeholder="여행 제목"
                                 />
                                 <div className="flex items-center gap-1 text-xs text-slate-500 font-bold tracking-wide">
                                    <Calendar size={12} className="text-slate-400" />
                                    <input 
                                        className="bg-transparent outline-none w-24 hover:bg-slate-100 rounded px-1 transition-colors cursor-pointer"
                                        value={trip.startDate}
                                        onChange={(e) => setTrip({...trip, startDate: e.target.value})}
                                    />
                                    <span className="text-slate-300">~</span>
                                    <input 
                                        className="bg-transparent outline-none w-24 hover:bg-slate-100 rounded px-1 transition-colors cursor-pointer"
                                        value={trip.endDate}
                                        onChange={(e) => setTrip({...trip, endDate: e.target.value})}
                                    />
                                 </div>
                             </div>
                             
                             <button 
                                onClick={handleExportPDF}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-700 transition-all active:scale-95"
                             >
                                 <Download size={14} /> PDF 저장
                             </button>
                        </div>

                        {/* DAY LIST */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 mt-2">전체 일정</h2>
                            {trip.days.map((day, idx) => {
                                const bgImage = getDayImage(day);
                                return (
                                    // Changed from button to div to avoid nested interactive controls
                                    <div
                                        key={day.id}
                                        onClick={() => { setSelectedDayId(day.id); if(window.innerWidth < 768) setSidebarOpen(false); }}
                                        className={`group w-full text-left rounded-xl transition-all relative flex flex-col overflow-hidden shrink-0 border cursor-pointer
                                            ${selectedDayId === day.id 
                                            ? 'shadow-md border-slate-300 ring-2 ring-slate-100 ring-offset-2' 
                                            : 'border-transparent hover:shadow-sm hover:bg-white/50'}
                                        `}
                                        style={{
                                            minHeight: '88px',
                                            backgroundColor: selectedDayId === day.id ? 'white' : 'rgba(255,255,255,0.4)'
                                        }}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {/* Image Background with Masking */}
                                        {bgImage && (
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-all duration-700 grayscale-[10%] group-hover:grayscale-0"
                                                style={{ 
                                                    backgroundImage: `url(${bgImage})`,
                                                    // CSS Masking: Transparent on left (0.15), Solid on right (1)
                                                    maskImage: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,1) 70%)',
                                                    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,1) 70%)'
                                                }}
                                            />
                                        )}
                                        {/* Gradient Overlay - Text Readability Layer */}
                                        <div className={`absolute inset-0 bg-gradient-to-r ${selectedDayId === day.id ? 'from-white/90 via-white/50 to-transparent' : 'from-white/95 via-white/70 to-white/20'}`} />

                                        <div className="relative z-10 p-3.5 w-full flex justify-between items-start">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">
                                                    Day {idx + 1}
                                                </div>
                                                <div className="font-bold text-lg leading-tight text-slate-800 truncate mb-1">{day.location || '일정 없음'}</div>
                                                <div className="text-xs font-medium text-slate-500">{day.date}</div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteDay(day.id, e)}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-20"
                                                title="일정 삭제"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            <button 
                                onClick={handleAddDay}
                                className="w-full py-4 text-sm text-slate-400 border border-dashed border-slate-300 rounded-xl hover:text-slate-600 hover:border-slate-400 hover:bg-white/50 transition-all mt-4"
                            >
                                + 일정 추가
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN EDITOR AREA */}
                <div className="flex-1 rounded-2xl glass-card overflow-hidden relative print-break flex flex-col shadow-soft">
                    {!isSidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} className="absolute top-4 left-4 z-20 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white text-slate-500 hidden md:block transition-all no-print">
                            <Menu size={20} />
                        </button>
                    )}

                    <div className="flex-1 overflow-y-auto no-scrollbar" id="printable-content">
                    {selectedDay ? (
                        <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24">
                             <div className="mb-6 flex flex-col gap-1 pl-1">
                                <div className="self-start px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/50 text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 shadow-sm">
                                    Day {trip.days.findIndex(d => d.id === selectedDayId) + 1} 
                                    <span className="text-slate-300">|</span>
                                    <input 
                                        type="date"
                                        className="bg-transparent outline-none cursor-pointer text-slate-600 font-bold"
                                        value={selectedDay.date}
                                        onChange={(e) => updateDayDate(selectedDay.id, e.target.value)}
                                    />
                                </div>
                                
                                <input 
                                    className="text-4xl md:text-6xl font-extrabold bg-transparent outline-none placeholder-slate-200 w-full text-slate-800 drop-shadow-sm leading-tight mt-3 tracking-tight"
                                    value={selectedDay.location}
                                    placeholder="도시/지역 입력"
                                    onChange={(e) => {
                                        const newDays = trip.days.map(d => d.id === selectedDayId ? { ...d, location: e.target.value } : d);
                                        setTrip({...trip, days: newDays});
                                    }}
                                />
                             </div>

                             <BlockEditor 
                                blocks={selectedDay.blocks} 
                                onChange={(blocks) => updateDayBlocks(selectedDay.id, blocks)} 
                                currency={trip.currency}
                             />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-4">
                            <Home size={48} strokeWidth={1} className="opacity-50" />
                            <div className="text-center">
                                <span className="text-xl font-medium block mb-1">여행 계획 시작하기</span>
                                <span className="text-sm opacity-70">왼쪽 메뉴에서 일정을 선택해주세요</span>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        )}

        {/* OTHER VIEWS (Full Width Glass Cards) */}
        {view !== 'SCHEDULE' && (
            <div className="w-full h-full overflow-hidden rounded-2xl glass-card relative shadow-soft">
                {view === 'SAVED' && (
                    <SavedPlaces 
                        places={trip.savedPlaces} 
                        onToggleSave={handleToggleSave} 
                        onRemovePlace={handleRemovePlace} 
                        onAddPlace={handleAddPlace}
                        onUpdatePlace={handleUpdatePlace}
                    />
                )}
                {view === 'TOOLS' && (
                    <TravelTools 
                        trip={trip} 
                        onUpdateScraps={handleUpdateScraps} 
                        onUpdateManualExpenses={handleUpdateManualExpenses}
                        onUpdateBudget={handleUpdateBudget}
                        onUpdateChecklists={handleUpdateChecklists}
                        onUpdateDocuments={handleUpdateDocuments}
                        onImportTrip={handleImportTrip}
                        onRemoveBlockExpense={handleRemoveBlockExpense}
                    />
                )}
                {view === 'MAP' && <MapView trip={trip} />}
            </div>
        )}

      </main>

      {/* FLOATING BOTTOM NAV */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 no-print w-full max-w-sm px-4">
          <nav className="glass-card px-2 py-1.5 rounded-full shadow-glow flex items-center justify-between gap-1">
             <NavBtn active={view === 'SCHEDULE'} icon={<Calendar size={20} />} label="일정" onClick={() => setView('SCHEDULE')} />
             <NavBtn active={view === 'SAVED'} icon={<Heart size={20} />} label="저장" onClick={() => setView('SAVED')} />
             <NavBtn active={view === 'TOOLS'} icon={<Briefcase size={20} />} label="도구" onClick={() => setView('TOOLS')} />
             <NavBtn active={view === 'MAP'} icon={<MapIcon size={20} />} label="지도" onClick={() => setView('MAP')} />
          </nav>
      </div>

    </div>
  );
}

const NavBtn = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-full transition-all duration-300 ${active ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
  >
    <div>{icon}</div>
    {active && <span className="text-xs font-bold whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 hidden sm:block">{label}</span>}
  </button>
);