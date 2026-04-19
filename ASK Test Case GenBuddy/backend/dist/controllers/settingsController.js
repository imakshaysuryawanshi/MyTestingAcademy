"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.fetchSettings = void 0;
const settingsService_1 = require("../services/settingsService");
const fetchSettings = (req, res) => {
    try {
        const settings = (0, settingsService_1.getSettings)();
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.fetchSettings = fetchSettings;
const updateSettings = (req, res) => {
    try {
        const newSettings = req.body;
        const updated = (0, settingsService_1.saveSettings)(newSettings);
        res.json({ success: true, settings: updated });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateSettings = updateSettings;
