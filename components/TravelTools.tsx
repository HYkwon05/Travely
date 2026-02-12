import React, { useState, useEffect } from 'react';
import { Trip, Scrap, ScrapPlatform, ManualExpense, ChecklistItem, ChecklistGroup, TravelDoc } from '../types';
import { BudgetTracker } from './BudgetTracker';
import { Sun, CloudRain, Cloud, CloudLightning, Search, Sunrise, Sunset, Calculator, Wallet, BookOpen, Instagram, Youtube, Link as LinkIcon, Plus, X, Upload, Download, LayoutGrid, CheckSquare, FileText } from 'lucide-react';

interface TravelToolsProps {
  trip: Trip;
  onUpdateScraps: (scraps: Scrap[]) => void;
  onUpdateManualExpenses: (expenses: ManualExpense[]) => void;
  onUpdateBudget: (budget: number) => void;
  onUpdateChecklists: (checklists: ChecklistGroup[]) => void;
  onUpdateDocuments: (docs: TravelDoc[]) => void;
  onImportTrip: (trip: Trip) => void;
}

type Tab = 'DASH' | 'CHECK' | 'DOCS' | 'BUDGET';

export const TravelTools: React.FC<TravelToolsProps> = ({ 
    trip, onUpdateScraps, onUpdateManualExpenses, onUpdateBudget, onUpdateChecklists, onUpdateDocuments, onImportTrip 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('DASH');
  
  // Dashboard State
  const [cityQuery, setCityQuery] = useState('Rome');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [sunData, setSunData] = useState<any>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Fetch Weather & Sun Data
  const fetchWeather = async (city: string) => {
      setIsLoadingWeather(true);
      try {
          // 1. Geocoding
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
          const geoData = await geoRes.json();
          
          if (!geoData.results || geoData.results.length === 0) {
              alert('City not found');
              setIsLoadingWeather(false);
              return;
          }
          
          const { latitude, longitude, name, timezone } = geoData.results[0];
          
          // 2. Weather & Sun
          const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=${timezone}`
          );
          const weatherJson = await weatherRes.json();
          
          setWeatherData({
              temp: Math.round(weatherJson.current.temperature_2m),
              code: weatherJson.current.weather_code,
              city: name
          });
          
          setSunData({
              sunrise: weatherJson.daily.sunrise[0].split('T')[1],
              sunset: weatherJson.daily.sunset[0].split('T')[1],
              timezone: timezone
          });

      } catch (e) {
          console.error(e);
      } finally {
          setIsLoadingWeather(false);
      }
  };

  useEffect(() => {
      fetchWeather('Rome');
  }, []);

  const getWeatherIcon = (code: number) => {
      if (code <= 1) return <Sun size={32} className="text-amber-500" />;
      if (code <= 3) return <Cloud size={32} className="text-slate-400" />;
      if (code <= 67) return <CloudRain size={32} className="text-blue-400" />;
      return <CloudLightning size={32} className="text-purple-500" />;
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trip));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `travel_plan.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const importedTrip = JSON.parse(event.target?.result as string);
                  if (importedTrip && importedTrip.id) onImportTrip(importedTrip);
              } catch (err) { alert("Invalid file"); }
          };
          reader.readAsText(file);
      };
      input.click();
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      
      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur border-b border-slate-200 px-4 pt-2 flex gap-6 justify-center">
          <TabButton active={activeTab === 'DASH'} onClick={() => setActiveTab('DASH')} icon={<LayoutGrid size={18}/>} label="Dashboard" />
          <TabButton active={activeTab === 'CHECK'} onClick={() => setActiveTab('CHECK')} icon={<CheckSquare size={18}/>} label="Checklist" />
          <TabButton active={activeTab === 'DOCS'} onClick={() => setActiveTab('DOCS')} icon={<FileText size={18}/>} label="Documents" />
          <TabButton active={activeTab === 'BUDGET'} onClick={() => setActiveTab('BUDGET')} icon={<Wallet size={18}/>} label="Wallet" />
      </div>

      <div className="flex-1 overflow-y-auto p-5 scroll-smooth">
        
        {/* DASHBOARD */}
        {activeTab === 'DASH' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Weather & Sun Widget */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white p-5">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <input 
                                className="w-full bg-white/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                                value={cityQuery}
                                onChange={(e) => setCityQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchWeather(cityQuery)}
                                placeholder="Search city..."
                            />
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        <button onClick={() => fetchWeather(cityQuery)} className="bg-slate-800 text-white px-4 rounded-lg text-sm font-semibold">
                            {isLoadingWeather ? '...' : 'Check'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {weatherData ? getWeatherIcon(weatherData.code) : <Sun className="text-slate-200" />}
                            <div>
                                <div className="text-3xl font-bold text-slate-800">{weatherData?.temp ?? '--'}°</div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{weatherData?.city ?? 'Select City'}</div>
                            </div>
                        </div>
                        
                        {sunData && (
                            <div className="flex flex-col gap-2 text-right">
                                <div className="flex items-center gap-2 justify-end text-slate-600">
                                    <span className="text-sm font-medium">{sunData.sunrise}</span>
                                    <Sunrise size={16} className="text-amber-500" />
                                </div>
                                <div className="flex items-center gap-2 justify-end text-slate-600">
                                    <span className="text-sm font-medium">{sunData.sunset}</span>
                                    <Sunset size={16} className="text-indigo-400" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleExport} className="bg-white/70 hover:bg-white backdrop-blur rounded-xl p-4 border border-white shadow-sm flex flex-col items-center gap-2 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Download size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Backup Plan</span>
                    </button>
                    <button onClick={handleImportClick} className="bg-white/70 hover:bg-white backdrop-blur rounded-xl p-4 border border-white shadow-sm flex flex-col items-center gap-2 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Restore Plan</span>
                    </button>
                </div>

                <CurrencyConverter />
                <LinkScrapbook trip={trip} onUpdateScraps={onUpdateScraps} />
            </div>
        )}

        {/* Other Tabs (Keep logic, update UI for clean look) */}
        {activeTab === 'CHECK' && (
             <div className="space-y-4 pb-20">
                {trip.checklists.map(group => (
                    <CheckListSection 
                        key={group.id}
                        title={group.title} 
                        items={group.items} 
                        onToggle={(itemId: string) => {
                             const newLists = trip.checklists.map(g => g.id === group.id ? {...g, items: g.items.map(i => i.id === itemId ? {...i, checked: !i.checked} : i)} : g);
                             onUpdateChecklists(newLists);
                        }}
                        onAdd={(text: string) => {
                            const newItem = { id: crypto.randomUUID(), text, checked: false };
                            onUpdateChecklists(trip.checklists.map(g => g.id === group.id ? {...g, items: [...g.items, newItem]} : g));
                        }}
                        onDelete={(itemId: string) => {
                             onUpdateChecklists(trip.checklists.map(g => g.id === group.id ? {...g, items: g.items.filter(i => i.id !== itemId)} : g));
                        }}
                        onDeleteGroup={() => onUpdateChecklists(trip.checklists.filter(g => g.id !== group.id))}
                    />
                ))}
                <button 
                    onClick={() => {
                        const title = prompt("New List Name:");
                        if(title) onUpdateChecklists([...trip.checklists, { id: crypto.randomUUID(), title, items: [] }]);
                    }}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold text-sm hover:border-slate-400 hover:text-slate-600"
                >
                    + Add New List
                </button>
            </div>
        )}

        {activeTab === 'DOCS' && (
            <DocsSection trip={trip} onUpdateDocuments={onUpdateDocuments} />
        )}

        {activeTab === 'BUDGET' && (
            <BudgetTracker 
                trip={trip} 
                onUpdateManualExpenses={onUpdateManualExpenses}
                onUpdateBudget={onUpdateBudget}
            />
        )}

      </div>
    </div>
  );
};

