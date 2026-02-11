import React, { useState } from 'react';
import { ContentBlock, BlockType, Currency, TransportMode, BookingStatus, ExpenseCategory } from '../types';
import { 
  Type, CheckSquare, MapPin, Link as LinkIcon, DollarSign, X, GripVertical, 
  Bus, Train, Footprints, Car, Plane, ArrowDown, ChevronRight, ArrowLeft, CalendarCheck, Image as ImageIcon, Clock
} from 'lucide-react';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  currency: Currency;
}

// Colors from palette
const COLOR_NEBULA = '#C0DDDA';
const COLOR_YELLOW = '#FBE29D';
const COLOR_COPPER = '#775537';
const COLOR_BLUE = '#3b82f6';
const COLOR_CREAM_BG = '#FFFDF5';
const COLOR_BORDER = '#FBE29D';
const COLOR_LIGHT_YELLOW = '#FEFCE8'; // Yellow 50

const TRANSPORT_MODES: { mode: TransportMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'WALK', icon: <Footprints size={14} />, label: 'Walk' },
  { mode: 'BUS', icon: <Bus size={14} />, label: 'Bus' },
  { mode: 'TRAIN', icon: <Train size={14} />, label: 'Train' },
  { mode: 'TAXI', icon: <Car size={14} />, label: 'Car' },
  { mode: 'FLIGHT', icon: <Plane size={14} />, label: 'Fly' },
];

// Updated to Rainbow colors: Red, Orange, Yellow, Green, Blue, Purple
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];

