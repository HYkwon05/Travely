import React, { useMemo, useState } from 'react';
import { Trip, BlockType, ManualExpense, ExpenseCategory, Currency } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, X, Edit2, Check, Trash2 } from 'lucide-react';

interface BudgetTrackerProps {
  trip: Trip;
  onUpdateManualExpenses: (expenses: ManualExpense[]) => void;
  onUpdateBudget: (budget: number) => void;
}

const COLORS_BY_CATEGORY: Record<ExpenseCategory, string> = {
    'FLIGHT': '#3b82f6', // Blue 500
    'ACCOMMODATION': '#0ea5e9', // Sky 500
    'FOOD': '#f59e0b', // Amber 500 (Contrast)
    'TRANSPORT': '#1e293b', // Slate 800
    'SHOPPING': '#8b5cf6', // Violet 500
    'TOUR': '#14b8a6', // Teal 500
    'OTHER': '#cbd5e1' // Slate 300
};

const RATES: Record<string, number> = {
    'EUR': 1450,
    'USD': 1350,
    'JPY': 9,
    'KRW': 1
};

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ trip, onUpdateManualExpenses, onUpdateBudget }) => {
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
              if (block.type === BlockType.LOCATION && block.children) {
                  block.children.forEach(child => {
                      if (child.type === BlockType.EXPENSE && child.meta?.amount) {
                          const currency = child.meta.currency || 'EUR';
                          const category = child.meta.category || 'OTHER';
                          const kwn = child.meta.amount * (RATES[currency] || 1);
                          total += kwn;
                          all.push({
                              id: child.id,
                              title: child.content || 'Misc',
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
          });
      });

      const chartData = Object.keys(catTotals).map(cat => ({
          name: cat,
          value: catTotals[cat]
      }));

      // Sort safely by creating a copy
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

  const deleteManualExpense = (id: string) => {
      if(confirm("Delete this expense?")) {
        onUpdateManualExpenses(trip.manualExpenses.filter(e => e.id !== id));
      }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. Overview Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e2e8f0] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#dbeafe] rounded-bl-full -mr-10 -mt-10 pointer-events-none opacity-50"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className="text-sm font-bold text-[#64748b] uppercase tracking-widest">Total Budget</h2>
              <button onClick={() => setIsEditingBudget(!isEditingBudget)} className="text-[#cbd5e1] hover:text-[#3b82f6]">
                  <Edit2 size={16} />
              </button>
          </div>
          
          <div className="mb-6 relative z-10">
              {isEditingBudget ? (
                  <div className="flex gap-2">
                      <input 
                          className="text-3xl font-bold w-full border-b border-[#3b82f6] outline-none font-hand"
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          type="number"
                      />
                      <button onClick={handleSaveBudget} className="bg-[#3b82f6] text-white px-3 rounded-lg"><Check /></button>
                  </div>
              ) : (
                  <div className="text-3xl font-bold font-hand text-[#1e293b]">{trip.budget.toLocaleString()} KRW</div>
              )}
              <div className="text-sm text-[#334155] mt-1 font-medium">
                  Spent: <span className="font-bold text-[#1e40af]">{totalSpent.toLocaleString()}</span> 
                  <span className="mx-2 text-[#cbd5e1]">|</span>
                  Remaining: <span className={`font-bold ${remaining < 0 ? 'text-red-500' : 'text-[#64748b]'}`}>{remaining.toLocaleString()}</span>
              </div>
          </div>

          {/* Progress Bar */}
          <div className="h-4 bg-[#f1f5f9] rounded-full overflow-hidden relative border border-[#e2e8f0]">
              <div 
                  className="h-full bg-[#3b82f6] transition-all duration-500" 
                  style={{ width: `${Math.min((totalSpent / (trip.budget || 1)) * 100, 100)}%` }} 
              />
          </div>
      </div>

      {/* 2. Chart */}
      {totalSpent > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e2e8f0] flex flex-col items-center">
              <h3 className="text-xs font-bold text-[#94a3b8] uppercase self-start mb-6">Spending Analysis</h3>
              <div className="w-full h-48 flex items-center gap-6">
                  <div className="h-full aspect-square relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={expensesByCategory}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={65}
                                  paddingAngle={4}
                                  dataKey="value"
                                  stroke="none"
                              >
                                  {expensesByCategory.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS_BY_CATEGORY[entry.name as ExpenseCategory]} />
                                  ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                formatter={(val: number) => val.toLocaleString() + ' KRW'}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                         <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Total</span>
                      </div>
                  </div>
                  <div className="flex-1 space-y-3">
                      {expensesByCategory.map(cat => (
                          <div key={cat.name} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_BY_CATEGORY[cat.name as ExpenseCategory] }}></div>
                                  <span className="text-[#1e293b] font-bold capitalize tracking-wide">{cat.name.toLowerCase()}</span>
                              </div>
                              <span className="font-bold text-[#334155]">{Math.round((cat.value / totalSpent) * 100)}%</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* 3. Expense List */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden">
          <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
              <h3 className="font-bold text-[#1e293b]">Expenses</h3>
              <button 
                  onClick={() => setIsAddingExpense(!isAddingExpense)}
                  className="bg-[#1e293b] text-white p-1.5 rounded-full shadow-lg hover:bg-[#334155] transition-transform active:scale-95"
              >
                  {isAddingExpense ? <X size={18} /> : <Plus size={18} />}
              </button>
          </div>

          {isAddingExpense && (
              <div className="p-4 bg-[#eff6ff] space-y-3 animate-in slide-in-from-top-2 border-b border-[#3b82f6]/20">
                  <input 
                      className="w-full p-2 rounded-lg border border-[#e2e8f0] text-sm outline-none font-hand"
                      placeholder="Title (e.g. Flight to Rome)"
                      value={newExp.title || ''}
                      onChange={(e) => setNewExp({...newExp, title: e.target.value})}
                  />
                  <div className="flex gap-2">
                      <input 
                          type="number"
                          className="flex-1 p-2 rounded-lg border border-[#e2e8f0] text-sm outline-none"
                          placeholder="Amount"
                          value={newExp.amount || ''}
                          onChange={(e) => setNewExp({...newExp, amount: parseFloat(e.target.value)})}
                      />
                      <select 
                          className="p-2 rounded-lg border border-[#e2e8f0] text-sm outline-none bg-white"
                          value={newExp.currency}
                          onChange={(e) => setNewExp({...newExp, currency: e.target.value as Currency})}
                      >
                          <option value="KRW">KRW</option>
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                      </select>
                  </div>
                  <div className="flex gap-2">
                      <select 
                          className="flex-1 p-2 rounded-lg border border-[#e2e8f0] text-sm outline-none bg-white"
                          value={newExp.category}
                          onChange={(e) => setNewExp({...newExp, category: e.target.value as ExpenseCategory})}
                      >
                          {Object.keys(COLORS_BY_CATEGORY).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button 
                          onClick={() => setNewExp({...newExp, isPaid: !newExp.isPaid})}
                          className={`flex-1 p-2 rounded-lg text-xs font-bold ${newExp.isPaid ? 'bg-[#3b82f6] text-white' : 'bg-[#e2e8f0] text-[#94a3b8]'}`}
                      >
                          {newExp.isPaid ? 'PAID' : 'PLANNED'}
                      </button>
                  </div>
                  <button onClick={handleAddExpense} className="w-full bg-[#1e293b] text-white py-2 rounded-lg font-bold text-sm shadow">Add Expense</button>
              </div>
          )}

          <div className="divide-y divide-[#f1f5f9]">
              {allExpenses.length === 0 && <div className="p-6 text-center text-[#94a3b8] text-sm font-hand text-lg">Empty pockets.</div>}
              {allExpenses.map((exp, idx) => (
                  <div key={exp.id || idx} className="p-4 flex items-center justify-between hover:bg-[#eff6ff] group relative transition-colors">
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm`} style={{ backgroundColor: COLORS_BY_CATEGORY[exp.category as ExpenseCategory] || '#ccc' }}>
                              {exp.category?.substring(0, 1)}
                          </div>
                          <div>
                              <div className="font-bold font-hand text-lg text-[#1e293b]">{exp.title}</div>
                              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-[#94a3b8] mt-0.5 tracking-wide">
                                  <span className={`px-1.5 py-0.5 rounded ${exp.isPaid ? 'bg-[#dbeafe] text-[#1e40af]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                                      {exp.isPaid ? 'Paid' : 'Planned'}
                                  </span>
                                  {exp.source === 'BLOCK' && <span className="text-[#cbd5e1]">• Schedule</span>}
                              </div>
                          </div>
                      </div>
                      <div className="text-right pr-8">
                          <div className="font-bold text-[#334155] text-sm">{exp.kwn.toLocaleString()}</div>
                          {exp.currency !== 'KRW' && (
                              <div className="text-xs text-[#94a3b8]">{exp.amount.toLocaleString()} {exp.currency}</div>
                          )}
                      </div>
                      
                      {exp.source === 'MANUAL' && (
                          <button 
                              onClick={() => deleteManualExpense(exp.id)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#cbd5e1] hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Expense"
                          >
                              <Trash2 size={16} />
                          </button>
                      )}
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
};