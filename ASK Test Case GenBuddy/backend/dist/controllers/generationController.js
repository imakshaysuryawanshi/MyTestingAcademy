"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const llmService_1 = require("../services/llmService");
const generate = async (req, res) => {
    try {
        const { requirement } = req.body;
        if (!requirement) {
            return res.status(400).json({ error: "Requirement is required" });
        }
        const result = await (0, llmService_1.generateTestCase)(requirement);
        res.json({ testCase: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.generate = generate;
