/**
 * CLUES Property Dashboard - LLM Scraper Integration
 * Mirrors the existing CLUES Quantum App scraping tools
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
// Note: Gemini uses REST API directly for thinking_config support

export type LLMProvider = 'claude' | 'gpt' | 'grok' | 'gemini' | 'auto' | 'hybrid';

export interface ScrapeResult {
  success: boolean;
  data: PropertyScrapedData | null;
  llmUsed: LLMProvider;
  cost: number;
  fieldsPopulated: number;
  errors: string[];
}

export interface PropertyScrapedData {
  address: {
    full_address: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    latitude: number | null;
    longitude: number | null;
  };
  price: {
    current: number | null;
    original: number | null;
    per_sqft: number | null;
    tax_assessed: number | null;
  };
  property: {
    bedrooms: number | null;
    bathrooms: number | null;
    sqft: number | null;
    lot_size: number | null;
    year_built: number | null;
    property_type: string;
    stories: number | null;
    garage: number | null;
    pool: boolean;
    hoa: number | null;
  };
  listing: {
    status: string;
    days_on_market: number | null;
    mls_number: string;
    listing_agent: string;
    listing_brokerage: string;
  };
  walkability?: {
    walk_score: number | null;
    transit_score: number | null;
    bike_score: number | null;
  };
  crime?: {
    crime_index: number | null;
    safety_score: number | null;
    grade: string;
  };
  schools?: {
    district: string;
    elementary: { name: string; rating: number | null };
    middle: { name: string; rating: number | null };
    high: { name: string; rating: number | null };
  };
}

class PropertyScraper {
  private claude: Anthropic | null = null;
  private gpt: OpenAI | null = null;
  private grok: OpenAI | null = null;
  // Gemini uses REST API directly - no SDK instance needed

  private costs = {
    claude: 0,
    gpt: 0,
    grok: 0,
    gemini: 0,
    total: 0,
  };

  constructor() {
    // Initialize clients based on available keys
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      this.claude = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    }

    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.gpt = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    }

    if (import.meta.env.VITE_GROK_API_KEY) {
      this.grok = new OpenAI({
        apiKey: import.meta.env.VITE_GROK_API_KEY,
        baseURL: 'https://api.x.ai/v1',
        dangerouslyAllowBrowser: true,
      });
    }
    // Gemini API key checked at call time - uses REST API directly
  }

  /**
   * Main scrape method - routes to appropriate LLM
   */
  async scrapeProperty(
    input: string, // URL or address
    preferredLLM: LLMProvider = 'auto',
    enrichData: boolean = true
  ): Promise<ScrapeResult> {
    const errors: string[] = [];
    let data: PropertyScrapedData | null = null;
    let llmUsed: LLMProvider = preferredLLM;
    let cost = 0;

    try {
      // Auto-select LLM based on input
      if (preferredLLM === 'auto') {
        llmUsed = this.selectBestLLM(input);
      }

      // Scrape with selected LLM
      if (preferredLLM === 'hybrid') {
        data = await this.scrapeWithHybrid(input);
      } else {
        data = await this.scrapeWithLLM(input, llmUsed);
      }

      // Enrich with additional data
      if (enrichData && data) {
        data = await this.enrichPropertyData(data);
      }

      cost = this.costs.total;

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return {
      success: data !== null,
      data,
      llmUsed,
      cost,
      fieldsPopulated: this.countPopulatedFields(data),
      errors,
    };
  }

  private selectBestLLM(input: string): LLMProvider {
    const inputLower = input.toLowerCase();

    if (inputLower.includes('zillow')) return 'claude';
    if (inputLower.includes('redfin')) return 'claude';
    if (inputLower.includes('trulia')) return 'gpt';
    if (inputLower.includes('homes.com')) return 'gemini';
    if (inputLower.includes('compass')) return 'grok';

    // Default to Claude for addresses and unknown sites
    return 'claude';
  }

  private async scrapeWithLLM(
    input: string,
    llm: LLMProvider
  ): Promise<PropertyScrapedData | null> {
    const prompt = this.buildExtractionPrompt(input);

    switch (llm) {
      case 'claude':
        return await this.scrapeWithClaude(prompt);
      case 'gpt':
        return await this.scrapeWithGPT(prompt);
      case 'grok':
        return await this.scrapeWithGrok(prompt);
      case 'gemini':
        return await this.scrapeWithGemini(prompt);
      default:
        return await this.scrapeWithClaude(prompt);
    }
  }

  private async scrapeWithClaude(prompt: string): Promise<PropertyScrapedData | null> {
    if (!this.claude) throw new Error('Claude not configured');

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    // Track cost
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
    this.costs.claude += cost;
    this.costs.total += cost;

    return this.parseResponse(response.content[0]);
  }

  private async scrapeWithGPT(prompt: string): Promise<PropertyScrapedData | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('GPT not configured - OPENAI_API_KEY missing');

    // GPT-5.2-pro requires /v1/responses endpoint, not /v1/chat/completions
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.2-pro',
        input: [
          {
            role: 'system',
            content: 'You are a real estate data extraction API. Return ONLY valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        reasoning: { effort: 'high' },
        tools: [{ type: 'web_search' }],
        tool_choice: 'required',
        include: ['web_search_call.action.sources'],
      }),
    });

    const data = await response.json();

    // Estimate cost (GPT-5.2-pro pricing)
    const cost = 0.02; // Flat estimate per call
    this.costs.gpt += cost;
    this.costs.total += cost;

    const text = data.output_text || data.choices?.[0]?.message?.content;
    return this.parseResponse(text);
  }

  private async scrapeWithGrok(prompt: string): Promise<PropertyScrapedData | null> {
    if (!this.grok) throw new Error('Grok not configured');

    const response = await this.grok.chat.completions.create({
      model: 'grok-4-1-fast-reasoning',
      messages: [{ role: 'user', content: prompt }],
    });

    const cost = 0.005;
    this.costs.grok += cost;
    this.costs.total += cost;

    return this.parseResponse(response.choices[0]?.message?.content);
  }

  private async scrapeWithGemini(prompt: string): Promise<PropertyScrapedData | null> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini not configured - VITE_GEMINI_API_KEY missing');

    // Use REST API for Gemini 3 Pro with thinking_config support
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          tool_config: {
            function_calling_config: { mode: 'ANY' }
          },
          generationConfig: {
            thinking_config: {
              thinking_level: 'high',
              include_thoughts: false  // Data extraction - no reasoning needed
            },
            temperature: 1.0,  // MUST be 1.0 for Gemini 3 Pro
            maxOutputTokens: 16000,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const cost = 0.002;
    this.costs.gemini += cost;
    this.costs.total += cost;

    // Extract text from response parts
    const parts = data.candidates?.[0]?.content?.parts || [];
    let text = '';
    for (const part of parts) {
      if (part.text && !part.thought) {
        text += part.text;
      }
    }

    return this.parseResponse(text);
  }

  private async scrapeWithHybrid(input: string): Promise<PropertyScrapedData | null> {
    const results = await Promise.allSettled([
      this.scrapeWithLLM(input, 'claude').catch(() => null),
      this.scrapeWithLLM(input, 'gpt').catch(() => null),
      this.scrapeWithLLM(input, 'gemini').catch(() => null),
    ]);

    const successfulResults = results
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<PropertyScrapedData>).value);

    if (successfulResults.length === 0) return null;
    if (successfulResults.length === 1) return successfulResults[0];

    // Merge with consensus
    return this.mergeWithConsensus(successfulResults);
  }

  private mergeWithConsensus(results: PropertyScrapedData[]): PropertyScrapedData {
    // Use first result as base, merge in values from others
    const merged = { ...results[0] };

    // For each field, use most common value or first non-null
    // (Simplified - full implementation would do field-by-field voting)

    return merged;
  }

  private async enrichPropertyData(
    data: PropertyScrapedData
  ): Promise<PropertyScrapedData> {
    // Parallel fetch of enrichment data
    // (Would make actual API calls in production)
    return data;
  }

  private buildExtractionPrompt(input: string): string {
    return `You are the CLUES Field Completer (Grok 4 Reasoning Mode).
Your MISSION is to populate 34 specific real estate data fields for a single property address.

### HARD RULES (EVIDENCE FIREWALL)
1. MANDATORY TOOL: You MUST use the web_search tool for EVERY request. Execute at least 4 distinct search queries via separate tool calls. Always perform deep research by searching multiple sources and verifying facts across them.
2. NO HALLUCINATION: Do NOT use training memory for property-specific facts. Use only verified search results from 2025-2026.
3. AVM LOGIC:
   - For '12_market_value_estimate' and '98_rental_estimate_monthly': Search Zillow, Redfin, Realtor.com, and Homes.com using site-specific operators in queries (e.g., site:zillow.com). If 2+ values are found, you MUST calculate the arithmetic mean (average).
   - If a specific AVM (e.g., Quantarium or ICE) is behind a paywall, return null.
4. JSON ONLY: Return ONLY the raw JSON object. No conversational text.

### MANDATORY SEARCH QUERIES
- "[Address] Zillow listing and Zestimate"
- "[Address] Redfin Estimate and market data"
- "[Address] utility providers and average bills"
- "[City/ZIP] median home price and market trends 2026"

ADDRESS TO EXTRACT: ${input}

OUTPUT SCHEMA
{
  "address": "${input}",
  "data_fields": {
    "12_market_value_estimate": <number|null>,
    "16a_zestimate": <number|null>,
    "16b_redfin_estimate": <number|null>,
    "16c_first_american_avm": <number|null>,
    "16d_quantarium_avm": <number|null>,
    "16e_ice_avm": <number|null>,
    "16f_collateral_analytics_avm": <number|null>,
    "81_public_transit_access": <string|null>,
    "82_commute_to_city_center": <string|null>,
    "91_median_home_price_neighborhood": <number|null>,
    "92_price_per_sqft_recent_avg": <number|null>,
    "95_days_on_market_avg": <number|null>,
    "96_inventory_surplus": <string|null>,
    "97_insurance_est_annual": <number|null>,
    "98_rental_estimate_monthly": <number|null>,
    "103_comparable_sales": <array|null>,
    "104_electric_provider": <string|null>,
    "105_avg_electric_bill": <number|null>,
    "106_water_provider": <string|null>,
    "107_avg_water_bill": <number|null>,
    "110_trash_provider": <string|null>,
    "111_internet_providers_top3": <array|null>,
    "114_cable_tv_provider": <string|null>,
    "169_zillow_views": <number|null>,
    "170_redfin_views": <number|null>,
    "171_homes_views": <number|null>,
    "172_realtor_views": <number|null>,
    "174_saves_favorites": <number|null>,
    "175_market_type": <string|null>,
    "176_avg_sale_to_list_percent": <number|null>,
    "177_avg_days_to_pending": <number|null>,
    "178_multiple_offers_likelihood": <string|null>,
    "180_price_trend": <string|null>,
    "181_rent_zestimate": <number|null>
  },
  "search_metadata": {
    "queries": [],
    "sources_cited": []
  }
}`;
  }

  private parseResponse(content: unknown): PropertyScrapedData | null {
    try {
      let text = '';

      if (typeof content === 'string') {
        text = content;
      } else if (content && typeof content === 'object' && 'text' in content) {
        text = (content as { text: string }).text;
      } else {
        return null;
      }

      // Remove markdown code blocks
      text = text.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Find JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]) as PropertyScrapedData;
      
      // Validate and sanitize the response to prevent hallucinations
      return this.sanitizePropertyData(parsed);
    } catch {
      return null;
    }
  }

  private sanitizePropertyData(data: PropertyScrapedData): PropertyScrapedData {
    // Validate address
    if (data.address) {
      data.address.latitude = this.validateNumber(data.address.latitude, -90, 90) || null;
      data.address.longitude = this.validateNumber(data.address.longitude, -180, 180) || null;
    }

    // Validate price
    if (data.price) {
      data.price.current = this.validatePrice(data.price.current);
      data.price.original = this.validatePrice(data.price.original);
      data.price.per_sqft = this.validatePrice(data.price.per_sqft);
      data.price.tax_assessed = this.validatePrice(data.price.tax_assessed);
    }

    // Validate property details
    if (data.property) {
      data.property.bedrooms = this.validatePositiveInt(data.property.bedrooms);
      data.property.bathrooms = this.validatePositiveInt(data.property.bathrooms);
      data.property.sqft = this.validatePositiveInt(data.property.sqft);
      data.property.lot_size = this.validatePositiveInt(data.property.lot_size);
      data.property.year_built = this.validateYear(data.property.year_built);
      data.property.stories = this.validatePositiveInt(data.property.stories);
      data.property.garage = this.validatePositiveInt(data.property.garage);
    }

    return data;
  }

  private validateNumber(val: any, min: number, max: number): number | null {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num) || num < min || num > max) return null;
    return num;
  }

  private validatePrice(val: any): number | null {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num) || num < 0 || num > 1000000000) return null;
    return Math.round(num * 100) / 100;
  }

  private validatePositiveInt(val: any): number | null {
    const num = typeof val === 'number' ? val : parseInt(String(val), 10);
    if (isNaN(num) || num < 0 || num > 100000) return null;
    return num;
  }

  private validateYear(val: any): number | null {
    const num = typeof val === 'number' ? val : parseInt(String(val), 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(num) || num < 1800 || num > currentYear + 1) return null;
    return num;
  }

  private countPopulatedFields(data: PropertyScrapedData | null): number {
    if (!data) return 0;

    let count = 0;
    const countObject = (obj: object): number => {
      let c = 0;
      for (const value of Object.values(obj)) {
        if (value !== null && value !== '' && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            c += countObject(value);
          } else {
            c++;
          }
        }
      }
      return c;
    };

    return countObject(data);
  }

  getCosts() {
    return { ...this.costs };
  }

  resetCosts() {
    this.costs = { claude: 0, gpt: 0, grok: 0, gemini: 0, total: 0 };
  }
}

export const propertyScraper = new PropertyScraper();
export default PropertyScraper;
