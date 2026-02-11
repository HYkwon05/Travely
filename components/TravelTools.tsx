import React, { useState, useEffect } from 'react';
import { Trip, Scrap, ScrapPlatform, ManualExpense, ChecklistItem, ChecklistGroup, TravelDoc } from '../types';
import { BudgetTracker } from './BudgetTracker';
import { Sun, Calculator, Clock, Wallet, BookOpen, Instagram, Youtube, Link as LinkIcon, Plus, X, ExternalLink, CheckSquare, FileText, Image, LayoutGrid, Luggage, Trash2, Edit2, Upload, Download } from 'lucide-react';

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

const COLOR_NEBULA = '#C0DDDA';
const COLOR_YELLOW = '#FBE29D';
const COLOR_COPPER = '#775537';
const COLOR_BORDER = '#FBE29D';
const COLOR_LIGHT_YELLOW = '#FEFCE8';

export const TravelTools: React.FC<TravelToolsProps> = ({ 
    trip, onUpdateScraps, onUpdateManualExpenses, onUpdateBudget, onUpdateChecklists, onUpdateDocuments, onImportTrip 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('DASH');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  
  // Real-time clock
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRomeTime = () => {
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Rome' });
  };
  
  const getSeoulTime = () => {
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
  };

  // Export Logic
  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trip));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `travel_plan_${trip.title.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // Import Logic
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
                  if (importedTrip && importedTrip.id && importedTrip.days) {
                      onImportTrip(importedTrip);
                  } else {
                      alert("Invalid file format.");
                  }
              } catch (err) {
                  alert("Error reading file.");
              }
          };
          reader.readAsText(file);
      };
      input.click();
  };

  // Checklist Group Handlers
  const addChecklistGroup = () => {
      if (!newChecklistTitle.trim()) return;
      const newGroup: ChecklistGroup = {
          id: crypto.randomUUID(),
          title: newChecklistTitle.trim(),
          items: []
      };
      onUpdateChecklists([...trip.checklists, newGroup]);
      setNewChecklistTitle('');
  };

  const deleteChecklistGroup = (groupId: string) => {
      if (confirm("Delete this entire checklist group?")) {
          onUpdateChecklists(trip.checklists.filter(g => g.id !== groupId));
      }
  };

  const updateChecklistGroupTitle = (groupId: string, newTitle: string) => {
      onUpdateChecklists(trip.checklists.map(g => g.id === groupId ? { ...g, title: newTitle } : g));
  };

  // Checklist Item Handlers
  const toggleCheck = (groupId: string, itemId: string) => {
      onUpdateChecklists(trip.checklists.map(group => {
          if (group.id !== groupId) return group;
          return {
              ...group,
              items: group.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item)
          };
      }));
  };

  const addItemToChecklist = (groupId: string, text: string) => {
      const newItem: ChecklistItem = { id: crypto.randomUUID(), text, checked: false };
      onUpdateChecklists(trip.checklists.map(group => {
          if (group.id !== groupId) return group;
          return { ...group, items: [...group.items, newItem] };
      }));
  };

  const deleteCheckItem = (groupId: string, itemId: string) => {
      onUpdateChecklists(trip.checklists.map(group => {
          if (group.id !== groupId) return group;
          return { ...group, items: group.items.filter(item => item.id !== itemId) };
      }));
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      
      {/* Top Tab Bar */}
      <div className="bg-white border-b px-4 pt-2 flex gap-8 overflow-x-auto no-scrollbar" style={{ borderColor: COLOR_BORDER }}>
          <TabButton active={activeTab === 'DASH'} onClick={() => setActiveTab('DASH')} icon={<LayoutGrid size={18}/>} label="Dash" />
          <TabButton active={activeTab === 'CHECK'} onClick={() => setActiveTab('CHECK')} icon={<CheckSquare size={18}/>} label="Check" />
          <TabButton active={activeTab === 'DOCS'} onClick={() => setActiveTab('DOCS')} icon={<FileText size={18}/>} label="Docs" />
          <TabButton active={activeTab === 'BUDGET'} onClick={() => setActiveTab('BUDGET')} icon={<Wallet size={18}/>} label="Budget" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'DASH' && (
            <div className="space-y-6">
                {/* Weather & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-lg flex flex-col justify-between h-32 relative overflow-hidden" style={{ backgroundColor: COLOR_YELLOW + '80' }}>
                        <Sun size={64} className="text-[#f59e0b] absolute -right-2 -top-2 opacity-20" />
                        <div className="flex items-center gap-2 text-[#92400e] text-[10px] font-bold uppercase tracking-wider">
                            <Sun size={14} className="text-[#f59e0b]" /> Weather
                        </div>
                        <div className="z-10">
                            <div className="text-3xl font-hand font-bold text-[#1e293b]">22°C</div>
                            <div className="text-sm text-[#92400e]/80">Sunny, Rome</div>
                        </div>
                    </div>
                    <div className="p-5 rounded-lg flex flex-col justify-between h-32 relative overflow-hidden" style={{ backgroundColor: COLOR_NEBULA + '80' }}>
                        <Clock size={64} className="text-[#1e40af] absolute -right-2 -top-2 opacity-20" />
                        <div className="flex items-center gap-2 text-[#1e40af] text-[10px] font-bold uppercase tracking-wider">
                            <Clock size={14} className="text-[#1e40af]" /> Time
                        </div>
                        <div className="space-y-1 z-10 text-[#1e293b]">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xl font-hand font-bold">{getRomeTime()}</span>
                                <span className="text-xs opacity-70">Rome</span>
                            </div>
                            <div className="flex justify-between items-baseline opacity-50">
                                <span className="text-lg font-hand font-bold">{getSeoulTime()}</span>
                                <span className="text-xs">Seoul</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* SHARE PLAN SECTION (Data Management) */}
                <div className="bg-white rounded-lg shadow-sm border p-4" style={{ borderColor: COLOR_BORDER }}>
                    <div className="flex items-center gap-2 mb-3 text-sm font-bold text-[#64748b] uppercase tracking-wider">
                        <Luggage size={14} /> Share Plan
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex-1 py-3 text-white rounded-lg font-bold text-sm shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: COLOR_COPPER }}
                        >
                            <Download size={16} /> Backup Plan
                        </button>
                        <button 
                            onClick={handleImportClick}
                            className="flex-1 py-3 bg-white border rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                            style={{ borderColor: COLOR_NEBULA, color: '#1e40af', backgroundColor: '#FFFDF5' }}
                        >
                            <Upload size={16} /> Load Plan
                        </button>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-2 text-center">
                        * Send the Backup file to your mom, then click 'Load Plan' on her phone.
                    </p>
                </div>

                <CurrencyConverter />
                <LinkScrapbook trip={trip} onUpdateScraps={onUpdateScraps} />
            </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === 'CHECK' && (
            <div className="space-y-6 pb-20">
                {trip.checklists.map(group => (
                    <CheckListSection 
                        key={group.id}
                        title={group.title} 
                        icon={<CheckSquare size={18} style={{ color: COLOR_COPPER }}/>}
                        items={group.items} 
                        onToggle={(itemId: string) => toggleCheck(group.id, itemId)}
                        onAdd={(text: string) => addItemToChecklist(group.id, text)}
                        onDelete={(itemId: string) => deleteCheckItem(group.id, itemId)}
                        onDeleteGroup={() => deleteChecklistGroup(group.id)}
                        onUpdateTitle={(newTitle: string) => updateChecklistGroupTitle(group.id, newTitle)}
                    />
                ))}
                
                {/* Add New Group */}
                <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-2" style={{ borderColor: COLOR_BORDER }}>
                    <Plus size={20} className="text-[#94a3b8]" />
                    <input 
                        className="flex-1 bg-transparent text-sm outline-none"
                        placeholder="New List Name (e.g. Souvenirs)"
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addChecklistGroup()}
                    />
                    <button 
                        onClick={addChecklistGroup}
                        disabled={!newChecklistTitle.trim()}
                        className="text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                        style={{ backgroundColor: COLOR_NEBULA, color: COLOR_COPPER }}
                    >
                        Add List
                    </button>
                </div>
            </div>
        )}

        {/* DOCS TAB */}
        {activeTab === 'DOCS' && (
            <DocsSection trip={trip} onUpdateDocuments={onUpdateDocuments} />
        )}

        {/* BUDGET TAB */}
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

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center gap-1 pb-2 border-b-2 transition-colors min-w-[3rem] ${active ? 'text-[#1e293b]' : 'border-transparent text-[#94a3b8] hover:text-[#334155]'}`}
        style={{ borderColor: active ? COLOR_NEBULA : 'transparent' }}
    >
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
);

