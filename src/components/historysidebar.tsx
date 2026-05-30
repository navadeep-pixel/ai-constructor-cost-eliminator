/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EstimateItem } from '../types';
import { formatInLakhsOrCrores } from '../utils';
import { Trash2, History, Building, MapPin, Layers, Calendar } from 'lucide-react';

interface HistorySidebarProps {
  history: EstimateItem[];
  onSelect: (item: EstimateItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  activeId?: string;
}

export function HistorySidebar({ history, onSelect, onDelete, onClearAll, activeId }: HistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.input.city.toLowerCase().includes(term) ||
      item.input.buildingType.toLowerCase().includes(term) ||
      item.input.quality.toLowerCase().includes(term)
    );
  });

  return (
    <div id="estimate-history-sidebar" className="bg-[#121215] rounded-2xl border border-[#27272a] shadow-sm p-4 h-full flex flex-col text-[#fafafa]">
      <div className="flex justify-between items-center pb-4 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-[#fafafa] font-sans">Previous Estimates ({history.length})</h3>
        </div>
        {history.length > 0 && (
          <button 
            type="button"
            onClick={() => {
              if (window.confirm('Delete all history templates permanently? This is irreversible.')) {
                onClearAll();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-mono font-medium flex items-center gap-1 cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length > 0 && (
        <input 
          type="text"
          placeholder="Filter city model, type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="my-3 w-full bg-[#1c1c21] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#fafafa] focus:border-blue-500 focus:outline-none font-mono"
        />
      )}

      {filteredHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-[#71717a] text-center text-sm">
          <p className="italic">No previous templates found.</p>
          <p className="text-xs mt-1 text-[#52525b]">Estimates will automatically be stored here.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[35rem]" style={{ scrollbarWidth: 'thin' }}>
          {filteredHistory.map((item) => {
            const isActive = item.id === activeId;
            const dateStr = new Date(item.timestamp).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric'
            });

            return (
              <div 
                key={item.id}
                className={`group border rounded-xl p-3 text-left transition-all relative overflow-hidden cursor-pointer ${
                  isActive 
                    ? 'border-blue-500 bg-[#1c1c21] shadow-sm' 
                    : 'border-[#27272a] bg-[#121215] hover:border-[#38383d]'
                }`}
                onClick={() => onSelect(item)}
              >
                <div className="flex justify-between items-start pr-6">
                  <span className="text-xs font-semibold text-[#fafafa] font-sans truncate pr-2">
                    {item.input.city}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-400 leading-none shrink-0">
                    {formatInLakhsOrCrores(item.cost.totalCost)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] text-[#a1a1aa] font-mono">
                  <div className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-[#71717a] shrink-0" />
                    <span className="truncate">{item.input.buildingType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#71717a] shrink-0" />
                    <span>{item.input.floors} Floor{item.input.floors > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#71717a] shrink-0" />
                    <span>{item.input.tier}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#71717a] shrink-0" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                {/* Left vertical border for items */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  item.input.quality === 'Basic' ? 'bg-[#52525b]' :
                  item.input.quality === 'Standard' ? 'bg-[#3f3f46]' :
                  item.input.quality === 'Premium' ? 'bg-blue-600' :
                  'bg-blue-400'
                }`} />

                {/* Absolute small delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="absolute right-2 bottom-2 md:opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#71717a] hover:text-rose-400 hover:bg-[#27272a] rounded cursor-pointer"
                  title="Remove template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
