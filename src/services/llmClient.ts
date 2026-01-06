/**
 * LLM Client Service
 * Unified client for Perplexity (web search) and Claude Opus (reasoning)
 * Used by the two-stage CMA schema orchestrator
 */

export interface LlmCallParams {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmResponse {
  success: boolean;
  data: any | null;
  error?: string;
}

/**
 * Call Perplexity API with web search capabilities
 * Used for micro-prompts (WalkScore, Schools, Crime, Climate, Utilities, ISP)
 */
export async function callPerplexity(params: LlmCallParams): Promise<LlmResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.error('[Perplexity] API key not set');
    return { success: false, data: null, error: 'PERPLEXITY_API_KEY not set' };
  }

  try {
    console.log('[Perplexity] Calling API...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.user }
        ],
        temperature: params.temperature ?? 0.1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Perplexity] API error:', response.status, data);
      return { success: false, data: null, error: `HTTP ${response.status}` };
    }

    if (data.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content;
      console.log('[Perplexity] Raw response (first 500 chars):', text.substring(0, 500));

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('[Perplexity] JSON parsed successfully, fields:', Object.keys(parsed).length);
          return { success: true, data: parsed };
        } catch (parseError) {
          console.error('[Perplexity] JSON parse error:', parseError);
          return { success: false, data: null, error: 'Failed to parse JSON response' };
        }
      } else {
        console.error('[Perplexity] No JSON found in response');
        return { success: false, data: null, error: 'No JSON in response' };
      }
    } else {
      console.error('[Perplexity] No content in response');
      return { success: false, data: null, error: 'No content in response' };
    }
  } catch (error) {
    console.error('[Perplexity] Error:', error);
    return { success: false, data: null, error: String(error) };
  }
}

/**
 * Call Claude Opus API without web search
 * Used for core schema normalizer (pure reasoning, no hallucination)
 */
export async function callClaudeOpus(params: LlmCallParams): Promise<LlmResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('[Claude Opus] API key not set');
    return { success: false, data: null, error: 'ANTHROPIC_API_KEY not set' };
  }

  try {
    console.log('[Claude Opus] Calling API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: params.maxTokens ?? 8000,
        temperature: params.temperature ?? 0.1,
        system: params.system,
        messages: [{ role: 'user', content: params.user }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Claude Opus] API error:', response.status, data);
      return { success: false, data: null, error: `HTTP ${response.status}` };
    }

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      console.log('[Claude Opus] Raw response (first 500 chars):', text.substring(0, 500));

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('[Claude Opus] JSON parsed successfully, fields:', Object.keys(parsed).length);
          return { success: true, data: parsed };
        } catch (parseError) {
          console.error('[Claude Opus] JSON parse error:', parseError);
          return { success: false, data: null, error: 'Failed to parse JSON response' };
        }
      } else {
        console.error('[Claude Opus] No JSON found in response');
        return { success: false, data: null, error: 'No JSON in response' };
      }
    } else {
      console.error('[Claude Opus] No content in response');
      return { success: false, data: null, error: 'No content in response' };
    }
  } catch (error) {
    console.error('[Claude Opus] Error:', error);
    return { success: false, data: null, error: String(error) };
  }
}

/**
 * Unified LLM client used by orchestrator
 * Automatically selects Perplexity for web search, Claude Opus for reasoning
 *
 * @param params - LLM call parameters
 * @param useWebSearch - true for Perplexity (micro-prompts), false for Claude Opus (core schema)
 */
export async function callLlm(
  params: LlmCallParams,
  options?: { useWebSearch?: boolean }
): Promise<any> {
  const useWebSearch = options?.useWebSearch ?? true; // Default to Perplexity for micro-prompts

  const response = useWebSearch
    ? await callPerplexity(params)
    : await callClaudeOpus(params);

  if (!response.success) {
    console.error('[LLM Client] Call failed:', response.error);
    throw new Error(`LLM call failed: ${response.error}`);
  }

  return response.data;
}
