// src/services/api.ts

export interface GenerateRequest {
  prompt: string;
  negativePrompt?: string;
  model: string;
  type: 'image' | 'video';
  steps?: number;
  cfgScale?: number;
  aspectRatio?: string;
  duration?: string;
  settings?: Record<string, string>;
  loras?: { name: string; weight: number }[];
}

export interface GenerationResponse {
  success: boolean;
  data: {
    id: string;
    url: string;
    prompt: string;
    type: 'image' | 'video';
    timestamp: string;
  };
  error?: string;
}

const API_BASE_URL = 'http://localhost:3005/api';

export const generateMedia = async (request: GenerateRequest): Promise<GenerationResponse> => {
  try {
    // Fetch settings from localStorage to pass to backend
    const savedSettings = localStorage.getItem('ai_generator_settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};

    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, settings })
    });

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      data: null as any,
      error: 'Failed to connect to backend server'
    };
  }
};
