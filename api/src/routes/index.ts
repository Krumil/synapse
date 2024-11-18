import { Router } from 'express';
import { chatAgentHandler } from '../agent/agentController';
import { fetchAndSaveYields } from '../fetchYields';
const router = Router();

router.post('/chat', chatAgentHandler);

router.get('/trigger-data-fetch', async (req, res) => {
	try {
		await fetchAndSaveYields();
		res.json({ status: 'success' });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

export default router;
