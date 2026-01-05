/**
 * CLUES Property Dashboard - LLM Scraper Integration
 * Mirrors the existing CLUES Quantum App scraping tools
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  private gemini: GoogleGenerativeAI | null = null;

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

    if (import.meta.env.VITE_GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    }
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
    if (!this.gpt) throw new Error('GPT not configured');

    const response = await this.gpt.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a real estate data extraction API. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = (inputTokens * 0.01 + outputTokens * 0.03) / 1000;
    this.costs.gpt += cost;
    this.costs.total += cost;

    return this.parseResponse(response.choices[0]?.message?.content);
  }

  private async scrapeWithGrok(prompt: string): Promise<PropertyScrapedData | null> {
    if (!this.grok) throw new Error('Grok not configured');

    const response = await this.grok.chat.completions.create({
      model: 'grok-4.1-fast-reasoning',
      messages: [{ role: 'user', content: prompt }],
    });

    const cost = 0.005;
    this.costs.grok += cost;
    this.costs.total += cost;

    return this.parseResponse(response.choices[0]?.message?.content);
  }

  private async scrapeWithGemini(prompt: string): Promise<PropertyScrapedData | null> {
    if (!this.gemini) throw new Error('Gemini not configured');

    const model = this.gemini.getGenerativeModel({ model: 'gemini-3-pro-latest' });
    const result = await model.generateContent([{ text: prompt }]);
    const response = await result.response;

    const cost = 0.002;
    this.costs.gemini += cost;
    this.costs.total += cost;

    return this.parseResponse(response.text());
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
    const isUrl = input.startsWith('http');

    return `You are a real estate data extraction API. Extract property data ONLY if you have reliable information.
Your response MUST be valid JSON only with NO explanations or markdown.

${isUrl ? `For this listing URL, extract property data if available: ${input}. If you cannot access or verify the URL, respond with all null/empty values.` : `For this address, extract property data from your knowledge: ${input}. Only include data you are confident about.`}

CRITICAL RULES:
1. ONLY include data you are confident about - hallucinations will break the system
2. If uncertain about ANY value, use null for numbers or empty string "" for text
3. DO NOT guess or invent data - missing data is better than wrong data
4. Return EXACTLY this JSON structure with NO additional fields:
{"address":{"full_address":"","street":"","city":"","state":"","zip":"","county":"","latitude":null,"longitude":null},"price":{"current":null,"original":null,"per_sqft":null,"tax_assessed":null},"property":{"bedrooms":null,"bathrooms":null,"sqft":null,"lot_size":null,"year_built":null,"property_type":"","stories":null,"garage":null,"pool":false,"hoa":null},"listing":{"status":"","days_on_market":null,"mls_number":"","listing_agent":"","listing_brokerage":""}}

Return ONLY the JSON object, nothing else.`;
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
