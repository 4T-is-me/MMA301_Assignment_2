/**
 * Author: trangtttce191027
 */

import express from 'express';
import { recommendProducts } from '../controllers/recommendationController.js';

const router = express.Router();

router.post('/', recommendProducts);

export const recommendationRoutes = {
    router
}
