import { Router } from 'express';
import { chatAgentHandler } from '../agent/agentController';
import { fetchYields } from '../fetchYields';
import { fetchTokens } from '../fetchTokens';
const router = Router();

router.post('/chat', chatAgentHandler);

router.get('/trigger-data-fetch', async (req, res) => {
	try {
		await fetchYields();
		await fetchTokens();
		res.json({ status: 'success' });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

export default router;
