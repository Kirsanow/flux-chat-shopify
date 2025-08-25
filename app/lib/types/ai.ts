export type AIPersonality = "professional" | "friendly" | "casual";
export type AIProvider = "openai" | "anthropic";

export interface AIFeatures {
  upselling: boolean;
  inventoryAlerts: boolean;
  recommendations: boolean;
  giftSuggestions: boolean;
}

export interface AIConfig {
  personality: AIPersonality;
  provider: AIProvider;
  customInstructions: string;
  businessHours: string;
  features: AIFeatures;
  updatedAt?: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}