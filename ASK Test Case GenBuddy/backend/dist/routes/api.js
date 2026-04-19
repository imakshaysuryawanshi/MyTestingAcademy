"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generationController_1 = require("../controllers/generationController");
const settingsController_1 = require("../controllers/settingsController");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
router.post('/generate', generationController_1.generate);
router.get('/settings', settingsController_1.fetchSettings);
router.post('/settings', settingsController_1.updateSettings);
router.post('/test-connection', async (req, res) => {
    try {
        const { provider, url } = req.body;
        if (provider === 'ollama' || provider === 'lmstudio') {
            // Basic reachability check
            await axios_1.default.get(url || 'http://localhost:11434');
            res.json({ success: true, message: "Local connection successful" });
        }
        else {
            res.json({ success: true, message: `${provider} configured` });
        }
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
exports.default = router;