// UI Components
const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center gap-1 pb-2 border-b-2 transition-all px-2 ${active ? 'text-slate-800 border-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
    >
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
);

const CheckListSection = ({ title, items, onToggle, onAdd, onDelete, onDeleteGroup }: any) => {
    const [input, setInput] = useState('');
    return (
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">{title}</h3>
                <button onClick={onDeleteGroup} className="text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>
            <div className="p-3 space-y-2">
                {items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 group">
                        <button onClick={() => onToggle(item.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${item.checked ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300'}`}>
                            {item.checked && <CheckSquare size={12} />}
                        </button>
                        <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-300' : 'text-slate-700'}`}>{item.text}</span>
                        <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400"><X size={14}/></button>
                    </div>
                ))}
                <input 
                    className="w-full text-sm bg-transparent border-b border-transparent focus:border-blue-300 outline-none placeholder-slate-300 py-1"
                    placeholder="Add item..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && input.trim()) {
                            onAdd(input.trim());
                            setInput('');
                        }
                    }}
                />
            </div>
        </div>
    );
};

const DocsSection = ({ trip, onUpdateDocuments }: any) => {
    const handleAdd = () => {
        const name = prompt("Document Name:");
        if (name) onUpdateDocuments([...trip.documents, { id: crypto.randomUUID(), type: 'PDF', name, url: '#' }]);
    };
    return (
        <div className="grid grid-cols-2 gap-4">
             <button onClick={handleAdd} className="h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-slate-400 transition-all">
                 <Plus size={24} />
                 <span className="text-xs font-bold mt-2">Add Doc</span>
             </button>
             {trip.documents.map((doc: any) => (
                 <div key={doc.id} className="h-32 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col items-center justify-center relative group">
                     <FileText size={32} className="text-slate-700 mb-2" />
                     <span className="text-xs font-bold text-slate-700 text-center">{doc.name}</span>
                     <button 
                        onClick={() => onUpdateDocuments(trip.documents.filter((d: any) => d.id !== doc.id))} 
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                     >
                         <X size={14} />
                     </button>
                 </div>
             ))}
        </div>
    );
};

