import { Router } from 'express';
import { generate } from '../controllers/generationController';
import { fetchSettings, updateSettings } from '../controllers/settingsController';
import axios from 'axios';

const router = Router();

router.post('/generate', generate);
router.get('/settings', fetchSettings);
router.post('/settings', updateSettings);

router.post('/test-connection', async (req, res) => {
    try {
        const { provider, url } = req.body;
        if (provider === 'ollama' || provider === 'lmstudio') {
            // Basic reachability check
            await axios.get(url || 'http://localhost:11434');
            res.json({ success: true, message: "Local connection successful" });
        } else {
            res.json({ success: true, message: `${provider} configured` });
        }
    } catch(e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

export default router;
