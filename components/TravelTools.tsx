import React, { useState, useEffect } from 'react';
import { Trip, Scrap, ScrapPlatform, ManualExpense, ChecklistItem, ChecklistGroup, TravelDoc } from '../types';
import { BudgetTracker } from './BudgetTracker';
import { Sun, CloudRain, Cloud, CloudLightning, Search, Sunrise, Sunset, Calculator, Wallet, BookOpen, Instagram, Youtube, Link as LinkIcon, Plus, X, Upload, Download, LayoutGrid, CheckSquare, FileText, Globe, ExternalLink, File, Image as ImageIcon } from 'lucide-react';

interface TravelToolsProps {
  trip: Trip;
  onUpdateScraps: (scraps: Scrap[]) => void;
  onUpdateManualExpenses: (expenses: ManualExpense[]) => void;
  onUpdateBudget: (budget: number) => void;
  onUpdateChecklists: (checklists: ChecklistGroup[]) => void;
  onUpdateDocuments: (docs: TravelDoc[]) => void;
  onImportTrip: (trip: Trip) => void;
  onRemoveBlockExpense?: (id: string) => void;
}

type Tab = 'DASH' | 'CHECK' | 'DOCS' | 'BUDGET';

export const TravelTools: React.FC<TravelToolsProps> = ({ 
    trip, onUpdateScraps, onUpdateManualExpenses, onUpdateBudget, onUpdateChecklists, onUpdateDocuments, onImportTrip, onRemoveBlockExpense
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
              alert('도시를 찾을 수 없습니다.');
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
      if (code <= 1) return <Sun size={32} className="text-amber-400" />;
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
              } catch (err) { alert("올바르지 않은 파일입니다."); }
          };
          reader.readAsText(file);
      };
      input.click();
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      
      {/* Tab Navigation */}
      <div className="bg-white/40 backdrop-blur-md border-b border-white/50 px-4 pt-4 flex gap-6 justify-center sticky top-0 z-20">
          <TabButton active={activeTab === 'DASH'} onClick={() => setActiveTab('DASH')} icon={<LayoutGrid size={20}/>} label="대시보드" />
          <TabButton active={activeTab === 'CHECK'} onClick={() => setActiveTab('CHECK')} icon={<CheckSquare size={20}/>} label="체크리스트" />
          <TabButton active={activeTab === 'DOCS'} onClick={() => setActiveTab('DOCS')} icon={<FileText size={20}/>} label="문서" />
          <TabButton active={activeTab === 'BUDGET'} onClick={() => setActiveTab('BUDGET')} icon={<Wallet size={20}/>} label="가계부" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        
        {/* DASHBOARD */}
        {activeTab === 'DASH' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                
                {/* Weather & Sun Widget */}
                <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-soft border border-white/60 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-bl-full -mr-10 -mt-10 opacity-50 blur-2xl group-hover:opacity-70 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-tr-full -ml-10 -mb-10 opacity-50 blur-2xl group-hover:opacity-70 transition-opacity"></div>

                    <div className="flex gap-2 mb-6 relative z-10">
                        <div className="relative flex-1">
                            <input 
                                className="w-full bg-white/70 border border-white rounded-2xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:bg-white focus:shadow-sm transition-all placeholder-slate-400"
                                value={cityQuery}
                                onChange={(e) => setCityQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchWeather(cityQuery)}
                                placeholder="날씨 검색 (도시명)..."
                            />
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        <button onClick={() => fetchWeather(cityQuery)} className="bg-slate-800 text-white px-5 rounded-2xl text-sm font-bold shadow-lg hover:scale-105 transition-transform">
                            {isLoadingWeather ? '...' : '확인'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                {weatherData ? getWeatherIcon(weatherData.code) : <Sun className="text-slate-300" size={32} />}
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-slate-800 tracking-tight">{weatherData?.temp ?? '--'}°</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{weatherData?.city ?? '도시 선택'}</div>
                            </div>
                        </div>
                        
                        {sunData && (
                            <div className="flex flex-col gap-3 text-right bg-white/50 p-3 rounded-2xl border border-white">
                                <div className="flex items-center gap-2 justify-end text-slate-600">
                                    <span className="text-sm font-bold">{sunData.sunrise}</span>
                                    <Sunrise size={18} className="text-amber-500" />
                                </div>
                                <div className="flex items-center gap-2 justify-end text-slate-600">
                                    <span className="text-sm font-bold">{sunData.sunset}</span>
                                    <Sunset size={18} className="text-indigo-400" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleExport} className="bg-white hover:bg-slate-50 rounded-3xl p-6 shadow-soft border border-white flex flex-col items-center gap-3 transition-all hover:-translate-y-1 group">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                            <Download size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-600">백업 저장</span>
                    </button>
                    <button onClick={handleImportClick} className="bg-white hover:bg-slate-50 rounded-3xl p-6 shadow-soft border border-white flex flex-col items-center gap-3 transition-all hover:-translate-y-1 group">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                            <Upload size={24} />
                        </div>
                        <span className="text-sm font-bold text-slate-600">백업 복원</span>
                    </button>
                </div>

                <CurrencyConverter />
                <LinkScrapbook trip={trip} onUpdateScraps={onUpdateScraps} />
            </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'CHECK' && (
             <div className="space-y-6 pb-20">
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
                        const title = prompt("새 리스트 이름:");
                        if(title) onUpdateChecklists([...trip.checklists, { id: crypto.randomUUID(), title, items: [] }]);
                    }}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold text-sm hover:border-slate-400 hover:text-slate-600 hover:bg-white/50 transition-all"
                >
                    + 새 리스트 추가
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
                onRemoveBlockExpense={onRemoveBlockExpense}
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
        className={`flex flex-col items-center gap-1.5 pb-3 border-b-2 transition-all px-2 ${active ? 'text-slate-800 border-slate-800 scale-105' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
    >
        <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
            {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
);

const CheckListSection = ({ title, items, onToggle, onAdd, onDelete, onDeleteGroup }: any) => {
    const [input, setInput] = useState('');
    return (
        <div className="bg-white rounded-3xl border border-white shadow-soft overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                <button onClick={onDeleteGroup} className="text-xs font-bold text-rose-400 hover:text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">삭제</button>
            </div>
            <div className="p-4 space-y-2">
                {items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 group p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <button onClick={() => onToggle(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-200 bg-white'}`}>
                            {item.checked && <CheckSquare size={14} />}
                        </button>
                        <span className={`flex-1 text-sm font-medium ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                        <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1"><X size={16}/></button>
                    </div>
                ))}
                <div className="mt-2 flex items-center gap-3 px-2">
                    <Plus size={16} className="text-slate-300" />
                    <input 
                        className="w-full text-sm bg-transparent border-none outline-none placeholder-slate-400 font-medium h-10"
                        placeholder="항목 추가..."
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
        </div>
    );
};

const DocsSection = ({ trip, onUpdateDocuments }: any) => {
    
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
            const type = file.type.includes('image') ? 'IMAGE' : 'PDF';
            onUpdateDocuments([...trip.documents, { 
                id: crypto.randomUUID(), 
                type, 
                name: file.name, 
                url: base64 
            }]);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="pb-20">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label className="h-24 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-white/60 hover:border-slate-400 transition-all gap-1 group cursor-pointer">
                    <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <div className="p-2 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors">
                        <Plus size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide">파일 추가</span>
                </label>
                
                {trip.documents.map((doc: any) => (
                    <div key={doc.id} className="h-24 bg-white rounded-2xl shadow-sm border border-white p-3 flex flex-col items-center justify-center relative group hover:-translate-y-0.5 transition-transform cursor-pointer" onClick={() => window.open(doc.url)}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${doc.type === 'IMAGE' ? 'bg-purple-50 text-purple-500' : 'bg-red-50 text-red-500'}`}>
                            {doc.type === 'IMAGE' ? <ImageIcon size={20} /> : <File size={20} />}
                        </div>
                        <span className="text-xs font-bold text-slate-700 text-center w-full truncate px-2">{doc.name}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpdateDocuments(trip.documents.filter((d: any) => d.id !== doc.id)); }} 
                            className="absolute top-1 right-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 rounded-full transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
             </div>
        </div>
    );
};

