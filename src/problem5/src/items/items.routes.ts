import { Router } from 'express';
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  replaceItem,
  updateItem,
} from './items.controller.js';

// mounted at /api/items
const router = Router();

router.post('/', createItem);
router.get('/', listItems);
router.get('/:id', getItem);
router.put('/:id', replaceItem);
router.patch('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
