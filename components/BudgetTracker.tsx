import React, { useMemo, useState } from 'react';
import { Trip, BlockType, ManualExpense, ExpenseCategory, Currency } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Plus, X, Edit2, Check, Trash2, TrendingUp, Wallet, 
  Plane, BedDouble, Utensils, Bus, ShoppingBag, Camera, MoreHorizontal 
} from 'lucide-react';

interface BudgetTrackerProps {
  trip: Trip;
  onUpdateManualExpenses: (expenses: ManualExpense[]) => void;
  onUpdateBudget: (budget: number) => void;
  onRemoveBlockExpense?: (id: string) => void;
}

const COLORS_BY_CATEGORY: Record<ExpenseCategory, string> = {
    'FLIGHT': '#3b82f6', // Blue 500
    'ACCOMMODATION': '#0ea5e9', // Sky 500
    'FOOD': '#f59e0b', // Amber 500
    'TRANSPORT': '#1e293b', // Slate 800
    'SHOPPING': '#8b5cf6', // Violet 500
    'TOUR': '#14b8a6', // Teal 500
    'OTHER': '#94a3b8' // Slate 400
};

const ICONS_BY_CATEGORY: Record<ExpenseCategory, React.ReactNode> = {
    'FLIGHT': <Plane size={18} />,
    'ACCOMMODATION': <BedDouble size={18} />,
    'FOOD': <Utensils size={18} />,
    'TRANSPORT': <Bus size={18} />,
    'SHOPPING': <ShoppingBag size={18} />,
    'TOUR': <Camera size={18} />,
    'OTHER': <MoreHorizontal size={18} />
};

