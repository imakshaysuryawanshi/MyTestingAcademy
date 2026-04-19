export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  image?: string;
}

export interface ProviderSettings {
    ollamaUrl?: string;
    lmStudioUrl?: string;
    groqApiKey?: string;
    openAiApiKey?: string;
    claudeApiKey?: string;
    geminiApiKey?: string;
    activeProvider?: string;
    ollamaModel?: string;
}
