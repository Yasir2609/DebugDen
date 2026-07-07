import express from 'express';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { uploadImage, deleteImage } from '../controllers/upload.controller.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('image'), uploadImage);
// Wildcard captures slash-containing Cloudinary public IDs (e.g. "debugden/filename")
router.delete('/*', deleteImage);

export default router;
