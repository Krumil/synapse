import { Request, Response } from 'express';
import { chat } from './agentService';

export const chatAgentHandler = async (req: Request, res: Response) => {
	try {
		console.log("Request received to start agent.");
		await chat(req.body.messages, req.body.address, res, req.body.existingMemory);
	} catch (error) {
		console.error("Error in chatAgentHandler:", error);
		res.status(500).json({ error: "An error occurred while processing the chat message." });
	}
};

