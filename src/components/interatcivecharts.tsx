/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DetailedCost, EstimateInput } from '../types';
import { formatIndianCurrency, formatInLakhsOrCrores } from '../utils';

interface InteractiveChartsProps {
  cost: DetailedCost;
  input: EstimateInput;
}

export function InteractiveCharts({ cost, input }: InteractiveChartsProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Total Floors cost simulation for Floor Multipliers
  const floorData = Array.from({ length: input.floors }).map((_, idx) => {
    const floorNum = idx + 1;
    const floorFactor = 1 + 0.08 * (floorNum - 1);
    const floorArea = (input.areaType === 'Total Area' ? input.area / input.floors : input.area);
    const floorBaseCost = floorArea * (cost.costPerSqFt / (1 + 0.04 * (input.floors - 1)));
    const floorCost = floorBaseCost * floorFactor;

    return {
      floorName: floorNum === 1 ? 'Ground Floor' : `Floor ${floorNum}`,
      multiplier: floorFactor.toFixed(2),
      cost: Math.round(floorCost),
      area: Math.round(floorArea),
    };
  });

  // Material split details
  const materials = [
    { name: 'Cement Bags Share', key: 'cement', amount: cost.materialsBreakdown.cement, percent: 16, color: 'bg-emerald-500', svgColor: '#10b981' },
    { name: 'Reinforcement Steel', key: 'steel', amount: cost.materialsBreakdown.steel, percent: 15, color: 'bg-amber-600', svgColor: '#d97706' },
    { name: 'Finishing & Fittings', key: 'finishing', amount: cost.materialsBreakdown.finishingAndFittings, percent: 30, color: 'bg-blue-500', svgColor: '#3b82f6' },
    { name: 'Brick/Concrete Blocks', key: 'bricks', amount: cost.materialsBreakdown.bricksAndBlocks, percent: 12, color: 'bg-rose-500', svgColor: '#f43f5e' },
    { name: 'Sand & Aggregate', key: 'sand', amount: cost.materialsBreakdown.sandAndAggregate, percent: 12, color: 'bg-yellow-500', svgColor: '#eab308' },
    { name: 'MEP & Carpentry Items', key: 'other', amount: cost.materialsBreakdown.otherMaterials, percent: 15, color: 'bg-indigo-500', svgColor: '#6366f1' },
  ];

  // Primary cost sections
  const costSections = [
    { label: 'Materials Budget', value: cost.materialCost, percent: 55, color: 'text-[#fafafa] border-emerald-500 bg-emerald-950/10', accent: '#10b981', desc: 'Slabs, blockwork, finishing materials' },
    { label: 'Labor & Contracting', value: cost.laborCost, percent: 35, color: 'text-[#fafafa] border-amber-500 bg-amber-950/10', accent: '#f59e0b', desc: 'Chartered civil crew, masons, fabricators' },
    { label: 'Contingency & approvals', value: cost.contingencyCost, percent: 10, color: 'text-[#fafafa] border-sky-500 bg-sky-950/10', accent: '#0ea5e9', desc: 'Overheads, municipal registrations, safety buffer' },
  ];

  return (
    <div id="interactive-charts-dashboard" className="space-y-8">
      {/* 1. Core Allocation Doughnut Chart & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Custom Interactive Doughnut Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#121215] p-6 rounded-2xl border border-[#27272a] shadow-sm">
          <h4 className="text-sm font-semibold text-[#fafafa] mb-6 uppercase tracking-wider">Overall Cost Partition</h4>
          <div className="relative w-56 h-56">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Segment 1: Material (55%): offset 0, length 55 */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#1f1f23"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray="238.76"
                strokeDashoffset={238.76 * (1 - 0.55)}
                className="transition-all duration-300 cursor-pointer hover:stroke-[14]"
                onMouseEnter={() => setHoveredSegment('materials')}
                onMouseLeave={() => setHoveredSegment(null)}
              />
              {/* Segment 2: Labor (35%): offset 55%, length 35% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray="238.76"
                strokeDashoffset={238.76 * (1 - 0.35)}
                transform="rotate(198, 50, 50)" // 198 deg = 55% of 360
                className="transition-all duration-300 cursor-pointer hover:stroke-[14]"
                onMouseEnter={() => setHoveredSegment('labor')}
                onMouseLeave={() => setHoveredSegment(null)}
              />
              {/* Segment 3: Contingency (10%): offset 90%, length 10% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="12"
                strokeDasharray="238.76"
                strokeDashoffset={238.76 * (1 - 0.10)}
                transform="rotate(324, 50, 50)" // 324 deg = 90% of 360
                className="transition-all duration-300 cursor-pointer hover:stroke-[14]"
                onMouseEnter={() => setHoveredSegment('contingency')}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] text-[#71717a] font-mono uppercase">EST. BUDGET</span>
              <span className="text-xl font-bold font-sans text-white">
                {hoveredSegment === 'materials' && '55.0%'}
                {hoveredSegment === 'labor' && '35.0%'}
                {hoveredSegment === 'contingency' && '10.0%'}
                {!hoveredSegment && '100%'}
              </span>
              <span className="text-[10px] text-blue-400 font-mono">
                {hoveredSegment === 'materials' && 'Materials'}
                {hoveredSegment === 'labor' && 'Labor & Contracts'}
                {hoveredSegment === 'contingency' && 'Risk Contingency'}
                {!hoveredSegment && 'Total Balance'}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#71717a] text-center mt-4 italic">Hover over slices to isolate details.</p>
        </div>

        {/* Breakdown Progress Bars & Cards */}
        <div className="lg:col-span-7 space-y-4">
          {costSections.map((sec, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-xl border-l-4 border shadow-sm transition-all duration-200 ${sec.color} ${
                hoveredSegment && 
                ((hoveredSegment === 'materials' && sec.label.includes('Materials')) ||
                (hoveredSegment === 'labor' && sec.label.includes('Labor')) ||
                (hoveredSegment === 'contingency' && sec.label.includes('Contingency')))
                  ? 'ring-2 ring-blue-550 scale-[1.01]' 
                  : 'border-[#27272a]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-[#fafafa] font-sans">{sec.label}</span>
                <span className="text-blue-400 font-mono font-bold">{formatInLakhsOrCrores(sec.value)} <span className="text-xs text-[#a1a1aa]">({sec.percent}%)</span></span>
              </div>
              <div className="w-full bg-[#1c1c21] h-2 rounded-full overflow-hidden border border-[#27272a]">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ 
                    backgroundColor: sec.accent,
                    width: `${sec.percent}%` 
                  }}
                />
              </div>
              <p className="text-xs text-[#a1a1aa] mt-1.5">{sec.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Custom Progressive Floor-wise Estimation Ladder */}
      <div className="bg-[#121215] p-6 rounded-2xl border border-[#27272a] shadow-sm space-y-5 text-[#fafafa]">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
          <div>
            <h4 className="text-base font-semibold text-white">Floor-wise Progressive Cost Ladder</h4>
            <p className="text-xs text-[#a1a1aa]">Visualization of 8% incremental floor transport, staging, & frame construction multiplier.</p>
          </div>
          <div className="bg-[#1c1c21] px-3 py-1 rounded text-xs font-mono text-[#a1a1aa] border border-[#27272a] shrink-0">
            Multiplier: +8% per floor level
          </div>
        </div>

        <div className="space-y-4">
          {floorData.reverse().map((floor, idx) => {
            const actualIndex = floorData.length - idx; // Re-reverse index for labels
            return (
              <div key={idx} className="bg-[#1c1c21]/60 p-4 rounded-xl border border-[#27272a] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-mono shadow-sm">
                    {actualIndex}
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm">{floor.floorName}</h5>
                    <p className="text-xs text-[#a1a1aa]">{floor.area} sq.ft built-up • multiplier: {floor.multiplier}x</p>
                  </div>
                </div>
                
                {/* Horizontal Progress bar inside floor logic */}
                <div className="flex-1 max-w-md hidden md:block">
                  <div className="w-full bg-[#121215] h-2.5 rounded-full overflow-hidden border border-[#27272a]">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (floor.cost / cost.totalCost) * 100 * input.floors)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-[#fafafa] font-mono">
                    {formatInLakhsOrCrores(floor.cost)}
                  </p>
                  <p className="text-[10px] text-[#71717a] font-mono uppercase">ESTIMATED COMPONENT</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Material Category Shares */}
      <div className="bg-[#121215] p-6 rounded-2xl border border-[#27272a] shadow-sm text-[#fafafa]">
        <h4 className="text-base font-semibold text-[#fafafa] mb-4">Material Resources Allocation Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat, i) => (
            <div key={i} className="border border-[#27272a] rounded-xl p-4 bg-[#1c1c21]/45 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${mat.color}`} />
                <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">{mat.name}</span>
              </div>
              <p className="text-lg font-bold font-mono text-white">
                {formatIndianCurrency(mat.amount)}
              </p>
              <div className="flex justify-between items-center mt-2 text-xs text-[#71717a]">
                <span>Allocated Share</span>
                <span className="font-mono font-medium text-white">{mat.percent}% of materials</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
