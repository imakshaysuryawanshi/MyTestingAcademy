import { Request, Response } from 'express';
import { generateTestCase } from '../services/llmService';

export const generate = async (req: Request, res: Response) => {
    try {
        const { requirement, image } = req.body;
        if (!requirement && !image) {
            return res.status(400).json({ error: "Requirement or image is required" });
        }
        const result = await generateTestCase(requirement || "Generate test cases for this image.", image);
        res.json({ testCase: result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
