# Metrics Verification Script

This script verifies that the Dashboard calculates metrics exactly according to the Technical Specification.

## Installation

First, install the required dependency:

```bash
pnpm install
```

This will install `tsx` which is needed to run TypeScript scripts.

## Usage

### Option 1: Using npm script (Recommended)

```bash
cd apps/web
pnpm verify-metrics
```

### Option 2: Direct execution with environment variables

```bash
cd apps/web
OPENAI_API_KEY=your-key PERPLEXITY_API_KEY=your-key tsx scripts/verify-metrics.ts
```

### Option 3: With custom parameters

```bash
cd apps/web
TARGET_DOMAIN=mayoclinic.org \
QUERY="cardiac surgery" \
CITY="Rochester" \
OPENAI_API_KEY=your-key \
PERPLEXITY_API_KEY=your-key \
tsx scripts/verify-metrics.ts
```

## Configuration

You can configure the script in two ways:

1. **Environment Variables** (recommended):
   - `TARGET_DOMAIN` - The domain to check (default: `mayoclinic.org`)
   - `QUERY` - The search query (default: `cardiac surgery`)
   - `CITY` - The city location (default: `Rochester`)
   - `OPENAI_API_KEY` - Your OpenAI API key (required)
   - `PERPLEXITY_API_KEY` - Your Perplexity API key (required)

2. **Hardcoded values** - Edit the top of `scripts/verify-metrics.ts` to set default values.

## What the Script Does

1. **Fetches Data:**
   - Runs AI Scan using OpenAI and Perplexity (same as the app)
   - Performs Tech Audit (checks llms.txt, measures TTFB, checks SSL)

2. **Calculates Metrics (Strictly following Specs):**
   - **Visibility Rate:** 100% if domain found in top 10, else 0%
   - **Average Position:** Exact rank from AI response
   - **ClinicAI Score:** Uses the formula:
     ```
     Score = (0.25 * VisibilityScore) + 
             (0.2 * TechScore) + 
             (0.2 * ContentScore) + 
             (0.15 * TrustScore) + 
             (0.1 * LocalScore) + 
             (0.1 * OtherScore)
     ```
   - **Competitor Analysis:** Extracts top 5 competitors with positions and estimated CAI scores

3. **Output:**
   - Prints a detailed comparison table showing all metrics
   - Shows breakdown of ClinicAI Score components
   - Displays competitor analysis

## Output Format

The script outputs:
- Core metrics (Visibility Rate, Average Position, ClinicAI Score)
- Detailed ClinicAI Score breakdown with component scores and weighted contributions
- Competitor analysis table (Top 5)
- Additional tech audit information

## Example Output

```
================================================================================
METRICS VERIFICATION REPORT
================================================================================

📊 CORE METRICS:
────────────────────────────────────────────────────────────────────────────────
Visibility Rate:     100.0%
Average Position:    3.0
ClinicAI Score:      72.50

🔢 CLINICAI SCORE BREAKDOWN:
────────────────────────────────────────────────────────────────────────────────
Component Scores (0-100):
  Visibility:         100.0
  Tech:               75.0
  Content:            100.0
  E-E-A-T:            80.0
  Local:              70.0
  Other:              50.0

Weighted Contributions:
  Visibility (25%):   25.00
  Tech (20%):         15.00
  Content (20%):      20.00
  E-E-A-T (15%):      12.00
  Local (10%):        7.00
  Other (10%):        5.00
  ────────────────────────────────────────────────────────────────────────────────
  Total Score:        72.50

🏆 COMPETITOR ANALYSIS (Top 5):
────────────────────────────────────────────────────────────────────────────────
Position | Domain Name                    | Estimated CAI Score
────────────────────────────────────────────────────────────────────────────────
       1 | competitor1.com                |               90.0
       2 | competitor2.com                 |               80.0
       3 | competitor3.com                 |               70.0
...
```


