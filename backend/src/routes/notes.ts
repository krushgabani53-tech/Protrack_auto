import { Router } from 'express';
import { getNote, saveNote } from '../controllers/notes.js';
import { authenticateRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateRequest);
router.get('/', getNote);
router.post('/', saveNote);

export default router;
