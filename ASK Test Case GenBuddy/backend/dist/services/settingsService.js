"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSettings = exports.getSettings = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SETTINGS_FILE = path_1.default.join(__dirname, '../../settings.json');
const getSettings = () => {
    if (fs_1.default.existsSync(SETTINGS_FILE)) {
        try {
            const data = fs_1.default.readFileSync(SETTINGS_FILE, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
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
exports.getSettings = getSettings;
const saveSettings = (newSettings) => {
    const currentSettings = (0, exports.getSettings)();
    const updatedSettings = { ...currentSettings, ...newSettings };
    fs_1.default.writeFileSync(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf-8');
    return updatedSettings;
};
exports.saveSettings = saveSettings;
