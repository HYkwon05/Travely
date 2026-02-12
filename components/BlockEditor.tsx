import React, { useState } from 'react';
import { ContentBlock, BlockType, Currency, TransportMode, BookingStatus, ExpenseCategory } from '../types';
import { 
  Type, CheckSquare, MapPin, Link as LinkIcon, DollarSign, X, GripVertical, 
  Bus, Train, Footprints, Car, Plane, ArrowDown, ArrowLeft, Image as ImageIcon, Clock
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  currency: Currency;
}

const TRANSPORT_MODES: { mode: TransportMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'WALK', icon: <Footprints size={12} />, label: 'Walk' },
  { mode: 'BUS', icon: <Bus size={12} />, label: 'Bus' },
  { mode: 'TRAIN', icon: <Train size={12} />, label: 'Train' },
  { mode: 'TAXI', icon: <Car size={12} />, label: 'Car' },
  { mode: 'FLIGHT', icon: <Plane size={12} />, label: 'Fly' },
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
    { status: 'NONE', label: 'Plan', color: 'bg-gray-100 text-gray-500 border-gray-200' },
    { status: 'BOOKED', label: 'Booked', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { status: 'PENDING', label: 'Need', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { status: 'CANCELED', label: 'Cancel', color: 'bg-red-100 text-red-700 border-red-200' },
];

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);

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

  // --- DETAIL VIEW (Unchanged Logic, just clean style) ---
  if (activeLocationId && activeLocationBlock) {
      return (
          <div className="absolute inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="flex-none px-4 py-3 border-b flex items-center gap-3 bg-white/80 backdrop-blur sticky top-0 z-10">
                  <button onClick={() => setActiveLocationId(null)} className="p-2 hover:bg-gray-100 rounded-full text-slate-600">
                      <ArrowLeft size={20} />
                  </button>
                  <div className="flex-1">
                      <input 
                          className="font-bold text-xl outline-none w-full text-slate-800 placeholder-slate-300 bg-transparent"
                          value={activeLocationBlock.content}
                          placeholder="Location Name"
                          onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { content: e.target.value })}
                      />
                  </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
                   {/* Meta Controls */}
                   <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                            <Clock size={16} className="text-slate-400" />
                            <input 
                                type="time"
                                className="font-semibold text-slate-600 bg-transparent outline-none"
                                value={activeLocationBlock.meta?.time || ''}
                                onChange={(e) => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, time: e.target.value } })}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {BOOKING_STATUSES.map(status => (
                                <button
                                    key={status.status}
                                    onClick={() => handleUpdateBlock(activeLocationBlock.id, { meta: { ...activeLocationBlock.meta, status: status.status } })}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                                        activeLocationBlock.meta?.status === status.status 
                                        ? status.color 
                                        : 'bg-white text-slate-400 border-slate-200'
                                    }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                   </div>

                   {/* Children Items */}
                   <div className="space-y-3">
                        {(activeLocationBlock.children || []).map(child => (
                            <div key={child.id} className="group flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex-1">
                                    {child.type === BlockType.TEXT && (
                                        <textarea
                                            className="w-full resize-none outline-none text-slate-700 bg-transparent"
                                            rows={1}
                                            placeholder="Write a note..."
                                            value={child.content}
                                            onChange={(e) => {
                                                handleUpdateChild(child.id, { content: e.target.value });
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                        />
                                    )}
                                    {child.type === BlockType.TODO && (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleUpdateChild(child.id, { checked: !child.checked })}
                                                className={`transition-colors ${child.checked ? 'text-blue-500' : 'text-slate-300'}`}
                                            >
                                                <CheckSquare size={18} />
                                            </button>
                                            <input
                                                className={`flex-1 outline-none bg-transparent ${child.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}
                                                placeholder="Task..."
                                                value={child.content}
                                                onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    {child.type === BlockType.IMAGE && (
                                        <div>
                                            {child.content ? (
                                                <img src={child.content} className="rounded-lg max-h-48 object-cover w-full mb-2" alt="attached" />
                                            ) : null}
                                            <input 
                                                className="w-full text-xs text-slate-400 bg-slate-50 p-2 rounded"
                                                placeholder="Image URL..."
                                                value={child.content}
                                                onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    {child.type === BlockType.EXPENSE && (
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={14} className="text-slate-400" />
                                            <input className="flex-1 outline-none font-medium" placeholder="Expense..." value={child.content} onChange={(e) => handleUpdateChild(child.id, { content: e.target.value })} />
                                            <input className="w-16 text-right text-sm bg-slate-50 rounded p-1" type="number" placeholder="0" value={child.meta?.amount} onChange={(e) => handleUpdateChild(child.id, { meta: {...child.meta, amount: e.target.value} })} />
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleRemoveChild(child.id)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                            </div>
                        ))}
                   </div>
              </div>
              
              {/* Detail Toolbar */}
              <div className="p-2 border-t bg-white flex justify-center gap-4">
                  <button onClick={() => handleAddChild(BlockType.TEXT)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Type size={18} /></button>
                  <button onClick={() => handleAddChild(BlockType.TODO)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><CheckSquare size={18} /></button>
                  <button onClick={() => handleAddChild(BlockType.IMAGE)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><ImageIcon size={18} /></button>
                  <button onClick={() => handleAddChild(BlockType.EXPENSE)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><DollarSign size={18} /></button>
              </div>
          </div>
      );
  }

  // --- MAIN LIST (COMPACT DND) ---
  return (
    <div className="space-y-0 pb-24 relative">
      {/* Color Picker Overlay (Backdrop) */}
      {activeColorPickerId && (
          <div 
            className="fixed inset-0 z-[60] bg-transparent"
            onClick={() => setActiveColorPickerId(null)}
          />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-all ${snapshot.isDragging ? 'opacity-90 scale-[1.02] z-50' : ''}`}
                    >
                      
                      {/* LOCATION BLOCK - SIMPLIFIED */}
                      {block.type === BlockType.LOCATION && (
                          <div 
                              className="group relative flex items-center gap-3 p-3 my-1.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all cursor-pointer"
                              onClick={() => setActiveLocationId(block.id)}
                          >
                              {/* Drag Handle */}
                              <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1">
                                  <GripVertical size={14} />
                              </div>

                              {/* Main Content (Name) - Left Aligned */}
                              <div className="flex-1 min-w-0 flex items-center">
                                  <div className="font-semibold text-base text-slate-800 truncate">{block.content || 'Location'}</div>
                              </div>

                              {/* Time Column - Right Aligned */}
                              <div className="flex flex-col items-center shrink-0 border-l border-slate-100 pl-2">
                                  <input
                                      type="time"
                                      className="bg-transparent font-bold text-sm text-slate-700 text-center outline-none cursor-pointer hover:text-blue-600 min-w-[80px]"
                                      value={block.meta?.time || ''}
                                      onChange={(e) => handleUpdateBlock(block.id, { meta: { ...block.meta, time: e.target.value } })}
                                      onClick={(e) => e.stopPropagation()}
                                  />
                              </div>
                              
                              <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveBlock(block.id); }}
                                  className="text-slate-200 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                  <X size={14} />
                              </button>
                          </div>
                      )}

                      {/* TRANSPORT BLOCK - RAINBOW PICKER */}
                      {block.type === BlockType.TRANSPORT && (
                           <div className="flex items-center gap-2 py-1 px-4 group relative">
                              <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100">
                                  <GripVertical size={12} />
                              </div>
                              <div className="flex-1 flex items-center justify-center relative h-6">
                                  {/* Line background */}
                                  <div 
                                      className="absolute inset-x-0 top-1/2 h-px border-t border-dashed transition-colors opacity-60"
                                      style={{ borderColor: block.meta?.color || '#cbd5e1' }}
                                  ></div>
                                  
                                  <div className="relative z-10 flex gap-1 bg-white/50 backdrop-blur px-2 rounded-full border border-slate-200 shadow-sm scale-90 items-center">
                                      {TRANSPORT_MODES.map(m => (
                                          <button
                                              key={m.mode}
                                              onClick={() => handleUpdateBlock(block.id, { meta: { ...block.meta, mode: m.mode } })}
                                              className={`p-1 rounded-full transition-colors ${block.meta?.mode === m.mode ? 'bg-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                              style={block.meta?.mode === m.mode ? { color: block.meta?.color || '#3b82f6' } : {}}
                                          >
                                              {m.icon}
                                          </button>
                                      ))}
                                      
                                      <div className="w-px h-3 bg-slate-200 mx-1"></div>
                                      
                                      {/* Color Picker Trigger */}
                                      <div className="relative">
                                          <button 
                                              className="w-3 h-3 rounded-full border border-slate-200 shadow-sm shrink-0 hover:scale-125 transition-transform"
                                              style={{ backgroundColor: block.meta?.color || '#94a3b8' }}
                                              onClick={(e) => { e.stopPropagation(); setActiveColorPickerId(block.id); }}
                                          />
                                          
                                          {/* Rainbow Palette Popup */}
                                          {activeColorPickerId === block.id && (
                                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white p-2 rounded-xl shadow-xl border border-slate-100 z-[70] flex gap-2 animate-in fade-in zoom-in-95">
                                                  {RAINBOW_PALETTE.map(c => (
                                                      <button 
                                                          key={c.hex}
                                                          className="w-5 h-5 rounded-full border border-slate-100 hover:scale-125 transition-transform"
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
                                         className="w-10 text-[10px] text-center bg-transparent outline-none font-medium text-slate-500"
                                         placeholder="15m"
                                         value={block.meta?.duration || ''}
                                         onChange={(e) => handleUpdateBlock(block.id, { meta: { ...block.meta, duration: e.target.value } })}
                                      />
                                      <button onClick={() => handleRemoveBlock(block.id)} className="text-slate-300 hover:text-red-400 ml-1"><X size={10} /></button>
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
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex gap-3 z-40 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50">
        <button 
            onClick={() => handleAddBlock(BlockType.LOCATION)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow hover:bg-slate-700 transition-all font-semibold text-xs"
        >
            <MapPin size={14} /> Place
        </button>
        <button 
            onClick={() => handleAddBlock(BlockType.TRANSPORT)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-all font-semibold text-xs"
        >
            <ArrowDown size={14} /> Move
        </button>
      </div>

    </div>
  );
};