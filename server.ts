/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini SDK with custom telemetry headers
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets.');
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API Server check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Main Estimator API Route proxying Gemini requests
  app.post('/api/estimate', async (req: Request, res: Response) => {
    try {
      const { area, areaType, buildingType, floors, quality, city, tier, soilCondition, seismicZone } = req.body;

      if (!area || !buildingType || !floors || !quality || !city) {
        return res.status(400).json({ error: 'Missing required estimation fields' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: 'Gemini API Key is not configured. Please add GEMINI_API_KEY in the Secrets panel.' 
        });
      }

      // Format clean prompts including technical parameters and location/quality math instructions
      const prompt = `
Generate a professional detailed construction cost estimate for an Indian construction project with these specs:
- Total Built-up Area: ${area} sq.ft (${areaType === 'Per Floor Area' ? 'Calculated as area per floor for ' + floors + ' floors' : 'Total built-up area across all floors'})
- Building Type: ${buildingType}
- Number of Floors: ${floors}
- Material Quality Class: ${quality}
- City Name: ${city} (Location Tier: ${tier})
- Soil Condition: ${soilCondition || 'Standard stable soil'}
- Seismic Zone: ${seismicZone || 'Zone II/III (Standard)'}

--- Calculation Guidelines to incorporate (Do the calculation precisely according to these Indian construction rules):
1. Base Quality Rates:
   - Basic: ₹1,500 - ₹2,000 / sq.ft
   - Standard: ₹2,000 - ₹3,000 / sq.ft
   - Premium: ₹3,000 - ₹4,500 / sq.ft
   - Luxury: ₹4,500 - ₹7,000 / sq.ft
2. Location Impact:
   - Metro City (e.g. Mumbai, Delhi NCR, Bangalore, Pune, Chennai, Hyderabad, Kolkata): +20% cost adjustment.
   - Tier 2 City (e.g. Jaipur, Lucknow, Kochi, Indore): +10% cost adjustment.
   - Tier 3 City / Other rural regions: Base cost (0% adjustment).
3. Floor Multiplier:
   - Ground Floor is the base rate.
   - Each additional floor increases the cost of its respective area by 8% (e.g., Ground: base, Floor 2: base * 1.08, Floor 3: base * 1.16, etc.). Compute the averaged cost per sq.ft incorporating this accurately.
4. Core Breakdown Ratios:
   - Material Cost: ~55% of total budget.
   - Labor Cost: ~35% of total budget.
   - Contingency & Overheads: ~10% of total budget.

Provide the response in raw, clean markdown format exactly following the template below:

# Construction Cost Estimate

## Project Details
Area: [Insert Area] sq.ft
Building Type: ${buildingType}
Floors: ${floors}
Material Quality: ${quality}
Location: ${city} (${tier})

## Cost Breakdown
Cost Per Sq.Ft: ₹[Insert Cost Per Sq.Ft]

Material Cost: ₹[Insert Material Cost]
Labor Cost: ₹[Insert Labor Cost]
Contingency Cost: ₹[Insert Contingency Cost]

## Estimated Total Cost
₹[Insert Total Cost in Rupees]

## Recommended Budget Range
₹[Insert Min Range] - ₹[Insert Max Range]

## Detailed Civil Engineering Breakdown & Quantities
Provide standard thumb-rule approximations of material quantities required for this specific build size:
- **Cement Bags**: Estimated bags needed (approx 0.4 bags per sq.ft of total area).
- **Steel (Tons)**: Estimated steel reinforcement needed (approx 3.5 to 4 kg per sq.ft of total area).
- **Bricks/Solid Blocks**: Estimated quantity.
- **Sand & Coarse Aggregate**: In Cubic Feet (cft) or Brass.
- **Plumbing, Electrical, Tile Finishes**: Cost allocations and qualitative specifications suited for "${quality}" grade material.

## Construction Phase Scheduling (Interactive Timeline Guidelines)
Provide a chronological timeline of stages in weeks based on ${floors} floor(s):
1. Excavation & Foundation work: Weeks X to Y
2. RCC Slabs / Columns (Frame): Weeks X to Y
3. Brickwork & Plastering: Weeks X to Y
4. MEP Systems (Plumbing/Electrical piping): Weeks X to Y
5. Interior Tiling, Carpentry, Painting & Fittings: Weeks X to Y

## Region-Specific Compliance & Challenges
Discuss specific issues for ${city} (${tier} tier) regarding:
- Water logging / Foundation soil requirements (like Soil Condition: ${soilCondition || 'Standard' })
- Major Municipal Corporation permissions (RERA registration, municipal floor index limits, local water supply setup, power connections)
- Expected cost inflationary factors in local labor and transport.

## Notes
- This is a preliminary estimate.
- Actual costs depend on market rates, approvals, design complexity, and contractor charges.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite Indian chartered civil engineer, quantity surveyor, and construction cost estimator. Provide extremely professional, realistic estimates aligning exactly with current Indian real estate, CPWD, and construction industry rates. Maintain an authoritative yet supportive tone. Use clean, professional typography and structured tables.',
        },
      });

      const markdownResult = response.text || 'Unable to generate estimate.';
      res.json({ result: markdownResult });
    } catch (error: any) {
      console.error('Error in construction estimation:', error);
      res.status(500).json({ error: error.message || 'Error occurred while contacting Gemini API' });
    }
  });

  // Setup Vite Dev server or static express paths for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server middleware mounted.');
  } else {
    // Production serving static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static files mounted for distribution serving.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Expert Construction Estimator backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
