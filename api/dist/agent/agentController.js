"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatAgentHandler = void 0;
const agentService_1 = require("./agentService");
const chatAgentHandler = async (req, res) => {
    try {
        console.log("Request received to start agent.");
        await (0, agentService_1.chat)(req.body.messages, req.body.address, res, req.body.existingMemory);
    }
    catch (error) {
        console.error("Error in chatAgentHandler:", error);
        res.status(500).json({ error: "An error occurred while processing the chat message." });
    }
};
exports.chatAgentHandler = chatAgentHandler;
