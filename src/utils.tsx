/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EstimateInput, DetailedCost } from './types';

// Rate ranges based on rules
export const QUALITY_RANGES = {
  Basic: { min: 1500, max: 2000, default: 1750 },
  Standard: { min: 2000, max: 3000, default: 2500 },
  Premium: { min: 3000, max: 4500, default: 3750 },
  Luxury: { min: 4500, max: 7000, default: 5750 },
};

// Location tiers based on rules
export const TIER_MULTIPLIERS = {
  'Metro': 1.20,  // +20%
  'Tier 2': 1.10, // +10%
  'Tier 3': 1.00, // Base
};

// Standard predefined cities in India for user convenience
export const PREDEFINED_CITIES = [
  { name: 'Mumbai', tier: 'Metro' as const },
  { name: 'Delhi NCR', tier: 'Metro' as const },
  { name: 'Bangalore', tier: 'Metro' as const },
  { name: 'Chennai', tier: 'Metro' as const },
  { name: 'Hyderabad', tier: 'Metro' as const },
  { name: 'Kolkata', tier: 'Metro' as const },
  { name: 'Pune', tier: 'Metro' as const },
  { name: 'Ahmedabad', tier: 'Metro' as const },
  { name: 'Jaipur', tier: 'Tier 2' as const },
  { name: 'Lucknow', tier: 'Tier 2' as const },
  { name: 'Kochi', tier: 'Tier 2' as const },
  { name: 'Indore', tier: 'Tier 2' as const },
  { name: 'Bhopal', tier: 'Tier 2' as const },
  { name: 'Patna', tier: 'Tier 2' as const },
  { name: 'Visakhapatnam', tier: 'Tier 2' as const },
  { name: 'Coimbatore', tier: 'Tier 2' as const },
  { name: 'Chandigarh', tier: 'Tier 2' as const },
  { name: 'Guwahati', tier: 'Tier 3' as const },
  { name: 'Mysore', tier: 'Tier 3' as const },
  { name: 'Madurai', tier: 'Tier 3' as const },
  { name: 'Udaipur', tier: 'Tier 3' as const },
];

/**
 * Format currency in Indian standard numbering system (Lakhs / Crores)
 * e.g., ₹1,50,000 instead of ₹150,000
 */
export function formatIndianCurrency(amount: number): string {
  const roundAmount = Math.round(amount);
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return formatter.format(roundAmount);
}

/**
 * Format numbers in Indian Lakhs/Crores values
 */
export function formatInLakhsOrCrores(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return formatIndianCurrency(amount);
}

/**
 * Calculate cost details based on inputs
 */
export function calculateConstructionCost(input: EstimateInput): DetailedCost {
  const { area, areaType, floors, quality, tier } = input;

  // 1. Get base quality cost per sq.ft (using midpoint of selected quality tier)
  const baseRate = QUALITY_RANGES[quality].default;

  // 2. Location multiplier
  const locationMultiplier = TIER_MULTIPLIERS[tier];

  // 3. Floor calculations
  // Ground floor is base rate. Remaining floors increase cost by 8% each
  // Sum representing floor rate factor: 1 for Ground, 1.08 for Floor 2, 1.16 for Floor 3...
  let totalFloorFactor = 0;
  for (let i = 1; i <= floors; i++) {
    totalFloorFactor += 1 + 0.08 * (i - 1);
  }
  const averageFloorMultiplier = totalFloorFactor / floors;

  // 4. Compute Built-up Area
  // If user entered total built-up area, we use it directly.
  // If user entered per-floor area, total area = area * floors.
  const totalBuiltUpArea = areaType === 'Total Area' ? area : area * floors;

  // Base adjusted cost per sq.ft
  const adjustedCostPerSqFt = baseRate * locationMultiplier * averageFloorMultiplier;

  // Total Base Cost
  const totalCost = totalBuiltUpArea * adjustedCostPerSqFt;

  // 5. Cost Breakdown percentages (Standard Indian construction ratios)
  // Material: 55%, Labor: 35%, Contingency & approvals: 10%
  const materialCost = totalCost * 0.55;
  const laborCost = totalCost * 0.35;
  const contingencyCost = totalCost * 0.10;

  // Suggested budget range: Total Cost - 5% to Total Cost + 10%
  const budgetRangeMin = totalCost * 0.95;
  const budgetRangeMax = totalCost * 1.10;

  // 6. Detailed materials breakdown
  // Cement: 16% of material cost
  // Steel: 15% of material cost
  // Bricks/blocks: 12% of material cost
  // Sand/aggregates: 12% of material cost
  // Finishing/fittings: 30% of material cost
  // Other (plumbing/elec components, carpentry, paint mats): 15% of material cost
  const cement = materialCost * 0.16;
  const steel = materialCost * 0.15;
  const brickBlocks = materialCost * 0.12;
  const sandAggregate = materialCost * 0.12;
  const finishingFittings = materialCost * 0.30;
  const otherMaterials = materialCost * 0.15;

  // 7. Labor work breakdown
  // Civil: 40% of labor cost
  // Brickwork & plastering: 25% of labor cost
  // MEP Installation crews: 20% of labor cost
  // Paint & tile finish crews: 15% of labor cost
  const civilWork = laborCost * 0.40;
  const masonry = laborCost * 0.25;
  const plumbingAndElectrical = laborCost * 0.20;
  const paintingAndFinishing = laborCost * 0.15;

  return {
    costPerSqFt: Math.round(adjustedCostPerSqFt),
    totalCost: Math.round(totalCost),
    materialCost: Math.round(materialCost),
    laborCost: Math.round(laborCost),
    contingencyCost: Math.round(contingencyCost),
    budgetRangeMin: Math.round(budgetRangeMin),
    budgetRangeMax: Math.round(budgetRangeMax),
    materialsBreakdown: {
      cement: Math.round(cement),
      steel: Math.round(steel),
      sandAndAggregate: Math.round(sandAggregate),
      bricksAndBlocks: Math.round(brickBlocks),
      finishingAndFittings: Math.round(finishingFittings),
      otherMaterials: Math.round(otherMaterials),
    },
    laborBreakdown: {
      civilWork: Math.round(civilWork),
      masonry: Math.round(masonry),
      plumbingAndElectrical: Math.round(plumbingAndElectrical),
      paintingAndFinishing: Math.round(paintingAndFinishing),
    },
  };
}
