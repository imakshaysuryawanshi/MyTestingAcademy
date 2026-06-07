import { Request, Response } from 'express';
import { getSettings, saveSettings } from '../services/settingsService';

export const fetchSettings = (req: Request, res: Response) => {
    try {
        const settings = getSettings();
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSettings = (req: Request, res: Response) => {
    try {
        const newSettings = req.body;
        const updated = saveSettings(newSettings);
        res.json({ success: true, settings: updated });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
