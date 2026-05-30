/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BuildingType, 
  MaterialQuality, 
  LocationTier, 
  AreaUnitType, 
  EstimateInput, 
  EstimateItem 
} from './types';
import { 
  calculateConstructionCost, 
  QUALITY_RANGES, 
  TIER_MULTIPLIERS, 
  PREDEFINED_CITIES,
  formatIndianCurrency, 
  formatInLakhsOrCrores 
} from './utils';
import { InteractiveCharts } from './components/InteractiveCharts';
import { HistorySidebar } from './components/HistorySidebar';
import { PDFReport } from './components/PDFReport';
import ReactMarkdown from 'react-markdown';
import { 
  Building, 
  Layers, 
  Coins, 
  Hammer, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Calculator, 
  HelpCircle, 
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  Activity,
  Printer,
  History,
  Info 
} from 'lucide-react';

export default function App() {
  // 1. Core State
  const [area, setArea] = useState<number | ''>(1200);
  const [areaType, setAreaType] = useState<AreaUnitType>('Total Area');
  const [buildingType, setBuildingType] = useState<BuildingType>('Residential House');
  const [floors, setFloors] = useState<number>(1);
  const [quality, setQuality] = useState<MaterialQuality>('Standard');
  const [cityInput, setCityInput] = useState<string>('Bangalore');
  const [tier, setTier] = useState<LocationTier>('Metro');
  
  // Advanced State
  const [soilCondition, setSoilCondition] = useState<string>('Standard Gravel Soil');
  const [seismicZone, setSeismicZone] = useState<string>('Zone III');

  // UI State
  const [activeTab, setActiveTab] = useState<'instant' | 'ai' | 'report'>('instant');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // History Templates State (stored in LocalStorage)
  const [history, setHistory] = useState<EstimateItem[]>([]);
  const [activeItem, setActiveItem] = useState<EstimateItem | null>(null);

  // 2. Load initially stored history templates
  useEffect(() => {
    try {
      const stored = localStorage.getItem('civil_estimator_history');
      if (stored) {
        const parsed = JSON.parse(stored) as EstimateItem[];
        setHistory(parsed);
        if (parsed.length > 0) {
          setActiveItem(parsed[0]);
        }
      }
    } catch (e) {
      console.error('LocalStorage history failed to decode:', e);
    }
  }, []);

  // Update dynamic tier selector whenever predefined city is modified
  const handleCityChange = (val: string) => {
    setCityInput(val);
    const matched = PREDEFINED_CITIES.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (matched) {
      setTier(matched.tier);
    }
  };

  // Convert inputs into EstimateInput structure
  const currentInput: EstimateInput = {
    area: Number(area) || 0,
    areaType,
    buildingType,
    floors,
    quality,
    city: cityInput,
    tier,
    soilCondition,
    seismicZone,
  };

  // Run instant cost calculations locally
  const localCostDetail = calculateConstructionCost(currentInput);

  // 3. Trigger Server-side detailed Gemini analysis
  const handleGenerateAIReport = async () => {
    if (!area || Number(area) <= 0) {
      setErrorMessage('Please provide a valid built-up area greater than 0.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setActiveTab('ai');

    // Fun and reassuring loading steps
    const messages = [
      'Assembling site specifications and area metrics...',
      'Mapping building floor layouts and regional Tier indices...',
      'Computing solid structural RCC reinforcement ratios (CPWD limits)...',
      'Matching raw aggregates, blocks, and sand quantities...',
      'Contacting Gemini AI Charter System for professional surveys...',
      'Drafting phase schedules and municipal regulatory blueprints...'
    ];

    let messageIndex = 0;
    setLoadingStep(messages[0]);
    const timer = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingStep(messages[messageIndex]);
    }, 4500);

    try {
      const response = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInput),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error status during cost surveyed.');
      }

      // Dynamic unique ID
      const newEstimateId = Math.random().toString(36).substring(2, 11);
      const newEstimate: EstimateItem = {
        id: newEstimateId,
        timestamp: new Date().toISOString(),
        input: { ...currentInput },
        cost: { ...localCostDetail },
        aiMarkdown: data.result,
      };

      // Store in memory and persisted storage
      const updatedHistory = [newEstimate, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('civil_estimator_history', JSON.stringify(updatedHistory));
      setActiveItem(newEstimate);
      setActiveTab('ai');
    } catch (err: any) {
      console.error('Estimate trigger failed:', err);
      setErrorMessage(err.message || 'Verification token or server contact issue occurred.');
      setActiveTab('instant');
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  // Handler for loaded template select
  const handleLoadTemplate = (item: EstimateItem) => {
    setActiveItem(item);
    setArea(item.input.area);
    setAreaType(item.input.areaType);
    setBuildingType(item.input.buildingType);
    setFloors(item.input.floors);
    setQuality(item.input.quality);
    setCityInput(item.input.city);
    setTier(item.input.tier);
    if (item.input.soilCondition) setSoilCondition(item.input.soilCondition);
    if (item.input.seismicZone) setSeismicZone(item.input.seismicZone);
    
    // Choose appropriate tab
    if (item.aiMarkdown) {
      setActiveTab('ai');
    } else {
      setActiveTab('instant');
    }
  };

  // Handler for individual template removal
  const handleDeleteTemplate = (id: string) => {
    const filt = history.filter(item => item.id !== id);
    setHistory(filt);
    localStorage.setItem('civil_estimator_history', JSON.stringify(filt));
    if (activeItem?.id === id) {
      setActiveItem(filt.length > 0 ? filt[0] : null);
    }
  };

  // Handler for erasing entire history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('civil_estimator_history');
    setActiveItem(null);
    setActiveTab('instant');
  };

  // Generate current pseudo-item if we want to preview instantly without saving
  const previewItem: EstimateItem = {
    id: activeItem?.id || 'live-preview',
    timestamp: activeItem?.timestamp || new Date().toISOString(),
    input: currentInput,
    cost: localCostDetail,
    aiMarkdown: activeItem?.aiMarkdown || undefined
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans">
      
      {/* 1. Header Banner */}
      <header className="bg-[#121215] text-[#fafafa] py-6 border-b border-[#27272a] shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-inner">
              <Calculator className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight uppercase font-sans">CONSTRUCT<span className="text-blue-500">AI</span> ESTIMATOR</h1>
                <span className="bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono uppercase tracking-wide">
                  SYSTEM LIVE
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa]">Chartered Civil Quantity Surveyor & Regional Indian Cost Estimator</p>
            </div>
          </div>
          <div className="bg-[#1c1c21] border border-[#27272a] px-4 py-2 rounded-xl flex items-center gap-3 text-xs">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[#a1a1aa] font-mono">Platform Live • Accurate Rates 2026</span>
          </div>
        </div>
      </header>

      {/* 2. Main Executive Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PARAMETER SELECTION FORM (4 cols) */}
        <section className="lg:col-span-4 lg:sticky lg:top-4 self-start space-y-6">
          <div className="bg-[#121215] rounded-2xl border border-[#27272a] shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#27272a]">
              <h2 className="font-bold text-[#fafafa] font-sans tracking-tight flex items-center gap-2 uppercase text-sm">
                <Activity className="w-4 h-4 text-blue-500" /> Project Parameters
              </h2>
              <span className="text-[10px] text-[#71717a] font-mono">Indian Rates 2026</span>
            </div>

            {/* Error notifications */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2 animate-pulse whitespace-pre-wrap">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Execution Notice</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Form Section */}
            <div className="space-y-4">
              {/* Built-up Area Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label htmlFor="area-input" className="text-xs font-semibold text-[#a1a1aa]">Total Area (sq.ft)</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAreaType('Total Area')}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-all cursor-pointer ${
                        areaType === 'Total Area' 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-[#1c1c21] text-[#a1a1aa] border-[#27272a] hover:bg-[#27272a]'
                      }`}
                    >
                      Total Area
                    </button>
                    <button 
                      onClick={() => setAreaType('Per Floor Area')}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-all cursor-pointer ${
                        areaType === 'Per Floor Area' 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-[#1c1c21] text-[#a1a1aa] border-[#27272a] hover:bg-[#27272a]'
                      }`}
                    >
                      Per Floor
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="area-input"
                    type="number"
                    min="10"
                    placeholder="Built-up base (e.g. 1500)"
                    value={area}
                    onChange={(e: any) => setArea(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#1c1c21] border border-[#27272a] rounded-xl py-3 px-4 text-[#fafafa] focus:border-blue-500 focus:outline-none text-sm font-semibold transition-all font-mono"
                  />
                  <span className="absolute right-4 top-3 text-xs font-mono font-bold text-[#71717a]">
                    SQ.FT
                  </span>
                </div>
              </div>

              {/* Building Type */}
              <div className="space-y-1.5">
                <label htmlFor="building-type" className="text-xs font-semibold text-[#a1a1aa] block">Building Type</label>
                <div className="relative">
                  <select
                    id="building-type"
                    value={buildingType}
                    onChange={(e: any) => setBuildingType(e.target.value as BuildingType)}
                    className="w-full bg-[#1c1c21] border border-[#27272a] rounded-xl py-3 px-4 text-[#fafafa] focus:border-blue-500 focus:outline-none text-sm font-semibold appearance-none cursor-pointer"
                  >
                    <option value="Residential House">Residential House</option>
                    <option value="Apartment">Apartment Complex</option>
                    <option value="Commercial Building">Commercial Space</option>
                    <option value="Office Building">Office Building</option>
                    <option value="Warehouse">Industrial Warehouse</option>
                  </select>
                  <Building className="absolute right-4 top-3.5 w-4 h-4 text-[#71717a] pointer-events-none" />
                </div>
              </div>

              {/* Number of Floors */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="floor-count" className="text-xs font-semibold text-[#a1a1aa]">Floors</label>
                  <span className="text-[10px] text-[#a1a1aa] font-mono bg-[#1c1c21] border border-[#27272a] px-1.5 py-0.5 rounded font-bold">
                    {floors} Floor{floors > 1 ? 's' : ''} (G + {floors - 1})
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="floor-count"
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={floors}
                    onChange={(e: any) => setFloors(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-[#27272a] rounded-lg appearance-none mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-[#71717a] font-mono mt-1">
                    <span>1 (Ground)</span>
                    <span>5 Floors</span>
                    <span>10 Floors</span>
                    <span>15 Floors</span>
                  </div>
                </div>
              </div>

              {/* Material Quality Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#a1a1aa] block mt-2">Quality Grade</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Basic', 'Standard', 'Premium', 'Luxury'] as MaterialQuality[]).map((q) => {
                    const isSel = quality === q;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuality(q)}
                        className={`text-xs p-2.5 rounded-xl border text-center transition-all cursor-pointer font-semibold ${
                          isSel 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-[#1c1c21] border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a]'
                        }`}
                      >
                        <div>{q}</div>
                        <div className={`text-[9px] font-mono mt-0.5 transition-colors ${isSel ? 'text-blue-200' : 'text-[#71717a]'}`}>
                          ₹{QUALITY_RANGES[q].min}-{QUALITY_RANGES[q].max}/sq.ft
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Picker & Tier */}
              <div className="space-y-1.5 pt-2">
                <label htmlFor="city-picker" className="text-xs font-semibold text-[#a1a1aa] block">Location (Tier/City)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      id="city-picker"
                      value={cityInput}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full bg-[#1c1c21] border border-[#27272a] rounded-xl py-3 px-3 text-[#fafafa] focus:border-blue-500 focus:outline-none text-xs font-semibold appearance-none cursor-pointer"
                    >
                      {PREDEFINED_CITIES.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                      <option value="Custom">Custom City</option>
                    </select>
                    <MapPin className="absolute right-3 top-3.5 w-3.5 h-3.5 text-[#71717a] pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as LocationTier)}
                      className="w-full bg-[#1c1c21] border border-[#27272a] rounded-xl py-3 px-3 text-[#fafafa] focus:border-blue-500 focus:outline-none text-xs font-semibold appearance-none cursor-pointer font-mono"
                    >
                      <option value="Metro">Metro (+20%)</option>
                      <option value="Tier 2">Tier 2 (+10%)</option>
                      <option value="Tier 3">Tier 3 (Base)</option>
                    </select>
                  </div>
                </div>
                {cityInput === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom location name..."
                    className="w-full border border-[#27272a] rounded-xl mt-2 px-3 py-2 text-xs font-sans font-semibold focus:outline-none focus:border-blue-500 bg-[#1c1c21] text-[#fafafa]"
                    onChange={(e) => setCityInput(e.target.value || 'Custom')}
                  />
                )}
              </div>

              {/* Collapsible Civil Modifiers */}
              <details className="group border border-[#27272a] rounded-xl p-3 bg-[#1c1c21]/40">
                <summary className="text-xs font-semibold text-[#a1a1aa] flex justify-between items-center cursor-pointer list-none select-none">
                  <span>Advanced Soil & Seismicity Modifiers</span>
                  <span className="text-[10px] text-[#71717a] group-open:rotate-180 transition-transform font-mono">▼</span>
                </summary>
                <div className="mt-3 space-y-3 pt-3 border-t border-[#27272a] text-xs text-[#fafafa]">
                  <div className="space-y-1">
                    <label htmlFor="soil-input" className="text-[10px] text-[#71717a] font-bold uppercase">Foundation Soil Class</label>
                    <select
                      id="soil-input"
                      value={soilCondition}
                      onChange={(e) => setSoilCondition(e.target.value)}
                      className="w-full border border-[#27272a] rounded-lg p-2 bg-[#1c1c21] text-[#fafafa] focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Standard Gravel Soil">Standard Stable Gravel/Sand</option>
                      <option value="Black Cotton Soil">Black Cotton / Heavy Clay (Requires Piles)</option>
                      <option value="Sloped Rocky Soil">Hilly Sloped Rocky Terrain (+Terracing)</option>
                      <option value="Coastal Soft Silt">Coastal Marshy/Silt (Requires deep raft)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="seismic-input" className="text-[10px] text-[#71717a] font-bold uppercase">IS Seismic Vulnerability Zone</label>
                    <select
                      id="seismic-input"
                      value={seismicZone}
                      onChange={(e) => setSeismicZone(e.target.value)}
                      className="w-full border border-[#27272a] rounded-lg p-2 bg-[#1c1c21] text-[#fafafa] focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Zone II">Seismic Zone II (Lowest Threat)</option>
                      <option value="Zone III">Seismic Zone III (Moderate Threat)</option>
                      <option value="Zone IV">Seismic Zone IV (High Risk - Frame Tying)</option>
                      <option value="Zone V">Seismic Zone V (Very High Risk - Specialized Ductility)</option>
                    </select>
                  </div>
                </div>
              </details>
            </div>

            {/* CTA action triggers */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateAIReport}
                disabled={loading}
                className={`w-full py-4 bg-blue-600 hover:bg-blue-500 rounded font-bold text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  loading 
                    ? 'bg-blue-800/50 text-[#71717a] cursor-not-allowed border border-[#27272a]' 
                    : 'text-white'
                }`}
              >
                {loading ? 'Please Wait...' : 'Calculate Estimate'}
                <Sparkles className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <p className="text-[10px] text-[#71717a] text-center mt-2">
                Instantly calculates standard civil estimations below, or calls Gemini for complete engineering BOQs, schedules, & notes.
              </p>
            </div>
          </div>

          {/* History Sidebar templates Panel */}
          <HistorySidebar
            history={history}
            onSelect={handleLoadTemplate}
            onDelete={handleDeleteTemplate}
            onClearAll={handleClearHistory}
            activeId={activeItem?.id}
          />
        </section>

        {/* RIGHT COLUMN: MAIN DASHBOARD AND VIEWS (8 cols) */}
        <section className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Dashboard Loading state overlay */}
          {loading && (
            <div className="bg-[#121215] border border-[#27272a] backdrop-blur-md rounded-2xl p-12 text-center text-[#fafafa] flex flex-col items-center justify-center space-y-6 shadow-xl py-24 min-h-[30rem] z-50">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-b-2 border-l-2 border-[#27272a] animate-spin flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-t-2 border-blue-500 border-l-2 animate-bounce flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold font-sans tracking-wide text-white uppercase">Chartering Survey Index</h3>
                <div className="text-sm text-blue-400 font-mono font-bold animate-pulse">
                  {loadingStep}
                </div>
                <p className="text-xs text-[#a1a1aa] font-mono italic">Writing comprehensive structural analysis for {cityInput} building plans...</p>
              </div>
            </div>
          )}

          {/* Regular Results Dashboard when not loading */}
          {!loading && (
            <div className="space-y-6">
              
              {/* Tabs selectors bar */}
              <div className="bg-[#121215] p-2 rounded-2xl border border-[#27272a] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex bg-[#1c1c21] p-1 rounded-xl w-full sm:w-auto border border-[#27272a]">
                  <button
                    onClick={() => setActiveTab('instant')}
                    className={`flex-1 sm:flex-none uppercase text-[10px] font-bold font-sans px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'instant' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-[#a1a1aa] hover:text-[#fafafa]'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" /> Instant Assessment
                  </button>
                  <button
                    onClick={() => {
                      if (!activeItem?.aiMarkdown) {
                        alert('Please fill specs and select "Calculate Estimate" to compile the Gemini survey analysis.');
                        return;
                      }
                      setActiveTab('ai');
                    }}
                    className={`flex-1 sm:flex-none uppercase text-[10px] font-bold font-sans px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'ai' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-[#a1a1aa] hover:text-[#fafafa]'
                    } ${!activeItem?.aiMarkdown ? 'opacity-55' : ''}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Quantities & BOQ
                  </button>
                  <button
                    onClick={() => {
                      if (!activeItem) {
                        alert('Run an estimation first to create a PDF layout document.');
                        return;
                      }
                      setActiveTab('report');
                    }}
                    className={`flex-1 sm:flex-none uppercase text-[10px] font-bold font-sans px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'report' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-[#a1a1aa] hover:text-[#fafafa]'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Layout PDF
                  </button>
                </div>
                
                {/* Instant dynamic balance summary badge */}
                <div className="text-right shrink-0 pr-2">
                  <span className="text-[9px] text-[#71717a] font-mono block leading-none uppercase">Instant cost Valuation</span>
                  <span className="text-base font-bold font-mono text-blue-400">
                    {formatInLakhsOrCrores(localCostDetail.totalCost)}
                  </span>
                </div>
              </div>

              {/* ----------------- TAB 1: INSTANT CALCULATIONS PREVIEW ----------------- */}
              {activeTab === 'instant' && (
                <div className="space-y-6">
                  {/* Financial overview bento panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Main Total budget metric */}
                    <div className="md:col-span-2 bg-[#121215] text-[#fafafa] rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden border border-[#27272a]">
                      <div className="relative z-10">
                        <span className="text-[10px] tracking-wider font-mono text-blue-500 font-bold uppercase">Estimated Total Project Cost</span>
                        <div className="text-3xl sm:text-5xl font-black tracking-tighter text-white mt-1">
                          {formatIndianCurrency(localCostDetail.totalCost)}
                        </div>
                        <p className="text-xs text-[#a1a1aa] mt-2 font-mono">
                          Based on {Number(area) || 0} sq.ft {areaType === 'Per Floor Area' ? `per floor (total ${(Number(area) || 0) * floors} sq.ft)` : 'total built-up'} at {cityInput}
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#27272a] flex justify-between items-center text-xs text-[#a1a1aa] relative z-10 font-mono">
                        <span>Cost per Sq.Ft:</span>
                        <span className="text-blue-500 font-bold">₹{localCostDetail.costPerSqFt.toLocaleString('en-IN')}</span>
                      </div>
                      {/* background pattern */}
                      <div className="absolute right-0 bottom-0 text-blue-500 opacity-10 transform translate-y-10 translate-x-10 pointer-events-none">
                        <TrendingUp className="w-48 h-48" />
                      </div>
                    </div>

                    {/* Budget safe range guidance */}
                    <div className="bg-[#121215] rounded-3xl p-6 border border-[#27272a] shadow-sm flex flex-col justify-between font-sans text-white">
                      <span className="text-[10px] tracking-wider font-mono text-[#71717a] font-bold uppercase block mb-1">Recommended Budget Range</span>
                      <div>
                        <div className="text-sm text-[#a1a1aa] font-mono">MIN: <span className="font-semibold text-white italic">{formatInLakhsOrCrores(localCostDetail.budgetRangeMin)}</span></div>
                        <div className="text-sm text-[#a1a1aa] font-mono mt-1">MAX: <span className="font-semibold text-white italic">{formatInLakhsOrCrores(localCostDetail.budgetRangeMax)}</span></div>
                      </div>
                      <div className="pt-3 border-t border-[#27272a] text-[10px] text-[#71717a] mt-3 leading-relaxed">
                        <Info className="w-3.5 h-3.5 inline text-blue-500 mr-1" />
                        We suggest budgeting within this range to account for unpredicted raw material surges & geotechnical excavations.
                      </div>
                    </div>
                  </div>

                  {/* Mathematical specifications details info */}
                  <div className="bg-[#121215] border border-[#27272a] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-[#a1a1aa]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1c1c21] border border-[#27272a] flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <span className="font-bold text-white">Staged mathematical calculations active:</span>
                        <p className="text-[#a1a1aa]">Includes Quality: {quality} ({QUALITY_RANGES[quality].default} midpoint) x Tier: {tier} ({TIER_MULTIPLIERS[tier]}x multiplier) x Floors factor ({floors === 1 ? '1.0x Ground' : `avg ${((1 + 0.08 * (floors - 1) / 2)).toFixed(2)}x`})</p>
                      </div>
                    </div>
                    {activeItem?.aiMarkdown ? (
                      <span className="bg-blue-950 text-blue-400 border border-blue-900/40 px-2.5 py-1 rounded-full font-bold text-[10px] shrink-0 inline-flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-amber-400" /> AI Report Active
                      </span>
                    ) : (
                      <button
                        onClick={handleGenerateAIReport}
                        className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-white font-bold text-[10px] transition-colors shrink-0 cursor-pointer text-center flex items-center gap-1 shadow-xs"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" /> Get AI Quantities
                      </button>
                    )}
                  </div>

                  {/* High Quality charts component imports */}
                  <InteractiveCharts cost={localCostDetail} input={currentInput} />

                  {/* Quick FAQ / Guidance to help internship reviewer */}
                  <div className="bg-[#121215] p-6 rounded-2xl border border-[#27272a] shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-[#71717a] font-mono tracking-wider uppercase">Indian Civil Engineering Thumb Rules Applied</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#a1a1aa]">
                      <div className="p-3 bg-[#1c1c21]/55 rounded-xl border border-[#27272a]">
                        <span className="font-bold text-white block mb-1">Standard Material Weight Limits</span>
                        <p>Our quantity models assume ~0.4 bags of cement/sq.ft and ~3.8 kg of mild reinforcement steel/sq.ft representing standards of typical structural columns and footing rafts in India.</p>
                      </div>
                      <div className="p-3 bg-[#1c1c21]/55 rounded-xl border border-[#27272a]">
                        <span className="font-bold text-white block mb-1">Incremental Higher transporting Loads</span>
                        <p>Ground floor counts as base level. Floors above require concrete transit pumps, brick lifting pulley machinery, and scaffolding stages increasing top-level masonry rates by ~8% per stage.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- TAB 2: DETAILED GEMINI AI SURVEY BOQ ----------------- */}
              {activeTab === 'ai' && (
                <div className="bg-[#121215] rounded-2xl border border-[#27272a] shadow-xs overflow-hidden">
                  
                  {/* Markdown Container */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="flex justify-between items-center bg-[#1c1c21] p-4 border border-[#27272a]/60 rounded-xl text-white">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-[#fafafa]">Gemini Generative Quantity Survey</h4>
                          <p className="text-[10px] text-[#a1a1aa]">Chartered structural quantities and region compliance rules listed below.</p>
                        </div>
                      </div>
                      <span className="bg-blue-600 text-white font-mono text-[9px] px-2 py-0.5 rounded font-semibold shrink-0 uppercase tracking-wide">
                        G-3.5-FLASH
                      </span>
                    </div>

                    <div className="markdown-body text-xs text-stone-200 prose prose-invert prose-stone max-w-none space-y-4 select-all leading-relaxed font-sans pr-1">
                      {activeItem?.aiMarkdown ? (
                        <div id="gemini-markdown-output">
                          <ReactMarkdown>{activeItem.aiMarkdown}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-[#71717a] font-mono">
                          <p>Ready to compile full Gemini survey report details.</p>
                          <p className="text-[10px] mt-1 text-[#52525b]">Fill in specifications on the left panel and click &quot;Calculate Estimate&quot;</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- TAB 3: PRINTOUT INVOICE REPORT PORTRAIT ----------------- */}
              {activeTab === 'report' && (
                <div className="space-y-6">
                  {activeItem ? (
                    <PDFReport item={activeItem} />
                  ) : (
                    <div className="bg-[#121215] rounded-2xl border border-[#27272a] shadow-sm p-12 text-center text-[#71717a] font-mono">
                      No estimate available to preview. Run an estimate first to render a print layout.
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </section>

      </main>

      {/* 3. Global Footer */}
      <footer className="bg-[#121215] border-t border-[#27272a] text-[#71717a] text-xs py-8 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="font-mono">© 2026 CONSTRUCTAI PRO SYSTEMS • CPWD rates modeled on standard chartered civil quantity parameters.</p>
          <div className="flex gap-4 font-mono">
            <span className="text-[#a1a1aa]">Model: Gemini 3.5 Flash</span>
            <span>•</span>
            <span className="text-[#a1a1aa]">Full-Stack Container</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
