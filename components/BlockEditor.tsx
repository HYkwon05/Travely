import React, { useState } from 'react';
import { ContentBlock, BlockType, Currency, TransportMode, BookingStatus, ExpenseCategory } from '../types';
import { 
  Type, CheckSquare, MapPin, Link as LinkIcon, DollarSign, X, GripVertical, 
  Bus, Train, Footprints, Car, Plane, ArrowDown, ArrowLeft, Image as ImageIcon, Clock,
  Search, Map, Globe
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  currency: Currency;
}

const TRANSPORT_MODES: { mode: TransportMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'WALK', icon: <Footprints size={12} />, label: '도보' },
  { mode: 'BUS', icon: <Bus size={12} />, label: '버스' },
  { mode: 'TRAIN', icon: <Train size={12} />, label: '기차' },
  { mode: 'TAXI', icon: <Car size={12} />, label: '차량' },
  { mode: 'FLIGHT', icon: <Plane size={12} />, label: '항공' },
];

const RAINBOW_PALETTE = [
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#22c55e', name: 'Green' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#a855f7', name: 'Purple' },
  { hex: '#94a3b8', name: 'Grey' },
];

const BOOKING_STATUSES: { status: BookingStatus; label: string; color: string }[] = [
    { status: 'PENDING', label: '예약예정', color: 'bg-amber-50 text-amber-600' },
    { status: 'BOOKED', label: '예약됨', color: 'bg-blue-50 text-blue-600' },
    { status: 'NONE', label: '예약필요없음', color: 'bg-slate-100 text-slate-500' },
];

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onChange(items);
  };

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
      children: [],
      meta: type === BlockType.EXPENSE ? { amount: 0, currency: 'EUR', category: 'OTHER', isPaid: false } : 
            type === BlockType.TRANSPORT ? { mode: 'WALK', color: '#94a3b8', duration: '15m' } : 
            type === BlockType.LOCATION ? { status: 'NONE', time: '10:00' } : {}
    };
    onChange([...blocks, newBlock]);
  };

  // --- Sub-Editor Logic (Children) ---
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

  const handleAutoGeocode = async () => {
    if (!activeLocationBlock?.content) return;
    setIsSearchingGeo(true);
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(activeLocationBlock.content)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude } = data.results[0];
            handleUpdateBlock(activeLocationBlock.id, { 
                meta: { ...activeLocationBlock.meta, lat: latitude, lng: longitude } 
            });
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

  // --- DETAIL VIEW (Soft Pinterest Style) ---
  if (activeLocationId && activeLocationBlock) {
      return (
          <div className="absolute inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-xl animate-in slide-in-from-right duration-300 rounded-2xl">
              {/* Header */}
              <div className="flex-none px-6 py-4 border-b border-slate-100 flex items-center gap-4 bg-white/50 sticky top-0 z-10">
                  <button onClick={() => setActiveLocationId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                      <ArrowLeft size={20} />
                  </button>
                  <div className="flex-1">
                      <input 
                          className="font-bold text-2xl outline-none w-full text-slate-800 placeholder-slate-300 bg-transparent"
                          value={activeLocationBlock.content}
                          placeholder="장소 이름"
                          onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { content: e.target.value })}
                      />
                  </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                   {/* Meta Controls - Soft Card */}
                   <div className="bg-white p-4 rounded-2xl shadow-soft border border-white/50 flex flex-col gap-4">
                        {/* Time & Status Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-slate-400" />
                                <input 
                                    type="time"
                                    className="font-semibold text-lg text-slate-600 bg-transparent outline-none cursor-pointer"
                                    value={activeLocationBlock.meta?.time || ''}
                                    onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, time: e.target.value } })}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                {BOOKING_STATUSES.map(status => (
                                    <button
                                        key={status.status}
                                        onClick={() => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, status: status.status } })}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border border-transparent ${
                                            activeLocationBlock.meta?.status === status.status 
                                            ? status.color 
                                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location & Map Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Lat/Lng Search */}
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <MapPin size={10} /> 지도 좌표
                                    </span>
                                    <button 
                                        onClick={handleAutoGeocode}
                                        disabled={!activeLocationBlock.content || isSearchingGeo}
                                        className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isSearchingGeo ? '검색 중...' : <><Search size={10} /> 자동 찾기</>}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="number"
                                        className="w-full p-2 bg-white border-none rounded-lg text-xs font-medium text-slate-600 outline-none shadow-sm placeholder-slate-300"
                                        placeholder="위도"
                                        value={activeLocationBlock.meta?.lat || ''}
                                        onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, lat: parseFloat(e.target.value) } })}
                                    />
                                    <input 
                                        type="number"
                                        className="w-full p-2 bg-white border-none rounded-lg text-xs font-medium text-slate-600 outline-none shadow-sm placeholder-slate-300"
                                        placeholder="경도"
                                        value={activeLocationBlock.meta?.lng || ''}
                                        onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, lng: parseFloat(e.target.value) } })}
                                    />
                                </div>
                            </div>

                            {/* Google Map Link */}
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase tracking-wider flex items-center gap-1.5">
                                    <Map size={10} /> 구글 맵
                                </label>
                                <div className="flex gap-2 items-center bg-white rounded-lg p-2 shadow-sm focus-within:ring-2 focus-within:ring-slate-100 transition-all">
                                    <input 
                                        className="w-full text-xs font-medium text-slate-700 outline-none placeholder-slate-300 bg-transparent"
                                        placeholder="링크 붙여넣기"
                                        value={activeLocationBlock.meta?.googleMapLink || ''}
                                        onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, googleMapLink: e.target.value } })}
                                    />
                                    {activeLocationBlock.meta?.googleMapLink && (
                                        <a href={activeLocationBlock.meta.googleMapLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                                            <LinkIcon size={12} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                   </div>

                   {/* Children Items */}
                   <div className="space-y-3 pb-8">
                        {(activeLocationBlock.children || []).map(child => (
                            <div key={child.id} className="group flex items-start gap-3 bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:shadow-md transition-all duration-200">
                                <div className="flex-1">
                                    {child.type === BlockType.TEXT && (
                                        <textarea
                                            className="w-full resize-none outline-none text-slate-700 bg-transparent leading-relaxed"
                                            rows={1}
                                            placeholder="메모 작성..."
                                            value={child.content}
                                            onChange={(e) => {
                                                handleUpdateChild(child.id, { content: e.target.value });
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                        />
                                    )}
                                    {child.type === BlockType.TODO && (
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleUpdateChild(child.id, { checked: !child.checked })}
                                                className={`transition-colors ${child.checked ? 'text-blue-500' : 'text-slate-300'}`}
                                            >
                                                <CheckSquare size={20} />
                                            </button>
                                            <input
                                                className={`flex-1 outline-none bg-transparent text-lg ${child.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}
                                                placeholder="할 일..."
                                                value={child.content}
                                                onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    {child.type === BlockType.IMAGE && (
                                        <div>
                                            {child.content ? (
                                                <div className="rounded-xl overflow-hidden mb-2 shadow-sm">
                                                    <img src={child.content} className="max-h-64 w-full object-cover hover:scale-105 transition-transform duration-500" alt="attached" />
                                                </div>
                                            ) : null}
                                            <input 
                                                className="w-full text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-transparent focus:bg-white focus:border-blue-100 transition-all outline-none"
                                                placeholder="이미지 URL 붙여넣기..."
                                                value={child.content}
                                                onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    {child.type === BlockType.EXPENSE && (
                                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><DollarSign size={14} /></div>
                                            <input className="flex-1 outline-none font-medium bg-transparent text-sm" placeholder="지출 내역..." value={child.content} onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })} />
                                            <input className="w-20 text-right text-sm bg-white rounded-lg p-1.5 shadow-sm outline-none" type="number" placeholder="0" value={child.meta?.amount} onChange={(e) => handleUpdateChild(child.id, { meta: {...child.meta, amount: e.target.value} })} />
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleRemoveChild(child.id)} className="text-slate-300 hover:text-red-400 p-1 rounded-full hover:bg-red-50 transition-colors"><X size={16} /></button>
                            </div>
                        ))}
                   </div>
              </div>
              
              {/* Detail Toolbar - Floating Pill with extra bottom padding to avoid nav overlap */}
              <div className="p-4 pb-24 bg-white border-t border-slate-50 flex justify-center sticky bottom-0 z-20">
                  <div className="flex gap-2 bg-slate-100 p-1.5 rounded-full shadow-inner">
                    <button onClick={() => handleAddChild(BlockType.TEXT)} className="p-3 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-full transition-all"><Type size={18} /></button>
                    <button onClick={() => handleAddChild(BlockType.TODO)} className="p-3 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-full transition-all"><CheckSquare size={18} /></button>
                    <button onClick={() => handleAddChild(BlockType.IMAGE)} className="p-3 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-full transition-all"><ImageIcon size={18} /></button>
                    <button onClick={() => handleAddChild(BlockType.EXPENSE)} className="p-3 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-full transition-all"><DollarSign size={18} /></button>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN LIST ---
  return (
    <div className="space-y-3 pb-24 relative">
      {/* Color Picker Overlay */}
      {activeColorPickerId && (
          <div 
            className="fixed inset-0 z-[60] bg-transparent"
            onClick={() => setActiveColorPickerId(null)}
          />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-all duration-300 ${snapshot.isDragging ? 'opacity-90 scale-[1.02] z-50 rotate-1' : ''} ${activeColorPickerId === block.id ? 'z-[70] relative' : ''}`}
                    >
                      
                      {/* LOCATION BLOCK - SOFT CARD */}
                      {block.type === BlockType.LOCATION && (
                          <div 
                              className="group relative flex items-stretch gap-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-white/50 hover:shadow-lg hover:bg-white transition-all cursor-pointer overflow-hidden"
                              onClick={() => setActiveLocationId(block.id)}
                          >
                              {/* Drag Handle Area */}
                              <div {...provided.dragHandleProps} className="w-8 flex items-center justify-center text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors">
                                  <GripVertical size={16} />
                              </div>

                              {/* Content Area */}
                              <div className="flex-1 py-4 pr-4 flex items-center gap-4">
                                  {/* Name Left */}
                                  <div className="flex-1 min-w-0">
                                      <div className="font-bold text-lg text-slate-800 truncate leading-tight">{block.content || '장소 이름'}</div>
                                  </div>

                                  {/* Time Right - Pill Shape */}
                                  <div className="shrink-0">
                                       <div 
                                        className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 flex items-center justify-center group-hover:border-blue-100 group-hover:bg-blue-50/50 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                       >
                                          <input
                                              type="time"
                                              className="bg-transparent font-bold text-sm text-slate-600 text-center outline-none cursor-pointer w-[110px] group-hover:text-blue-600 transition-colors"
                                              value={block.meta?.time || ''}
                                              onChange={(e) => handleUpdateBlock(block.id, { meta: { ...block.meta, time: e.target.value } })}
                                          />
                                       </div>
                                  </div>
                              </div>
                              
                              <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveBlock(block.id); }}
                                  className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-400 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                              >
                                  <X size={14} />
                              </button>
                          </div>
                      )}

                      {/* TRANSPORT BLOCK - ELEGANT LINE */}
                      {block.type === BlockType.TRANSPORT && (
                           <div className="flex items-center gap-2 py-2 px-2 md:px-6 group relative">
                              <div {...provided.dragHandleProps} className="absolute left-0 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <GripVertical size={14} />
                              </div>
                              <div className="flex-1 flex items-center justify-center relative h-10">
                                  {/* Dotted Line */}
                                  <div 
                                      className="absolute inset-x-0 top-1/2 h-0 border-t-2 border-dotted transition-colors opacity-40"
                                      style={{ borderColor: block.meta?.color || '#cbd5e1' }}
                                  ></div>
                                  
                                  {/* Floating Pill - FIXED & OVERFLOW HANDLING */}
                                  {/* Removed overflow-hidden from parent pill to allow color picker popout */}
                                  <div className="relative z-10 flex gap-2 bg-white/90 backdrop-blur-md pl-2 pr-2 py-1.5 rounded-full border border-white shadow-sm hover:shadow-md transition-all items-center max-w-full">
                                      
                                      {/* Mode Selector - Wrapped to handle scrolling separately */}
                                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink w-full max-w-[150px] md:max-w-[200px]">
                                        {TRANSPORT_MODES.map(m => (
                                            <button
                                                key={m.mode}
                                                onClick={() => handleUpdateBlock(block.id, { meta: { ...block.meta, mode: m.mode } })}
                                                className={`p-1.5 rounded-full transition-all duration-300 shrink-0 ${block.meta?.mode === m.mode ? 'bg-slate-100 scale-105 shadow-inner' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
                                                style={block.meta?.mode === m.mode ? { color: block.meta?.color || '#3b82f6' } : {}}
                                            >
                                                {m.icon}
                                            </button>
                                        ))}
                                      </div>
                                      
                                      <div className="w-px h-4 bg-slate-200 mx-1 shrink-0"></div>
                                      
                                      {/* Color Dot - Absolute Popout */}
                                      <div className="relative shrink-0">
                                          <button 
                                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0 hover:scale-110 transition-transform"
                                              style={{ backgroundColor: block.meta?.color || '#94a3b8' }}
                                              onClick={(e) => { e.stopPropagation(); setActiveColorPickerId(block.id); }}
                                          />
                                          
                                          {/* Rainbow Picker Popup - Higher Z-Index */}
                                          {activeColorPickerId === block.id && (
                                              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-white/50 z-[100] flex gap-2 animate-in fade-in zoom-in-95 overflow-x-auto max-w-[200px] no-scrollbar">
                                                  {RAINBOW_PALETTE.map(c => (
                                                      <button 
                                                          key={c.hex}
                                                          className="w-6 h-6 rounded-full border-2 border-white hover:scale-125 transition-transform shadow-sm shrink-0"
                                                          style={{ backgroundColor: c.hex }}
                                                          title={c.name}
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleUpdateBlock(block.id, { meta: { ...block.meta, color: c.hex } });
                                                              setActiveColorPickerId(null);
                                                          }}
                                                      />
                                                  ))}
                                              </div>
                                          )}
                                      </div>

                                      <input 
                                         className="w-12 text-xs text-center bg-transparent outline-none font-bold text-slate-500 focus:text-slate-800 transition-colors shrink-0"
                                         placeholder="15분"
                                         value={block.meta?.duration || ''}
                                         onChange={(e) => handleUpdateBlock(block.id, { meta: { ...block.meta, duration: e.target.value } })}
                                      />
                                      <button onClick={() => handleRemoveBlock(block.id)} className="text-slate-300 hover:text-red-400 ml-1 p-1 hover:bg-red-50 rounded-full transition-all shrink-0"><X size={14} /></button>
                                  </div>
                              </div>
                          </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {/* Floating Action Bar */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex gap-3 z-40 bg-white/80 backdrop-blur-xl p-2 rounded-full shadow-glow border border-white/50 no-print">
        <button 
            onClick={() => handleAddBlock(BlockType.LOCATION)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold text-xs whitespace-nowrap"
        >
            <MapPin size={16} /> 장소 추가
        </button>
        <button 
            onClick={() => handleAddBlock(BlockType.TRANSPORT)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-600 border border-slate-100 rounded-full shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all font-bold text-xs whitespace-nowrap"
        >
            <ArrowDown size={16} /> 이동 추가
        </button>
      </div>

    </div>
  );
};