const CheckListSection = ({ title, icon, items, onToggle, onAdd, onDelete, onDeleteGroup, onUpdateTitle }: any) => {
    const [inputValue, setInputValue] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    const handleTitleSave = () => {
        if (tempTitle.trim()) {
            onUpdateTitle(tempTitle.trim());
        } else {
            setTempTitle(title);
        }
        setIsEditingTitle(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ borderColor: COLOR_BORDER }}>
            <div className="p-4 border-b flex items-center justify-between font-bold text-[#1e293b]" style={{ backgroundColor: COLOR_LIGHT_YELLOW, borderColor: '#FDE68A' }}>
                <div className="flex items-center gap-2 flex-1">
                    {icon} 
                    {isEditingTitle ? (
                        <input 
                            className="bg-white border border-[#C0DDDA] rounded px-1 outline-none text-lg font-hand w-full"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            autoFocus
                        />
                    ) : (
                        <span onClick={() => setIsEditingTitle(true)} className="cursor-pointer hover:underline font-hand text-lg">{title}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsEditingTitle(!isEditingTitle)} className="text-[#94a3b8] hover:text-[#775537]"><Edit2 size={14} /></button>
                    <button onClick={onDeleteGroup} className="text-[#94a3b8] hover:text-red-500"><Trash2 size={14} /></button>
                </div>
            </div>
            <div className="p-2 space-y-1">
                {items.map((item: ChecklistItem) => (
                    <div key={item.id} className="group flex items-center gap-3 p-2 hover:bg-[#FFFDF5] rounded-lg">
                        <button 
                            onClick={() => onToggle(item.id)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-[#C0DDDA] border-[#C0DDDA] text-[#1e293b]' : 'border-[#FDE68A] hover:border-[#C0DDDA]'}`}
                        >
                            {item.checked && <CheckSquare size={12} />}
                        </button>
                        <span className={`flex-1 text-lg font-hand pt-1 ${item.checked ? 'text-[#94a3b8] line-through' : 'text-[#1e293b]'}`}>{item.text}</span>
                        <button onClick={() => onDelete(item.id)} className="text-[#cbd5e1] hover:text-red-500 opacity-0 group-hover:opacity-100 p-1">
                            <X size={14} />
                        </button>
                    </div>
                ))}
                <div className="flex items-center gap-2 p-2">
                    <Plus size={16} className="text-[#94a3b8]" />
                    <input 
                        className="flex-1 bg-transparent text-sm outline-none placeholder-[#94a3b8]"
                        placeholder="Add new item..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && inputValue.trim()) {
                                onAdd(inputValue.trim());
                                setInputValue('');
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

const DocsSection = ({ trip, onUpdateDocuments }: any) => {
    // Mock upload handler
    const handleUpload = () => {
        const docName = prompt("Document Name (e.g. Flight Ticket):");
        if (docName) {
            const newDoc: TravelDoc = {
                id: crypto.randomUUID(),
                type: 'PDF',
                name: docName,
                url: '#'
            };
            onUpdateDocuments([...trip.documents, newDoc]);
        }
    };
    
    return (
        <div className="space-y-4">
             <button 
                onClick={handleUpload}
                className="w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-[#94a3b8] hover:bg-[#FFFDF5] hover:border-[#C0DDDA] hover:text-[#775537] transition-all"
                style={{ borderColor: '#FDE68A' }}
             >
                 <Plus size={32} className="mb-2 opacity-50" />
                 <span className="text-sm font-medium">Add PDF, Image or QR</span>
             </button>

             <div className="grid grid-cols-2 gap-4">
                 {trip.documents.map((doc: TravelDoc) => (
                     <div key={doc.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center text-center gap-3 relative group hover:shadow-md transition-shadow" style={{ borderColor: COLOR_BORDER }}>
                         <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#775537]" style={{ backgroundColor: COLOR_NEBULA }}>
                             {doc.type === 'IMAGE' ? <Image size={24} /> : <FileText size={24} />}
                         </div>
                         <div className="text-lg font-hand font-bold text-[#1e293b] truncate w-full pt-1">{doc.name}</div>
                         <div className="text-[10px] text-[#64748b] uppercase bg-[#FFFDF5] px-2 py-0.5 rounded font-bold">{doc.type}</div>
                         <button 
                             onClick={() => onUpdateDocuments(trip.documents.filter((d: any) => d.id !== doc.id))}
                             className="absolute top-2 right-2 text-[#cbd5e1] hover:text-red-500 opacity-0 group-hover:opacity-100"
                         >
                             <X size={16} />
                         </button>
                     </div>
                 ))}
             </div>
        </div>
    );
};

const LinkScrapbook = ({ trip, onUpdateScraps }: any) => {
    const [isAddingScrap, setIsAddingScrap] = useState(false);
    const [newScrap, setNewScrap] = useState<Partial<Scrap>>({ platform: 'BLOG' });

    const handleAddScrap = () => {
        if (!newScrap.url || !newScrap.title) return;
        const scrap: Scrap = {
            id: crypto.randomUUID(),
            title: newScrap.title,
            url: newScrap.url.startsWith('http') ? newScrap.url : `https://${newScrap.url}`,
            platform: newScrap.platform || 'OTHER',
            note: newScrap.note || ''
        };
        onUpdateScraps([scrap, ...(trip.scraps || [])]);
        setNewScrap({ platform: 'BLOG', title: '', url: '', note: '' });
        setIsAddingScrap(false);
    };

    const getPlatformIcon = (platform: ScrapPlatform) => {
        switch(platform) {
            case 'BLOG': return <BookOpen size={16} className="text-[#94a3b8]" />;
            case 'INSTAGRAM': return <Instagram size={16} className="text-pink-600" />;
            case 'YOUTUBE': return <Youtube size={16} className="text-red-600" />;
            default: return <LinkIcon size={16} className="text-[#3b82f6]" />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ borderColor: COLOR_BORDER }}>
        <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: COLOR_LIGHT_YELLOW, borderColor: '#FDE68A' }}>
             <div className="font-bold text-[#1e293b] flex items-center gap-2">
                <LinkIcon size={18} className="text-[#94a3b8]" />
                Link Scrapbook
             </div>
             <button 
                onClick={() => setIsAddingScrap(!isAddingScrap)}
                className="text-[#334155] hover:bg-[#FFFDF5] p-1.5 rounded-full"
             >
                 {isAddingScrap ? <X size={20} /> : <Plus size={20} />}
             </button>
        </div>

        {isAddingScrap && (
            <div className="p-4 space-y-3 border-b border-[#C0DDDA]/50" style={{ backgroundColor: '#FFFDF5' }}>
                <select 
                    className="w-full p-2 rounded-lg border border-[#FDE68A] text-sm bg-white"
                    value={newScrap.platform}
                    onChange={(e) => setNewScrap({...newScrap, platform: e.target.value as ScrapPlatform})}
                >
                    <option value="BLOG">Blog Post</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="OTHER">Other Website</option>
                </select>
                <input 
                    className="w-full p-2 rounded-lg border border-[#FDE68A] text-sm"
                    placeholder="Title"
                    value={newScrap.title || ''}
                    onChange={(e) => setNewScrap({...newScrap, title: e.target.value})}
                />
                <input 
                    className="w-full p-2 rounded-lg border border-[#FDE68A] text-sm"
                    placeholder="URL"
                    value={newScrap.url || ''}
                    onChange={(e) => setNewScrap({...newScrap, url: e.target.value})}
                />
                <button onClick={handleAddScrap} className="w-full text-white py-2 rounded-lg text-sm font-bold shadow-md" style={{ backgroundColor: COLOR_COPPER }}>Add Link</button>
            </div>
        )}

        <div className="divide-y divide-[#f1f5f9]">
            {(trip.scraps || []).map((scrap: Scrap) => (
                <div key={scrap.id} className="p-4 flex items-center gap-3 hover:bg-[#FFFDF5] group transition-colors">
                    <div className="mt-0.5">{getPlatformIcon(scrap.platform)}</div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1e293b] truncate text-sm">{scrap.title}</div>
                        <a href={scrap.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#94a3b8] hover:text-[#3b82f6] truncate block">
                            {scrap.url}
                        </a>
                    </div>
                    <button 
                        onClick={() => onUpdateScraps(trip.scraps.filter((s: any) => s.id !== scrap.id))}
                        className="text-[#cbd5e1] hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
      </div>
    );
}

const CurrencyConverter = () => {
    const [euro, setEuro] = useState('1');
    const RATE = 1450;
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border" style={{ borderColor: COLOR_BORDER }}>
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[#1e293b] flex items-center gap-2 text-sm">
                    <Calculator size={16} className="text-[#94a3b8]"/> Currency
                </h3>
                <span className="text-[10px] text-[#1e40af] font-medium bg-[#FFFDF5] px-2 py-0.5 rounded-full border border-[#C0DDDA]">1 EUR = {RATE} KRW</span>
            </div>
            <div className="flex items-center gap-3">
                <input 
                    type="number" 
                    value={euro}
                    onChange={(e) => setEuro(e.target.value)}
                    className="w-full bg-[#f8fafc] rounded-lg p-2 font-bold text-center outline-none border border-transparent focus:border-[#C0DDDA]"
                />
                <span className="text-[#94a3b8]">=</span>
                <div className="w-full bg-[#f8fafc] rounded-lg p-2 font-bold text-center text-[#334155]">
                    {(parseFloat(euro || '0') * RATE).toLocaleString()}
                </div>
            </div>
        </div>
    );
}