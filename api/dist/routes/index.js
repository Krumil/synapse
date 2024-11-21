"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agentController_1 = require("../agent/agentController");
const fetchYields_1 = require("../fetchYields");
const fetchTokens_1 = require("../fetchTokens");
const router = (0, express_1.Router)();
router.post('/chat', agentController_1.chatAgentHandler);
router.get('/trigger-data-fetch', async (req, res) => {
    try {
        await (0, fetchYields_1.fetchYields)();
        await (0, fetchTokens_1.fetchTokens)();
        res.json({ status: 'success' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
exports.default = router;
