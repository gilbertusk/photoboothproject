import { Router } from 'express';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplate,
} from '../controllers/template.controller';
import { authMiddleware, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware, requireOwner);

router.get('/', getTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.patch('/:id/toggle', toggleTemplate);

export default router;
