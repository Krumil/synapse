import { Router } from 'express';
import { chatAgentHandler } from '../agent/agentController';

const router = Router();

router.post('/chat', chatAgentHandler);

export default router;