const LinkScrapbook = ({ trip, onUpdateScraps }: any) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newScrap, setNewScrap] = useState({ title: '', url: '' });

    const handleAdd = () => {
        if(!newScrap.title) return;
        onUpdateScraps([{ id: crypto.randomUUID(), title: newScrap.title, url: newScrap.url, platform: 'OTHER', note: '' }, ...trip.scraps]);
        setNewScrap({ title: '', url: '' });
        setIsAdding(false);
    };

    return (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><LinkIcon size={14}/> Links</h3>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-white p-1 rounded shadow-sm hover:bg-blue-50"><Plus size={16} /></button>
            </div>
            {isAdding && (
                <div className="p-3 bg-blue-50 space-y-2">
                    <input className="w-full text-xs p-2 rounded border border-blue-100" placeholder="Title" value={newScrap.title} onChange={e => setNewScrap({...newScrap, title: e.target.value})} />
                    <input className="w-full text-xs p-2 rounded border border-blue-100" placeholder="URL" value={newScrap.url} onChange={e => setNewScrap({...newScrap, url: e.target.value})} />
                    <button onClick={handleAdd} className="w-full bg-slate-800 text-white text-xs font-bold py-2 rounded">Add</button>
                </div>
            )}
            <div className="divide-y divide-slate-50">
                {trip.scraps.map((s: any) => (
                    <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 group">
                        <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-700 truncate">{s.title}</div>
                            <div className="text-[10px] text-slate-400 truncate">{s.url}</div>
                        </div>
                        <button onClick={() => onUpdateScraps(trip.scraps.filter((i: any) => i.id !== s.id))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><X size={14}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CurrencyConverter = () => {
    const [val, setVal] = useState('1');
    return (
        <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-white shadow-sm flex items-center gap-3">
             <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Calculator size={20} /></div>
             <div className="flex-1 flex items-center gap-2">
                 <input className="w-16 bg-transparent font-bold text-right outline-none" value={val} onChange={e => setVal(e.target.value)} type="number" />
                 <span className="text-xs font-bold text-slate-400">EUR</span>
                 <span className="text-slate-300">=</span>
                 <span className="font-bold text-slate-700">{(parseFloat(val || '0') * 1450).toLocaleString()}</span>
                 <span className="text-xs font-bold text-slate-400">KRW</span>
             </div>
        </div>
    );
};