const BOOKING_STATUSES: { status: BookingStatus; label: string; color: string }[] = [
    { status: 'NONE', label: 'Plan', color: 'bg-[#FEFCE8] text-[#775537] border border-[#FBE29D]' }, // Changed from grey to light yellow/copper
    { status: 'BOOKED', label: 'Booked', color: 'bg-[#C0DDDA] text-[#1e293b]' }, // Nebula for booked
    { status: 'PENDING', label: 'Need', color: 'bg-[#FBE29D] text-[#775537]' }, // Yellow for pending
    { status: 'CANCELED', label: 'Cancel', color: 'bg-red-100 text-red-700' },
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['FOOD', 'TRANSPORT', 'SHOPPING', 'TOUR', 'ACCOMMODATION', 'OTHER'];

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange, currency }) => {
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);

  const handleUpdateBlock = (id: string, updates: Partial<ContentBlock>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    onChange(newBlocks);
  };

  const handleRemoveBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      checked: false,
      children: [], // Initialize children for Locations
      meta: type === BlockType.EXPENSE ? { amount: 0, currency: 'EUR', category: 'OTHER', isPaid: false } : 
            type === BlockType.TRANSPORT ? { mode: 'WALK', color: COLOR_NEBULA, duration: '10 min' } : 
            type === BlockType.LOCATION ? { status: 'NONE', time: '' } : {}
    };
    onChange([...blocks, newBlock]);
  };

  // --- Sub-Editor for Location Details ---
  const activeLocationBlock = blocks.find(b => b.id === activeLocationId);

  const handleUpdateChild = (childId: string, updates: Partial<ContentBlock>) => {
      if (!activeLocationBlock || !activeLocationBlock.children) return;
      const newChildren = activeLocationBlock.children.map(c => c.id === childId ? { ...c, ...updates } : c);
      handleUpdateBlock(activeLocationBlock.id, { children: newChildren });
  };

  const handleAddChild = (type: BlockType) => {
      if (!activeLocationBlock) return;
      const newChild: ContentBlock = {
          id: crypto.randomUUID(),
          type,
          content: '',
          checked: false,
          meta: type === BlockType.EXPENSE ? { amount: 0, currency: 'EUR', category: 'FOOD', isPaid: false } : {}
      };
      const currentChildren = activeLocationBlock.children || [];
      handleUpdateBlock(activeLocationBlock.id, { children: [...currentChildren, newChild] });
  };

  const handleRemoveChild = (childId: string) => {
      if (!activeLocationBlock || !activeLocationBlock.children) return;
      const newChildren = activeLocationBlock.children.filter(c => c.id !== childId);
      handleUpdateBlock(activeLocationBlock.id, { children: newChildren });
  };

  // Auto-resize textarea helper
  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>, id: string) => {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
      handleUpdateChild(id, { content: e.target.value });
  };

  // --- RENDER DETAIL VIEW ---
  if (activeLocationId && activeLocationBlock) {
      return (
          <div className="absolute inset-0 z-20 flex flex-col animate-in slide-in-from-right duration-300" style={{ backgroundColor: COLOR_CREAM_BG }}>
              {/* Header */}
              <div className="flex-none px-4 py-4 border-b flex items-center gap-3 bg-white" style={{ borderColor: COLOR_BORDER }}>
                  <button onClick={() => setActiveLocationId(null)} className="p-2 hover:bg-[#FFFDF5] rounded-full text-[#334155]">
                      <ArrowLeft size={20} />
                  </button>
                  <div className="flex-1">
                      <input 
                          className="font-hand font-bold text-2xl outline-none w-full text-[#1e293b] placeholder-[#cbd5e1]"
                          value={activeLocationBlock.content}
                          placeholder="Location Name"
                          onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { content: e.target.value })}
                      />
                      {/* Time Input in Detail Header */}
                      <div className="flex items-center gap-2 mt-1">
                          <Clock size={14} className="text-[#94a3b8]" />
                          <input 
                            type="time"
                            className="text-sm font-bold text-[#64748b] bg-transparent outline-none"
                            value={activeLocationBlock.meta?.time || ''}
                            onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, time: e.target.value } })}
                          />
                      </div>
                  </div>
              </div>

              {/* Status & Meta */}
              <div className="px-6 py-4 border-b" style={{ borderColor: COLOR_BORDER, backgroundColor: COLOR_LIGHT_YELLOW }}>
                  <label className="text-[10px] font-bold text-[#775537] uppercase mb-2 block tracking-wider">Status</label>
                  <div className="flex gap-2 flex-wrap">
                      {BOOKING_STATUSES.map(status => (
                          <button
                            key={status.status}
                            onClick={() => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, status: status.status } })}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                activeLocationBlock.meta?.status === status.status 
                                ? status.color + ' shadow-sm'
                                : 'bg-white text-[#94a3b8] border border-[#FBE29D] hover:border-[#C0DDDA]'
                            }`}
                          >
                              {status.label}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Detailed Children List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {(activeLocationBlock.children || []).length === 0 && (
                      <div className="text-center text-[#94a3b8] py-10 text-sm italic font-hand text-lg">
                          Write your story here...
                      </div>
                  )}
                  {(activeLocationBlock.children || []).map(child => (
                      <div key={child.id} className="group relative flex items-start gap-3">
                           <div className="flex-1">
                                {child.type === BlockType.TEXT && (
                                    <textarea
                                    className="w-full resize-none outline-none text-[#1e293b] bg-transparent text-lg font-hand border-l-2 border-transparent focus:border-[#C0DDDA] pl-3 py-1 transition-colors leading-relaxed overflow-hidden"
                                    rows={1}
                                    placeholder="Add a note..."
                                    value={child.content}
                                    onChange={(e) => handleTextareaResize(e, child.id)}
                                    style={{ height: child.content ? 'auto' : '32px' }}
                                    ref={(ref) => {
                                        if (ref && child.content) {
                                            ref.style.height = `${ref.scrollHeight}px`;
                                        }
                                    }}
                                    />
                                )}
                                {child.type === BlockType.TODO && (
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleUpdateChild(child.id, { checked: !child.checked })}
                                            className={`p-0.5 rounded transition-colors ${child.checked ? 'text-[#3b82f6]' : 'text-[#cbd5e1] hover:text-[#94a3b8]'}`}
                                        >
                                            <CheckSquare size={18} />
                                        </button>
                                        <input
                                            type="text"
                                            className={`flex-1 outline-none bg-transparent text-lg font-hand ${child.checked ? 'line-through text-[#94a3b8]' : 'text-[#1e293b]'}`}
                                            placeholder="To-do item"
                                            value={child.content}
                                            onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                        />
                                    </div>
                                )}
                                {child.type === BlockType.LINK && (
                                    <div className="flex items-center gap-2 text-[#2563eb] bg-[#C0DDDA]/30 p-2 rounded-lg border border-[#C0DDDA]">
                                        <LinkIcon size={14} />
                                        <input
                                        type="text"
                                        className="flex-1 outline-none bg-transparent underline text-sm placeholder-[#94a3b8] font-medium"
                                        placeholder="Paste URL here"
                                        value={child.content}
                                        onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                        />
                                    </div>
                                )}
                                {child.type === BlockType.IMAGE && (
                                    <div className="inline-block transform rotate-1 hover:rotate-0 transition-transform duration-300">
                                        <div className="bg-white p-3 pb-8 shadow-[2px_3px_8px_rgba(0,0,0,0.08)] border border-[#e2e8f0] max-w-sm">
                                            {child.content ? (
                                                <div className="relative group/image">
                                                    <img 
                                                        src={child.content} 
                                                        alt="Polaroid" 
                                                        className="w-full h-auto max-h-64 object-cover filter contrast-[1.05]"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=500&auto=format&fit=crop&q=60';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                                                        <input 
                                                            className="bg-white/90 backdrop-blur text-xs p-2 rounded w-3/4 outline-none shadow-lg"
                                                            value={child.content}
                                                            onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                                            placeholder="Image URL"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-square bg-[#f8fafc] flex flex-col items-center justify-center gap-2 text-[#94a3b8]">
                                                    <ImageIcon size={24} className="opacity-50"/>
                                                    <input 
                                                        className="w-3/4 text-center bg-transparent text-xs outline-none border-b border-[#cbd5e1] focus:border-[#C0DDDA] pb-1"
                                                        placeholder="Paste Image URL..."
                                                        autoFocus
                                                        value={child.content}
                                                        onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {child.type === BlockType.EXPENSE && (
                                    <div className="p-3 rounded-lg flex flex-col gap-2 border border-[#FBE29D]" style={{ backgroundColor: '#FBE29D' }}>
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={14} className="text-[#775537]" />
                                            <input
                                                type="text"
                                                className="flex-1 outline-none bg-transparent font-hand font-bold text-lg text-[#1e293b]"
                                                placeholder="Expense description"
                                                value={child.content}
                                                onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <input 
                                                type="number"
                                                className="w-20 p-1 rounded bg-white/50 text-right outline-none border border-transparent text-[#334155]"
                                                placeholder="0"
                                                value={child.meta?.amount || ''}
                                                onChange={(e) => handleUpdateChild(child.id, { meta: { ...child.meta, amount: parseFloat(e.target.value) } })}
                                            />
                                            <select
                                                className="bg-transparent font-bold text-[#334155] outline-none"
                                                value={child.meta?.currency || 'EUR'}
                                                onChange={(e) => handleUpdateChild(child.id, { meta: { ...child.meta, currency: e.target.value } })}
                                            >
                                                <option value="EUR">EUR</option>
                                                <option value="KRW">KRW</option>
                                                <option value="USD">USD</option>
                                            </select>
                                            <select
                                                className="bg-white/50 border border-transparent rounded p-1 outline-none text-[#334155]"
                                                value={child.meta?.category || 'OTHER'}
                                                onChange={(e) => handleUpdateChild(child.id, { meta: { ...child.meta, category: e.target.value } })}
                                            >
                                                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <button 
                                                onClick={() => handleUpdateChild(child.id, { meta: { ...child.meta, isPaid: !child.meta?.isPaid } })}
                                                className={`ml-auto px-2 py-0.5 rounded ${child.meta?.isPaid ? 'bg-[#775537] text-white shadow-sm' : 'bg-white/50 text-[#775537]'}`}
                                            >
                                                {child.meta?.isPaid ? 'PAID' : 'PLANNED'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                           </div>
                           <button onClick={() => handleRemoveChild(child.id)} className="opacity-0 group-hover:opacity-100 text-[#cbd5e1] hover:text-red-400 p-1 self-start transition-opacity">
                               <X size={14} />
                           </button>
                      </div>
                  ))}
              </div>

              {/* Detail Toolbar */}
              <div className="p-3 border-t bg-white flex gap-2 overflow-x-auto no-scrollbar justify-center shadow-[0_-4px_10px_rgba(0,0,0,0.02)]" style={{ borderColor: COLOR_BORDER }}>
                  <AddBtn icon={<Type size={14} />} label="Note" onClick={() => handleAddChild(BlockType.TEXT)} />
                  <AddBtn icon={<CheckSquare size={14} />} label="Todo" onClick={() => handleAddChild(BlockType.TODO)} />
                  <AddBtn icon={<ImageIcon size={14} />} label="Photo" onClick={() => handleAddChild(BlockType.IMAGE)} />
                  <AddBtn icon={<LinkIcon size={14} />} label="Link" onClick={() => handleAddChild(BlockType.LINK)} />
                  <AddBtn icon={<DollarSign size={14} />} label="Cost" onClick={() => handleAddChild(BlockType.EXPENSE)} />
              </div>
          </div>
      );
  }

  // --- RENDER MAIN LIST (Route View) ---
  return (
    <div className="space-y-0 pb-20 relative">
      {blocks.map((block, index) => (
          <div key={block.id}>
            
            {/* LOCATION BLOCK */}
            {block.type === BlockType.LOCATION && (
                <div 
                    onClick={() => setActiveLocationId(block.id)}
                    className="group relative flex items-center gap-4 p-4 my-3 bg-white rounded-lg shadow-sm border hover:border-[#C0DDDA] hover:shadow-md transition-all cursor-pointer"
                    style={{ borderColor: COLOR_BORDER }}
                >
                    <div className="flex-none flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-white" style={{ backgroundColor: COLOR_NEBULA, color: COLOR_COPPER }}>
                            <MapPin size={18} />
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <div className="font-hand font-bold text-xl text-[#1e293b]">{block.content || 'Untitled Location'}</div>
                        <div className="flex gap-3 text-xs text-[#64748b] mt-1">
                            {block.children && block.children.length > 0 && (
                                <span className="flex items-center gap-1 font-medium">
                                    {block.children.length} items
                                </span>
                            )}
                            {block.meta?.status && block.meta.status !== 'NONE' && (
                                <span className={`px-2 py-0.5 rounded font-bold ${BOOKING_STATUSES.find(s => s.status === block.meta.status)?.color}`}>
                                    {BOOKING_STATUSES.find(s => s.status === block.meta.status)?.label}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Time Input Moved to Right - WIDENED to 105px */}
                    <div className="flex flex-col items-end justify-center z-10">
                        <input
                            type="time"
                            className="bg-transparent font-bold text-xs md:text-sm text-[#64748b] hover:bg-[#FFFDF5] p-1 rounded cursor-pointer outline-none w-[105px] text-right"
                            value={block.meta?.time || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { meta: { ...block.meta, time: e.target.value } })}
                            onClick={(e) => e.stopPropagation()} // Prevent opening details
                        />
                    </div>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveBlock(block.id); }}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border opacity-0 group-hover:opacity-100 text-[#94a3b8] hover:text-red-500 transition-opacity"
                        style={{ borderColor: COLOR_BORDER }}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* TRANSPORT BLOCK */}
            {block.type === BlockType.TRANSPORT && (
                 <div className="flex flex-col items-center justify-center py-2 relative group">
                    {/* Visual Line */}
                    <div className="absolute top-0 bottom-0 w-0.5" style={{ backgroundColor: block.meta?.color || '#cbd5e1', borderStyle: 'dotted', borderWidth: '0 0 0 2px' }}></div>
                    
                    {/* Controls */}
                    <div className="z-10 bg-white border rounded-full px-2 py-1 flex items-center gap-2 shadow-sm scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-100 transition-all" style={{ borderColor: COLOR_BORDER }}>
                        {/* Mode */}
                        <div className="flex gap-1">
                           {TRANSPORT_MODES.map(m => (
                               <button
                                  key={m.mode}
                                  onClick={() => handleUpdateBlock(block.id, { meta: { ...block.meta, mode: m.mode } })}
                                  className={`p-1.5 rounded-full transition-colors ${block.meta?.mode === m.mode ? 'bg-[#1e293b] text-white' : 'text-[#94a3b8] hover:bg-[#FFFDF5]'}`}
                                  title={m.label}
                               >
                                   {m.icon}
                               </button>
                           ))}
                        </div>
                        <div className="w-px h-4 bg-[#e2e8f0]"></div>
                        {/* Color */}
                        <div className="flex gap-1">
                           {COLORS.map(c => (
                               <button
                                  key={c}
                                  onClick={() => handleUpdateBlock(block.id, { meta: { ...block.meta, color: c } })}
                                  className="w-3 h-3 rounded-full hover:scale-125 transition-transform"
                                  style={{ backgroundColor: c, border: block.meta?.color === c ? '2px solid white' : 'none', boxShadow: block.meta?.color === c ? '0 0 0 1px #334155' : 'none' }}
                               />
                           ))}
                        </div>
                        <button 
                            onClick={() => handleRemoveBlock(block.id)}
                            className="ml-1 text-[#cbd5e1] hover:text-red-500"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    <input 
                       className="text-[10px] text-center px-2 py-0.5 rounded mt-2 z-10 text-[#64748b] outline-none w-auto font-bold tracking-wide border border-transparent hover:border-[#cbd5e1] transition-colors"
                       style={{ backgroundColor: COLOR_CREAM_BG }}
                       placeholder="Duration"
                       value={block.meta?.duration || ''}
                       onChange={(e) => handleUpdateBlock(block.id, { meta: { ...block.meta, duration: e.target.value } })}
                    />
                </div>
            )}
          </div>
      ))}
      
      {/* Route Builder Action Bar */}
      <div className="flex justify-center gap-3 py-6">
        <button 
            onClick={() => handleAddBlock(BlockType.LOCATION)}
            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-full shadow-lg hover:brightness-110 transition-all active:scale-95 font-bold tracking-wide text-sm"
            style={{ backgroundColor: COLOR_BLUE }}
        >
            <MapPin size={18} /> Add Place
        </button>
        <button 
            onClick={() => handleAddBlock(BlockType.TRANSPORT)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#334155] border rounded-full shadow-sm hover:bg-[#FFFDF5] transition-all active:scale-95 font-bold tracking-wide text-sm"
            style={{ borderColor: COLOR_BORDER }}
        >
            <ArrowDown size={18} /> Add Move
        </button>
      </div>

    </div>
  );
};

const AddBtn = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-2 bg-[#FEFCE8] hover:bg-[#C0DDDA] hover:text-[#775537] rounded-lg text-xs font-bold text-[#334155] whitespace-nowrap transition-colors border hover:border-[#C0DDDA]"
    style={{ borderColor: '#FBE29D' }}
  >
    {icon} {label}
  </button>
);