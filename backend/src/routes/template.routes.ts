import { Router } from 'express';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplate,
} from '../controllers/template.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.patch('/:id/toggle', toggleTemplate);

export default router;
