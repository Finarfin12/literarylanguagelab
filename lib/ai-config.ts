// lib/ai-config.ts
// Helper functions untuk membaca AI model config dari database

import { createClient } from '@/utils/supabase/server';

export interface AIModelConfig {
  provider: 'groq' | 'openai' | 'anthropic';
  model: string;
  temperature: number;
  max_tokens: number;
}

/**
 * Get AI model configuration untuk use case tertentu
 * @param useCase - 'default' | 'lookup' | 'translation' | 'generation' | 'tools'
 * @returns AI model configuration
 */
export async function getAIConfig(
  useCase: 'default' | 'lookup' | 'translation' | 'generation' | 'tools' = 'default'
): Promise<AIModelConfig> {
  try {
    const supabase = await createClient();
    const configKey = useCase === 'default' ? 'ai_model' : `ai_model_${useCase}`;
    
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', configKey)
      .single();
    
    if (error || !data) {
      console.warn(`Config not found for ${configKey}, using fallback`);
      return getFallbackConfig(useCase);
    }
    
    return data.value as AIModelConfig;
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return getFallbackConfig(useCase);
  }
}

/**
 * Fallback config kalau database query gagal
 */
function getFallbackConfig(useCase: string): AIModelConfig {
  const configs: Record<string, AIModelConfig> = {
    default: {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1500,
    },
    lookup: {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    },
    translation: {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1500,
    },
    generation: {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 2000,
    },
    tools: {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
    },
  };
  
  return configs[useCase] || configs.default;
}

/**
 * Check if a feature is enabled
 * @param featureName - nama fitur di config.features
 */
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'features')
      .single();
    
    if (error || !data) {
      return true; // Default: semua fitur enabled
    }
    
    return data.value[featureName] === true;
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return true;
  }
}

/**
 * Get rate limit config untuk use case tertentu
 */
export async function getRateLimit(
  useCase: 'lookup' | 'translation' | 'generation' | 'tools'
): Promise<{ requests_per_minute: number; requests_per_hour: number }> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'rate_limits')
      .single();
    
    if (error || !data) {
      return { requests_per_minute: 30, requests_per_hour: 500 }; // Default
    }
    
    return data.value[useCase] || { requests_per_minute: 30, requests_per_hour: 500 };
  } catch (error) {
    console.error('Error fetching rate limit:', error);
    return { requests_per_minute: 30, requests_per_hour: 500 };
  }
}

/**
 * Get API client instance berdasarkan provider
 */
export async function getAIClient(useCase?: 'lookup' | 'translation' | 'generation' | 'tools') {
  const config = await getAIConfig(useCase);
  
  switch (config.provider) {
    case 'groq': {
      const Groq = (await import('groq-sdk')).default;
      return new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    
    default:
      throw new Error(`Unsupported provider: ${config.provider}. Install the corresponding SDK package.`);
  }
}
