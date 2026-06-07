import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

app.post('/api/generate', async (req, res) => {
  const { prompt, negativePrompt, model, type, steps, cfgScale, aspectRatio, settings, duration, loras } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`[GENERATION REQUEST] Model: ${model} | Type: ${type}`);
  if (loras && loras.length > 0) {
    console.log(`LoRAs active: ${loras.map((l: any) => `${l.name} (${l.weight})`).join(', ')}`);
    
    // Check for Civitai URLs
    loras.forEach((lora: any) => {
      if (lora.name.includes('civitai.com')) {
        console.log(`[Civitai Detect] Remote LoRA requested: ${lora.name}`);
        if (!settings?.civitai) {
          console.warn(`[Civitai Warn] No API Key provided in Settings. Restricted models may fail to download.`);
        }
      }
    });
  }
  
  let resultUrl = '';
  let id = Math.random().toString(36).substr(2, 9);

  try {
    // 1. Check for OpenAI Integration
    if (model.toLowerCase().includes('openai') && settings?.openai) {
      console.log('Using OpenAI DALL-E...');
      if (type === 'image') {
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
          prompt: prompt,
          n: 1,
          size: "1024x1024"
        }, {
          headers: { 'Authorization': `Bearer ${settings.openai}` }
        });
        resultUrl = response.data.data[0].url;
      }
    } 
    // 2. Check for Ollama (Local) Integration - Example: Prompt Refinement
    else if (model.toLowerCase().includes('ollama') && settings?.ollama) {
      console.log('Calling Ollama for prompt refinement...');
      try {
        const ollamaUrl = settings.ollama || 'http://localhost:11434';
        const response = await axios.post(`${ollamaUrl}/api/generate`, {
          model: "llama3", // Default model
          prompt: `Refine this image generation prompt for an uncensored AI model: "${prompt}". Just return the refined prompt, nothing else.`,
          stream: false
        });
        console.log('Ollama Refined Prompt:', response.data.response);
        // We still use mock image for now since Ollama is text-only
      } catch (e) {
        console.warn('Ollama call failed, using original prompt');
      }
    }

    // Fallback/Mock logic if no real URL was generated above
    if (!resultUrl) {
      if (type === 'image') {
        const seed = Math.floor(Math.random() * 1000000);
        resultUrl = `https://picsum.photos/seed/${seed}/1024/1024`;
      } else {
        // Dynamic Video Mocking based on keyword
        const videoLibrary = [
          { keyword: 'nature', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
          { keyword: 'ocean', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
          { keyword: 'tech', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
          { keyword: 'city', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
          { keyword: 'space', url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' }
        ];

        const match = videoLibrary.find(v => prompt.toLowerCase().includes(v.keyword));
        resultUrl = match ? match.url : videoLibrary[Math.floor(Math.random() * videoLibrary.length)].url;
      }
      
      // Artificial delay for mock
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    res.json({
      success: true,
      data: {
        id,
        url: resultUrl,
        prompt,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    });

  } catch (error: any) {
    console.error('Generation Detail Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error?.message || error.message || 'Failed to connect to provider' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