const RATES: Record<string, number> = {
    'EUR': 1450,
    'USD': 1350,
    'JPY': 9,
    'KRW': 1
};

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ trip, onUpdateManualExpenses, onUpdateBudget, onRemoveBlockExpense }) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(trip.budget ? trip.budget.toString() : '0');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  
  // New Expense State
  const [newExp, setNewExp] = useState<Partial<ManualExpense>>({ currency: 'KRW', category: 'OTHER', isPaid: true });

  const { totalSpent, remaining, expensesByCategory, allExpenses } = useMemo(() => {
      let total = 0;
      const all: any[] = [];
      const catTotals: Record<string, number> = {};

      // 1. Manual Expenses
      (trip.manualExpenses || []).forEach(exp => {
          const kwn = exp.amount * (RATES[exp.currency] || 1);
          total += kwn;
          all.push({ ...exp, kwn, source: 'MANUAL' });
          catTotals[exp.category] = (catTotals[exp.category] || 0) + kwn;
      });

      // 2. Block Expenses
      (trip.days || []).forEach(day => {
          (day.blocks || []).forEach(block => {
              // Check Children (usually expenses are here)
              if (block.children) {
                  block.children.forEach(child => {
                      if (child.type === BlockType.EXPENSE && child.meta?.amount) {
                          const currency = child.meta.currency || 'EUR';
                          const category = child.meta.category || 'OTHER';
                          const kwn = child.meta.amount * (RATES[currency] || 1);
                          total += kwn;
                          all.push({
                              id: child.id,
                              title: child.content || '기타 지출',
                              amount: child.meta.amount,
                              currency,
                              category,
                              isPaid: child.meta.isPaid,
                              kwn,
                              source: 'BLOCK'
                          });
                          catTotals[category] = (catTotals[category] || 0) + kwn;
                      }
                  });
              }
              // Check Top Level (less common but possible)
              if (block.type === BlockType.EXPENSE && block.meta?.amount) {
                  const currency = block.meta.currency || 'EUR';
                  const category = block.meta.category || 'OTHER';
                  const kwn = block.meta.amount * (RATES[currency] || 1);
                  total += kwn;
                  all.push({
                      id: block.id,
                      title: block.content || '기타 지출',
                      amount: block.meta.amount,
                      currency,
                      category,
                      isPaid: block.meta.isPaid,
                      kwn,
                      source: 'BLOCK'
                  });
                  catTotals[category] = (catTotals[category] || 0) + kwn;
              }
          });
      });

      const chartData = Object.keys(catTotals).map(cat => ({
          name: cat,
          value: catTotals[cat]
      }));

      const sortedChartData = [...chartData].sort((a,b) => b.value - a.value);

      return { totalSpent: total, remaining: trip.budget - total, expensesByCategory: sortedChartData, allExpenses: all };
  }, [trip]);

  const handleSaveBudget = () => {
      onUpdateBudget(parseInt(tempBudget.replace(/,/g, '')) || 0);
      setIsEditingBudget(false);
  };

  const handleAddExpense = () => {
      if (!newExp.title || !newExp.amount) return;
      const expense: ManualExpense = {
          id: crypto.randomUUID(),
          title: newExp.title,
          amount: typeof newExp.amount === 'string' ? parseFloat(newExp.amount) : newExp.amount,
          currency: newExp.currency as Currency,
          category: newExp.category as ExpenseCategory,
          isPaid: newExp.isPaid || false
      };
      onUpdateManualExpenses([...(trip.manualExpenses || []), expense]);
      setIsAddingExpense(false);
      setNewExp({ currency: 'KRW', category: 'OTHER', isPaid: true, title: '', amount: 0 });
  };

  const handleDelete = (id: string, source: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); 
      
      if (!id) return;

      if (source === 'MANUAL') {
          const currentExpenses = trip.manualExpenses || [];
          if(window.confirm("이 지출 내역을 삭제하시겠습니까?")) {
            onUpdateManualExpenses(currentExpenses.filter(e => e.id !== id));
          }
      } else if (source === 'BLOCK' && onRemoveBlockExpense) {
          // Block expenses have their own confirm in the handler
          onRemoveBlockExpense(id);
      }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. Overview Card */}
      <div className="bg-white rounded-3xl shadow-soft border border-white p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-bl-full -mr-12 -mt-12 pointer-events-none opacity-50 group-hover:scale-105 transition-transform duration-700"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                  <Wallet size={16} /> 총 예산
              </div>
              <button onClick={() => setIsEditingBudget(!isEditingBudget)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all">
                  <Edit2 size={16} />
              </button>
          </div>
          
          <div className="mb-8 relative z-10">
              {isEditingBudget ? (
                  <div className="flex gap-3 items-center">
                      <input 
                          className="text-4xl font-bold w-full border-b-2 border-blue-500 outline-none bg-transparent"
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          type="number"
                          autoFocus
                      />
                      <button onClick={handleSaveBudget} className="bg-blue-500 text-white p-2 rounded-xl shadow-lg hover:bg-blue-600 transition-colors"><Check size={20}/></button>
                  </div>
              ) : (
                  <div className="text-4xl font-bold text-slate-800">{trip.budget.toLocaleString()} <span className="text-lg text-slate-400 font-medium">원</span></div>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm font-medium">
                  <div className="bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700">
                      지출: <span className="font-bold">{totalSpent.toLocaleString()}</span>
                  </div>
                  <div className={`${remaining < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} px-3 py-1.5 rounded-lg transition-colors`}>
                      잔액: <span className="font-bold">{remaining.toLocaleString()}</span>
                  </div>
              </div>
          </div>

          {/* Progress Bar */}
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min((totalSpent / (trip.budget || 1)) * 100, 100)}%` }} 
              />
          </div>
      </div>

      {/* 2. Chart */}
      {totalSpent > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-soft border border-white flex flex-col items-center">
              <div className="flex items-center gap-2 self-start mb-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <TrendingUp size={16} /> 지출 분석
              </div>
              <div className="w-full flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="w-full sm:w-1/2 h-56 relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={expensesByCategory}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={85}
                                  paddingAngle={5}
                                  dataKey="value"
                                  cornerRadius={6}
                                  stroke="none"
                              >
                                  {expensesByCategory.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS_BY_CATEGORY[entry.name as ExpenseCategory]} />
                                  ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                formatter={(val: number) => val.toLocaleString() + ' KRW'}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                         <span className="text-3xl font-bold text-slate-700">{Math.round((totalSpent/trip.budget)*100)}%</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase">사용됨</span>
                      </div>
                  </div>
                  <div className="w-full sm:w-1/2 space-y-3 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                      {expensesByCategory.map(cat => (
                          <div key={cat.name} className="flex justify-between items-center text-xs group">
                              <div className="flex items-center gap-2.5">
                                  <div className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: COLORS_BY_CATEGORY[cat.name as ExpenseCategory] }}></div>
                                  <span className="text-slate-600 font-bold capitalize tracking-wide group-hover:text-slate-900 transition-colors">{cat.name.toLowerCase()}</span>
                              </div>
                              <span className="font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{Math.round((cat.value / totalSpent) * 100)}%</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* 3. Expense List */}
      <div className="bg-white rounded-3xl shadow-soft border border-white overflow-hidden min-h-[300px] flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">최근 지출 내역</h3>
              <button 
                  onClick={() => setIsAddingExpense(!isAddingExpense)}
                  className={`p-2 rounded-full shadow-lg transition-all duration-300 ${isAddingExpense ? 'bg-slate-100 text-slate-500 rotate-45' : 'bg-slate-800 text-white hover:scale-110'}`}
              >
                  <Plus size={20} />
              </button>
          </div>

          {isAddingExpense && (
              <div className="p-6 bg-slate-50/50 space-y-4 animate-in slide-in-from-top-4">
                  <input 
                      className="w-full p-3 rounded-xl border-none bg-white shadow-sm text-sm outline-none font-medium placeholder-slate-400"
                      placeholder="내용 (예: 로마행 비행기)"
                      value={newExp.title || ''}
                      onChange={(e) => setNewExp({...newExp, title: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-3">
                      <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
                          <input 
                              type="number"
                              className="flex-1 p-2 bg-transparent text-sm outline-none font-medium"
                              placeholder="금액"
                              value={newExp.amount || ''}
                              onChange={(e) => setNewExp({...newExp, amount: parseFloat(e.target.value)})}
                          />
                          <select 
                              className="bg-slate-50 rounded-lg text-xs font-bold text-slate-600 outline-none px-2"
                              value={newExp.currency}
                              onChange={(e) => setNewExp({...newExp, currency: e.target.value as Currency})}
                          >
                              <option value="KRW">KRW</option>
                              <option value="EUR">EUR</option>
                              <option value="USD">USD</option>
                          </select>
                      </div>
                      <select 
                          className="w-full p-3 rounded-xl border-none bg-white shadow-sm text-sm outline-none font-medium text-slate-600"
                          value={newExp.category}
                          onChange={(e) => setNewExp({...newExp, category: e.target.value as ExpenseCategory})}
                      >
                          {Object.keys(COLORS_BY_CATEGORY).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <button 
                      onClick={() => setNewExp({...newExp, isPaid: !newExp.isPaid})}
                      className={`w-full p-3 rounded-xl text-xs font-bold transition-all shadow-sm ${newExp.isPaid ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}
                  >
                      상태: {newExp.isPaid ? '결제완료' : '지출예정'}
                  </button>
                  
                  <button onClick={handleAddExpense} className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-700 hover:scale-[1.01] transition-all">지출 추가</button>
              </div>
          )}

          <div className="divide-y divide-slate-50 flex-1">
              {allExpenses.length === 0 && <div className="p-10 text-center text-slate-400 text-sm">기록된 지출이 없습니다.</div>}
              {allExpenses.map((exp, idx) => (
                  <div key={exp.id || idx} className="p-5 flex items-center justify-between hover:bg-slate-50 group relative transition-colors">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0`} style={{ backgroundColor: COLORS_BY_CATEGORY[exp.category as ExpenseCategory] || '#ccc' }}>
                              {ICONS_BY_CATEGORY[exp.category as ExpenseCategory] || <MoreHorizontal size={18} />}
                          </div>
                          <div className="min-w-0 flex-1 pr-2">
                              <div className="font-bold text-slate-800 text-base truncate" title={exp.title}>{exp.title}</div>
                              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 mt-0.5 tracking-wide">
                                  <span className={`px-2 py-0.5 rounded-md ${exp.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                      {exp.isPaid ? '완료' : '예정'}
                                  </span>
                                  {exp.source === 'BLOCK' && <span className="text-slate-300">• 일정</span>}
                              </div>
                          </div>
                      </div>
                      <div className="text-right shrink-0">
                          <div className="font-bold text-slate-700 text-base">{exp.kwn.toLocaleString()}</div>
                          {exp.currency !== 'KRW' && (
                              <div className="text-xs font-medium text-slate-400 mt-0.5">{exp.amount.toLocaleString()} {exp.currency}</div>
                          )}
                      </div>
                      
                      {/* Delete Button - Fixed: Z-Index 50 to stay above everything */}
                      <button 
                          type="button"
                          onClick={(e) => handleDelete(exp.id, exp.source, e)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-300 hover:text-rose-600 bg-white hover:bg-rose-50 shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 cursor-pointer"
                          title="삭제"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
};