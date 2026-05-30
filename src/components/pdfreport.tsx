/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EstimateItem } from '../types';
import { formatIndianCurrency, formatInLakhsOrCrores } from '../utils';
import { ShieldCheck, Printer, FileDown, Calendar, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PDFReportProps {
  item: EstimateItem;
}

export function PDFReport({ item }: PDFReportProps) {
  const handlePrint = () => {
    // Elegant way to print only the structural report container
    window.print();
  };

  const dateStr = new Date(item.timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const { input, cost, aiMarkdown } = item;

  return (
    <div id="pdf-report-generator" className="space-y-6">
      {/* Utility Panel */}
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#fafafa]">Printable Chartered Engineer Report Ready</h4>
            <p className="text-xs text-[#a1a1aa]">Fully structured to output a clean PDF bill-of-quantities in portrait.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-550 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* The Printable Container card */}
      <div 
        id="printable-report-card" 
        className="bg-white border border-stone-300 rounded-2xl p-8 sm:p-12 shadow-sm font-sans mx-auto text-stone-900 border-t-8 border-t-stone-800 print:border-none print:p-0 print:shadow-none"
        style={{ maxWidth: '800px' }}
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between pb-6 border-b border-stone-200 gap-4 mb-6">
          <div>
            <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold uppercase">CIVIL ESTIMATION REPORT</span>
            <h1 className="text-2xl font-bold font-sans text-stone-900 mt-1">STRUCTURE QUANTITY SURVEY</h1>
            <p className="text-xs text-stone-500 font-mono mt-0.5">Reference ID: EST-{item.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-left sm:text-right font-mono text-xs text-stone-500 space-y-1">
            <p className="flex items-center sm:justify-end gap-1"><Calendar className="w-3.5 h-3.5" /> {dateStr}</p>
            <p>Chartered Reference Metrology</p>
            <p className="text-emerald-700 font-semibold flex items-center sm:justify-end gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Standard CPWD Rates Applied
            </p>
          </div>
        </div>

        {/* Project Specification Grid */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-stone-400 font-mono tracking-wider uppercase mb-3">Project Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono">Building Type</span>
              <p className="text-sm font-semibold text-stone-800">{input.buildingType}</p>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono">Floor Area</span>
              <p className="text-sm font-semibold text-stone-800">
                {input.area} sq.ft <span className="text-[10px] text-stone-500 font-normal">({input.areaType === 'Per Floor Area' ? 'per floor' : 'built-up'})</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono">Total Levels</span>
              <p className="text-sm font-semibold text-stone-800">{input.floors} Floor{input.floors > 1 ? 's' : ''}</p>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-mono">Quality Standard</span>
              <p className="text-sm font-semibold text-stone-800">{input.quality}</p>
            </div>
            <div className="pt-2 border-t border-stone-200 col-span-2">
              <span className="text-[10px] text-stone-400 uppercase font-mono">Site Location & Tier</span>
              <p className="text-sm font-semibold text-stone-800">{input.city} ({input.tier} Tier)</p>
            </div>
            <div className="pt-2 border-t border-stone-200 col-span-2">
              <span className="text-[10px] text-stone-400 uppercase font-mono">Soil and Seismicity</span>
              <p className="text-sm font-semibold text-stone-800">{input.soilCondition || 'Standard stable soil'} / {input.seismicZone || 'Zone II/III'}</p>
            </div>
          </div>
        </div>

        {/* Financial Overview Card */}
        <div className="mb-8 p-6 bg-stone-900 text-white rounded-2xl shadow-sm text-center relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs uppercase font-mono tracking-widest text-stone-300">ESTIMATED VALUATION BASE</span>
            <div className="text-3xl sm:text-4xl font-bold font-sans mt-1 text-stone-100">
              {formatIndianCurrency(cost.totalCost)}
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Cost Per Sq.Ft: <span className="font-mono text-white font-semibold">₹{cost.costPerSqFt.toLocaleString('en-IN')}</span> • Recommended Range: <span className="font-mono text-white font-semibold">{formatInLakhsOrCrores(cost.budgetRangeMin)} - {formatInLakhsOrCrores(cost.budgetRangeMax)}</span>
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
            <FileText className="w-48 h-48" />
          </div>
        </div>

        {/* Breakdown Cost Columns */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-stone-400 font-mono tracking-wider uppercase mb-3">Core Cost Breakdown</h3>
          <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-200 shadow-xs">
            <div className="grid grid-cols-12 bg-stone-50 p-3 text-[10px] font-mono uppercase text-stone-500 font-semibold">
              <div className="col-span-6">Component Classification</div>
              <div className="col-span-2 text-center">Share Ratio</div>
              <div className="col-span-4 text-right">Estimated Sum</div>
            </div>
            <div className="grid grid-cols-12 p-4 text-xs">
              <div className="col-span-6">
                <span className="font-semibold text-stone-800">Civil & Finish Materials</span>
                <p className="text-[10px] text-stone-400">Cement bags, structural steel, brick blocks, masonry aggregates & standard fittings.</p>
              </div>
              <div className="col-span-2 text-center font-mono self-center font-semibold text-stone-600">55.0%</div>
              <div className="col-span-4 text-right self-center font-mono font-bold text-stone-800">{formatIndianCurrency(cost.materialCost)}</div>
            </div>
            <div className="grid grid-cols-12 p-4 text-xs">
              <div className="col-span-6">
                <span className="font-semibold text-stone-800">Contractor Labor & Site Execution</span>
                <p className="text-[10px] text-stone-400">Masons, civil labor, MEP tradesmen (plumbing/elec), tile specialists.</p>
              </div>
              <div className="col-span-2 text-center font-mono self-center font-semibold text-stone-600">35.0%</div>
              <div className="col-span-4 text-right self-center font-mono font-bold text-stone-800">{formatIndianCurrency(cost.laborCost)}</div>
            </div>
            <div className="grid grid-cols-12 p-4 text-xs">
              <div className="col-span-6">
                <span className="font-semibold text-stone-800">Contingencies, Permits & Architect Fee</span>
                <p className="text-[10px] text-stone-400">Structural design plans, local municipal sanctions and safety margins.</p>
              </div>
              <div className="col-span-2 text-center font-mono self-center font-semibold text-stone-600">10.0%</div>
              <div className="col-span-4 text-right self-center font-mono font-bold text-stone-800">{formatIndianCurrency(cost.contingencyCost)}</div>
            </div>
            <div className="grid grid-cols-12 p-4 text-sm font-semibold bg-stone-50">
              <div className="col-span-8">Estimated Ultimate Budget</div>
              <div className="col-span-4 text-right font-mono font-bold text-stone-900">{formatIndianCurrency(cost.totalCost)}</div>
            </div>
          </div>
        </div>

        {/* Materials Survey List */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-stone-400 font-mono tracking-wider uppercase mb-3">Civil Materials & Labor Allocations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-stone-200 p-4 rounded-xl">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wide border-b border-stone-100 pb-1 mb-2">Materials Apportionment</h4>
              <ul className="space-y-2 font-mono text-[11px] text-stone-600">
                <li className="flex justify-between"><span>Cement Bags Component:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.materialsBreakdown.cement)}</span></li>
                <li className="flex justify-between"><span>Reinforcement Steel:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.materialsBreakdown.steel)}</span></li>
                <li className="flex justify-between"><span>Sands & Aggregates:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.materialsBreakdown.sandAndAggregate)}</span></li>
                <li className="flex justify-between"><span>Solid Bricks / Blocks:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.materialsBreakdown.bricksAndBlocks)}</span></li>
                <li className="flex justify-between"><span>Fittings & Finishes:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.materialsBreakdown.finishingAndFittings)}</span></li>
              </ul>
            </div>
            <div className="border border-stone-200 p-4 rounded-xl">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wide border-b border-stone-100 pb-1 mb-2">Labor Apportionment</h4>
              <ul className="space-y-2 font-mono text-[11px] text-stone-600">
                <li className="flex justify-between"><span>Civil Concrete Crews:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.laborBreakdown.civilWork)}</span></li>
                <li className="flex justify-between"><span>Superstructure Masonry:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.laborBreakdown.masonry)}</span></li>
                <li className="flex justify-between"><span>MEP Trades Services:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.laborBreakdown.plumbingAndElectrical)}</span></li>
                <li className="flex justify-between"><span>Painting & Finishes:</span> <span className="font-bold text-stone-800">{formatIndianCurrency(cost.laborBreakdown.paintingAndFinishing)}</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* The Gemini Detailed AI feedback directly rendered for report inclusion */}
        {aiMarkdown && (
          <div className="mb-8 border-t border-stone-200 pt-6">
            <h3 className="text-xs font-bold text-stone-400 font-mono tracking-wider uppercase mb-3">AI Chartered Engineer Insights</h3>
            <div className="markdown-body text-xs text-stone-600 leading-relaxed font-sans prose max-w-none space-y-2 select-all">
              <ReactMarkdown>{aiMarkdown}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Engineering Stamp, Signature and Disclaimers */}
        <div className="border-t border-stone-200 pt-8 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="text-[10px] text-stone-400 max-w-sm space-y-1">
            <p className="font-bold">STANDARD SURVEY DISCLAIMER</p>
            <p>This document is generated based on standard civil engineering formulations and regional cost indices. Actual costs may fluctuate depending on site accessibility, ground structural status, raw contractor negotiations, material pricing surges, and municipal permission parameters.</p>
          </div>
          <div className="flex justify-end gap-12 text-center text-xs font-mono">
            <div className="space-y-6">
              <div className="w-24 h-5 border-b border-stone-300"></div>
              <p className="text-[9px] text-stone-500 uppercase">Chartered Engineer Stamp</p>
            </div>
            <div className="space-y-6">
              <div className="w-24 h-5 border-b border-stone-300"></div>
              <p className="text-[9px] text-stone-500 uppercase">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
