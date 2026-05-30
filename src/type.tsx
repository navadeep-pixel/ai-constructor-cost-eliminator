/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BuildingType = 
  | 'Residential House'
  | 'Apartment'
  | 'Commercial Building'
  | 'Office Building'
  | 'Warehouse';

export type MaterialQuality = 
  | 'Basic'
  | 'Standard'
  | 'Premium'
  | 'Luxury';

export type LocationTier = 
  | 'Metro'
  | 'Tier 2'
  | 'Tier 3';

export type AreaUnitType = 
  | 'Total Area'
  | 'Per Floor Area';

export interface EstimateInput {
  area: number;
  areaType: AreaUnitType;
  buildingType: BuildingType;
  floors: number;
  quality: MaterialQuality;
  city: string;
  tier: LocationTier;
  soilCondition?: string;
  seismicZone?: string;
}

export interface DetailedCost {
  costPerSqFt: number;
  totalCost: number;
  materialCost: number;
  laborCost: number;
  contingencyCost: number;
  budgetRangeMin: number;
  budgetRangeMax: number;
  materialsBreakdown: {
    cement: number;
    steel: number;
    sandAndAggregate: number;
    bricksAndBlocks: number;
    finishingAndFittings: number;
    otherMaterials: number;
  };
  laborBreakdown: {
    civilWork: number;
    masonry: number;
    plumbingAndElectrical: number;
    paintingAndFinishing: number;
  };
}

export interface EstimateItem {
  id: string;
  timestamp: string;
  input: EstimateInput;
  cost: DetailedCost;
  aiMarkdown?: string;
}
