/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Minus, Download, Leaf, Trash2, Save, List, Calculator, RotateCcw, AlertCircle, Check } from 'lucide-react';

interface Counter {
  id: string;
  value: number;
  count: number;
  color: string;
}

interface Record {
  id: number;
  name: string;
  counts: { [key: number]: number };
  total: number;
  average: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('counter');
  const [inputName, setInputName] = useState('');
  const [newIndexValue, setNewIndexValue] = useState('');
  
  // Modal state management
  const [modal, setModal] = useState<{ show: boolean; type: string | null; targetId: string | null }>({ 
    show: false, 
    type: null, 
    targetId: null 
  });

  // Multiselect state for deletion
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  
  // History for undoing deletion
  const [undoHistory, setUndoHistory] = useState<Record[] | null>(null);

  // Default setup: 1, 3, 5, 7, 9
  const defaultIndices: Counter[] = [1, 3, 5, 7, 9].map((val, idx) => ({
    id: `default-${val}`,
    value: val,
    count: 0,
    color: `hsl(${(idx * 60) % 360}, 65%, 45%)`
  }));

  const [counters, setCounters] = useState<Counter[]>(defaultIndices);
  const [records, setRecords] = useState<Record[]>([]);

  // Real-time totals & averages
  const currentTotal = counters.reduce((acc, curr) => acc + curr.count, 0);
  const currentAverage = currentTotal === 0 
    ? "0.00" 
    : (counters.reduce((acc, curr) => acc + curr.value * curr.count, 0) / currentTotal).toFixed(2);

  // Add new index
  const addCounter = () => {
    const val = parseFloat(newIndexValue);
    if (isNaN(val) || counters.some(c => c.value === val)) {
      return;
    }
    
    setCounters([...counters, {
      id: Date.now().toString(),
      value: val,
      count: 0,
      color: `hsl(${(counters.length * 60) % 360}, 65%, 45%)`
    }].sort((a, b) => a.value - b.value));
    setNewIndexValue('');
  };

  const updateCount = (id: string, delta: number) => {
    if ('vibrate' in navigator) navigator.vibrate(20);
    setCounters(prev => prev.map(c =>
      c.id === id ? { ...c, count: Math.max(0, c.count + delta) } : c
    ));
  };

  const removeCounter = (id: string) => {
    setCounters(prev => prev.filter(c => c.id !== id));
  };

  // Save data record
  const saveRecord = () => {
    if (currentTotal === 0) {
      return;
    }
    
    const countsMap: { [key: number]: number } = {};
    counters.forEach(c => { countsMap[c.value] = c.count; });

    const newRecord: Record = {
      id: Date.now(),
      name: inputName || '미지정',
      counts: countsMap,
      total: currentTotal,
      average: currentAverage
    };

    setRecords([...records, newRecord]);
    setCounters(counters.map(c => ({ ...c, count: 0 })));
    setUndoHistory(null); // Reset undo history on new save
    if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
  };

