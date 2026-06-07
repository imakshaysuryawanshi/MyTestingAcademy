import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(__dirname, '../../settings.json');

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

export const getSettings = (): ProviderSettings => {
    if (fs.existsSync(SETTINGS_FILE)) {
        try {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error("Error reading settings.json", error);
        }
    }
    return {
        ollamaUrl: "http://localhost:11434",
        lmStudioUrl: "http://localhost:1234/v1",
        activeProvider: "ollama",
        ollamaModel: "llama3"
    };
};

export const saveSettings = (newSettings: ProviderSettings): ProviderSettings => {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf-8');
    return updatedSettings;
};