const LinkScrapbook = ({ trip, onUpdateScraps }: any) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newScrap, setNewScrap] = useState<{ title: string; url: string; platform: ScrapPlatform }>({ title: '', url: '', platform: 'OTHER' });

    const handleAdd = () => {
        if(!newScrap.title) return;
        onUpdateScraps([{ id: crypto.randomUUID(), title: newScrap.title, url: newScrap.url, platform: newScrap.platform, note: '' }, ...trip.scraps]);
        setNewScrap({ title: '', url: '', platform: 'OTHER' });
        setIsAdding(false);
    };

    const getPlatformIcon = (p: ScrapPlatform) => {
        switch(p) {
            case 'YOUTUBE': return <Youtube size={14} className="text-red-500" />;
            case 'INSTAGRAM': return <Instagram size={14} className="text-pink-500" />;
            case 'BLOG': return <BookOpen size={14} className="text-green-500" />;
            default: return <Globe size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-white shadow-soft overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><LinkIcon size={16}/> 저장된 링크</h3>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-white p-2 rounded-xl shadow-sm hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"><Plus size={16} /></button>
            </div>
            {isAdding && (
                <div className="p-4 bg-blue-50/50 space-y-3">
                    <input className="w-full text-sm p-3 rounded-xl border-none shadow-sm outline-none" placeholder="제목" value={newScrap.title} onChange={e => setNewScrap({...newScrap, title: e.target.value})} />
                    <input className="w-full text-sm p-3 rounded-xl border-none shadow-sm outline-none" placeholder="URL 주소" value={newScrap.url} onChange={e => setNewScrap({...newScrap, url: e.target.value})} />
                    <select 
                        className="w-full text-sm p-3 rounded-xl border-none shadow-sm outline-none bg-white text-slate-600 font-medium"
                        value={newScrap.platform}
                        onChange={(e) => setNewScrap({...newScrap, platform: e.target.value as ScrapPlatform})}
                    >
                        <option value="OTHER">웹사이트/기타</option>
                        <option value="YOUTUBE">유튜브</option>
                        <option value="INSTAGRAM">인스타그램</option>
                        <option value="BLOG">블로그</option>
                    </select>
                    <button onClick={handleAdd} className="w-full bg-slate-800 text-white text-xs font-bold py-3 rounded-xl shadow-md hover:bg-slate-700">링크 추가</button>
                </div>
            )}
            <div className="divide-y divide-slate-50">
                {trip.scraps.map((s: any) => (
                    <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 group transition-colors">
                        <div className="min-w-0 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 shadow-sm border border-white">
                                {getPlatformIcon(s.platform)}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-sm text-slate-700 truncate">{s.title}</div>
                                <div className="text-xs text-slate-400 truncate opacity-70 flex items-center gap-1">
                                    {s.url}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             {s.url && (
                                 <a href={s.url} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-blue-500 p-2 hover:bg-blue-50 rounded-full transition-all">
                                     <ExternalLink size={16}/>
                                 </a>
                             )}
                             <button onClick={() => onUpdateScraps(trip.scraps.filter((i: any) => i.id !== s.id))} className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-all"><X size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CurrencyConverter = () => {
    const [val, setVal] = useState('1');
    return (
        <div className="bg-white p-5 rounded-3xl border border-white shadow-soft flex items-center gap-4 overflow-hidden">
             <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 shadow-sm shrink-0"><Calculator size={24} /></div>
             <div className="flex-1 flex items-center gap-2 overflow-hidden">
                 <input className="w-16 md:w-20 bg-slate-50 rounded-xl px-2 py-1 font-bold text-right outline-none text-slate-800 shrink-0" value={val} onChange={e => setVal(e.target.value)} type="number" />
                 <span className="text-xs font-bold text-slate-400 shrink-0">EUR</span>
                 <span className="text-slate-300 text-lg shrink-0">=</span>
                 <div className="flex-1 min-w-0 flex items-baseline gap-1">
                    <span className="font-bold text-slate-700 text-lg truncate">{(parseFloat(val || '0') * 1450).toLocaleString()}</span>
                    <span className="text-xs font-bold text-slate-400">KRW</span>
                 </div>
             </div>
        </div>
    );
};