  // Batch selection toggle
  const toggleSelection = (id: number) => {
    setSelectedRecordIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Modal controls
  const openModal = (type: string, targetId: string | null = null) => {
    setModal({ show: true, type, targetId });
  };

  const closeModal = () => {
    setModal({ show: false, type: null, targetId: null });
  };

  const handleConfirm = () => {
    if (modal.type === 'clearRecords') {
      setUndoHistory([...records]);
      setRecords([]);
      setSelectedRecordIds([]);
    } else if (modal.type === 'deleteSelected') {
      setUndoHistory([...records]);
      setRecords(records.filter(r => !selectedRecordIds.includes(r.id)));
      setSelectedRecordIds([]);
    } else if (modal.type === 'resetCounts') {
      setCounters(counters.map(c => ({ ...c, count: 0 })));
    }
    closeModal();
  };

  // Undo execution
  const handleUndo = () => {
    if (undoHistory) {
      setRecords(undoHistory);
      setUndoHistory(null);
      setSelectedRecordIds([]);
    }
  };

  // CSV Export
  const exportCSV = () => {
    if (records.length === 0) return;

    const allIndicesSet = new Set<number>();
    records.forEach(r => Object.keys(r.counts).forEach(k => allIndicesSet.add(parseFloat(k))));
    const sortedIndices = Array.from(allIndicesSet).sort((a, b) => a - b);

    let csv = "name,index," + sortedIndices.join(",") + ",total\n";

    records.forEach(r => {
      let row = `"${r.name}","${r.average}",`;
      sortedIndices.forEach(idx => {
        row += `${r.counts[idx] || 0},`;
      });
      row += `${r.total}\n`;
      csv += row;
    });

    const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([BOM, csv], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const firstName = records[0].name || '미지정';
    const lastName = records[records.length - 1].name || '미지정';
    const namePart = records.length > 1 ? `${firstName} ~ ${lastName}` : firstName;
    const fileName = `${dateStr}_index data_${namePart}.csv`;
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDynamicSizes = () => {
    const n = counters.length;
    if (n <= 2) return { count: '6vh', idx: '4.5vh', icon: 48 };
    if (n <= 4) return { count: '5vh', idx: '3.2vh', icon: 40 };
    if (n <= 6) return { count: '4vh', idx: '2.5vh', icon: 32 };
    if (n <= 8) return { count: '3vh', idx: '2.2vh', icon: 28 };
    return { count: '2.5vh', idx: '1.8vh', icon: 24 };
  };
  const sizes = getDynamicSizes();

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full bg-slate-50 overflow-hidden select-none font-sans">
      
      {/* 1. Header & Tabs */}
      <div className="bg-[#008C44] text-white flex-shrink-0 z-30 px-3 py-2 pt-[calc(8px+env(safe-area-inset-top))] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-1.5 shrink-0">
          <Leaf size={18} />
          <span className="font-black text-xs tracking-widest uppercase hidden sm:inline-block">Index data Logger (seed R&D)</span>
          <span className="font-black text-xs tracking-widest uppercase sm:hidden">Index Logger</span>
        </div>
        <div className="flex gap-1 bg-black/10 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('counter')}
            className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md flex items-center gap-1 transition-colors ${activeTab === 'counter' ? 'bg-white text-[#008C44] shadow-sm' : 'text-white/80 hover:text-white'}`}
          >
            <Calculator size={14} /> Multi Counter
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md flex items-center gap-1 transition-colors ${activeTab === 'records' ? 'bg-white text-[#008C44] shadow-sm' : 'text-white/80 hover:text-white'}`}
          >
            <List size={14} /> Data Logger ({records.length})
          </button>
        </div>
      </div>

      {activeTab === 'counter' ? (
        // ================= Counter Tab =================
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Inputs & Stats Row */}
          <div className="bg-white px-2 py-2 shadow-sm z-20 flex-shrink-0 flex items-center w-full overflow-x-auto hide-scrollbar">
            
            {/* Left: Name Input */}
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="text" 
                value={inputName} 
                onChange={e => setInputName(e.target.value)}
                placeholder="Name"
                className="w-16 sm:w-24 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-[#008C44] shrink-0"
              />
              <button
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }}
                className="h-7 w-7 sm:w-10 bg-[#008C44] text-white rounded-md font-black text-xs active:scale-95 transition-transform flex items-center justify-center shrink-0"
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex-1 min-w-[4px]"></div>
            
            {/* Center: Add Index */}
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number" 
                value={newIndexValue} 
                onChange={e => setNewIndexValue(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addCounter()}
                placeholder="Index add"
                className="w-16 sm:w-24 bg-green-50 border border-green-200 text-green-900 rounded-md px-1 sm:px-2 py-1.5 text-[10px] sm:text-xs font-bold focus:outline-none focus:border-[#008C44] text-center"
              />
              <button
                onClick={addCounter}
                className="h-7 w-7 sm:w-10 bg-[#008C44] text-white rounded-md font-black text-xs active:scale-95 transition-transform flex items-center justify-center shrink-0"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex-1 min-w-[4px]"></div>

            {/* Right: Summary Stats */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 pr-1">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-400 leading-none mb-0.5 uppercase">Total</span>
                <span className="text-sm font-black text-slate-700 leading-none tabular-nums">{currentTotal}</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-[#008C44] leading-none mb-0.5 uppercase">Avg(Idx)</span>
                <span className="text-sm font-black text-[#008C44] leading-none tabular-nums">{currentAverage}</span>
              </div>
            </div>
          </div>

          {/* Main Counter List */}
          <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden bg-slate-100">
            {counters.map((c) => (
              <div 
                key={c.id} 
                className="flex-1 flex items-stretch bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-0 relative transition-all duration-200 active:ring-2 active:ring-[#008C44]/20"
              >
                <button 
                  onClick={() => updateCount(c.id, -1)} 
                  className="w-[22%] sm:w-[25%] bg-slate-400 text-white active:bg-slate-500 flex items-center justify-center shadow-[inset_-6px_0_15px_rgba(0,0,0,0.1)] transition-colors shrink-0"
                >
                  <Minus size={sizes.icon} strokeWidth={4} />
                </button>
                
                <div className="flex-1 flex flex-row items-center justify-center min-h-0 overflow-hidden relative p-1 sm:p-2 gap-1 sm:gap-3">
                  <span 
                    className="font-black text-[#008C44] tracking-tighter whitespace-nowrap text-xs sm:text-base" 
                    style={{ fontSize: `clamp(10px, ${sizes.idx}, 24px)`, lineHeight: 1 }}
                  >
                    Index {c.value} <span className="text-slate-300 ml-0.5">:</span>
                  </span>
                  <span 
                    className="font-black text-slate-900 tabular-nums tracking-tighter truncate" 
                    style={{ fontSize: `clamp(24px, ${sizes.count}, 64px)`, lineHeight: 1 }}
                  >
                    {c.count}
                  </span>
                </div>
                
                <button 
                  onClick={() => removeCounter(c.id)} 
                  className="w-10 sm:w-16 bg-white text-slate-300 active:text-red-500 active:bg-slate-100 flex items-center justify-center border-r border-slate-100 transition-colors shrink-0"
                >
                  <Trash2 size={Math.max(16, sizes.icon / 2)} strokeWidth={2}/>
                </button>

                <button 
                  onClick={() => updateCount(c.id, 1)} 
                  style={{ backgroundColor: c.color }} 
                  className="w-[28%] sm:w-[30%] text-white active:brightness-90 flex items-center justify-center shadow-[inset_6px_0_15px_rgba(0,0,0,0.15)] shrink-0"
                >
                  <Plus size={sizes.icon} strokeWidth={4} />
                </button>
              </div>
            ))}
          </main>

          {/* Footer Actions */}
          <footer className="bg-white p-3 border-t border-slate-200 flex gap-2 pb-[calc(12px+env(safe-area-inset-bottom))] flex-shrink-0">
            <button 
              onClick={() => openModal('resetCounts')} 
              className="w-[35%] h-14 bg-orange-50 text-orange-600 rounded-2xl font-black flex items-center justify-center gap-1 active:bg-orange-100 transition-colors shadow-sm text-xs sm:text-sm"
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button 
              onClick={saveRecord} 
              className="w-[65%] h-14 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 active:bg-blue-700 shadow-md transition-colors text-sm sm:text-base"
            >
              <Save size={20} /> Record Data
            </button>
          </footer>
        </div>
      ) : (
        // ================= Records Log Tab =================
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 p-2 sm:p-3 overflow-hidden">
            
            {/* Undo Notification */}
            {undoHistory && (
               <div className="bg-slate-800 text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg mb-3 shrink-0 animate-slide-in-top">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={18} className="text-orange-400" />
                    <span className="text-xs sm:text-sm font-bold">Records deleted.</span>
                  </div>
                  <button 
                    onClick={handleUndo} 
                    className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-black active:scale-95 transition-transform shadow-sm"
                  >
                    Undo
                  </button>
               </div>
            )}

            {records.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <List size={48} className="opacity-20 mb-3" />
                <p className="font-bold">No records found.</p>
                <p className="text-xs mt-1">Tap [Record Data] in the counter tab to save measurements.</p>
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-[11px] sm:text-sm text-center tabular-nums relative">
                    <thead className="bg-slate-100 text-slate-600 font-black text-[10px] sm:text-xs uppercase border-b border-slate-200 tracking-tighter sticky top-0 z-20 shadow-sm">
                      <tr>
                        <th className="px-2 sm:px-3 py-3 sm:py-4 text-left sticky left-0 bg-slate-100 z-30 border-r border-slate-200 w-12 sm:w-auto shadow-[1px_0_0_#e2e8f0]">Name</th>
                        <th className="px-1 sm:px-2 py-3 sm:py-4 text-blue-600 border-r border-slate-200">Index</th>
                        {Array.from(new Set(records.flatMap(r => Object.keys(r.counts)))).sort((a,b)=>Number(a)-Number(b)).map(idx => (
                          <th key={idx} className="px-1 sm:px-2 py-3 sm:py-4 text-[#008C44] border-r border-slate-200">{idx}</th>
                        ))}
                        <th className="px-1 sm:px-2 py-3 sm:py-4 text-slate-800 border-r border-slate-200 w-8 sm:w-auto">Total</th>
                        <th className="px-2 py-2 whitespace-nowrap bg-slate-100 w-auto">
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                            <input
                              type="checkbox"
                              checked={records.length > 0 && selectedRecordIds.length === records.length}
                              onChange={(e) => e.target.checked ? setSelectedRecordIds(records.map(r => r.id)) : setSelectedRecordIds([])}
                              className="w-4 h-4 sm:w-5 sm:h-5 accent-red-500 cursor-pointer rounded"
                            />
                            <button
                              onClick={() => selectedRecordIds.length > 0 && openModal('deleteSelected')}
                              disabled={selectedRecordIds.length === 0}
                              className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md text-[10px] sm:text-[11px] font-black transition-colors ${selectedRecordIds.length > 0 ? 'bg-red-100 text-red-600 active:bg-red-200 border border-red-200 shadow-sm' : 'text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed'}`}
                            >
                              <Trash2 size={14} strokeWidth={2.5} className="sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Delete Selected</span>
                              <span className="sm:hidden leading-none">Del</span>
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td
                            className={`px-2 sm:px-3 py-2 sm:py-2.5 text-left sticky left-0 bg-white z-10 border-r border-slate-200 font-bold whitespace-normal break-words leading-tight ${r.name.length > 10 ? 'text-[8px] sm:text-xs' : r.name.length > 5 ? 'text-[9px] sm:text-sm' : 'text-[11px] sm:text-sm'} shadow-[1px_0_0_#e2e8f0]`}
                            style={{ minWidth: '40px' }}
                          >
                            {r.name}
                          </td>
                          <td className="px-1 sm:px-2 py-2 sm:py-2.5 text-blue-600 font-black border-r border-slate-200 whitespace-nowrap">{r.average}</td>
                          {Array.from(new Set(records.flatMap(rec => Object.keys(rec.counts)))).sort((a,b)=>Number(a)-Number(b)).map(idx => (
                            <td key={idx} className="px-1 sm:px-2 py-2 sm:py-2.5 border-r border-slate-200 font-bold text-slate-900">{r.counts[Number(idx)] || 0}</td>
                          ))}
                          <td className="px-1 sm:px-2 py-2 sm:py-2.5 text-slate-900 font-black bg-slate-50/50 border-r border-slate-200">{r.total}</td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedRecordIds.includes(r.id)}
                              onChange={() => toggleSelection(r.id)}
                              className="w-4 h-4 sm:w-5 sm:h-5 accent-red-500 cursor-pointer inline-block align-middle"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          <footer className="bg-white p-3 border-t border-slate-200 flex gap-2 pb-[calc(12px+env(safe-area-inset-bottom))] flex-shrink-0">
            <button 
              onClick={() => openModal('clearRecords')} 
              className="flex-1 h-14 bg-slate-100 text-slate-500 rounded-2xl font-bold active:bg-slate-200 transition-colors"
            >
              Clear Log
            </button>
            <button 
              onClick={exportCSV} 
              className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform text-base"
            >
              <Download size={20} /> Export All to CSV
            </button>
          </footer>
        </div>
      )}

      {/* Confirmation Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[300px] overflow-hidden shadow-2xl animate-zoom-in">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {modal.type === 'clearRecords' && 'Clear All Records'}
                {modal.type === 'deleteSelected' && 'Delete Selected'}
                {modal.type === 'resetCounts' && 'Reset Counter'}
              </h3>
              <p className="text-sm font-medium text-gray-400 leading-relaxed whitespace-pre-wrap">
                {modal.type === 'clearRecords' && 'Are you sure you want to delete all stored data?\nThis action cannot be undone.'}
                {modal.type === 'deleteSelected' && `Delete ${selectedRecordIds.length} selected record(s)?`}
                {modal.type === 'resetCounts' && 'Keep index settings but reset\nall current counts to zero?'}
              </p>
            </div>
            <div className="flex border-t border-gray-50 h-16 font-black text-base">
              <button 
                onClick={closeModal} 
                className="flex-1 text-gray-300 border-r border-gray-50 active:bg-gray-50 transition-colors uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm} 
                className="flex-1 text-orange-500 active:bg-orange-50 transition-colors uppercase"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
