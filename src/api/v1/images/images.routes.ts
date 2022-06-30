import express from 'express';
import multer from 'multer'

const router = express.Router();

// middleware 
import { authorizeUserMiddleWare } from '../middlewares/jwtTokenAuthenticator.middleware';
const upload = multer({dest: 'uploads/'});

// controllers
import { ImageController } from './controllers/image.controller';


import { imagePrefix } from '../config'


router.post(`${imagePrefix}/gallery`, ImageController.getGalleryImages);
router.post(`${imagePrefix}/delete`, ImageController.deleteImages);
router.post(`${imagePrefix}/save`, ImageController.saveImages);
router.post(`${imagePrefix}/cut`, upload.single('data'), ImageController.cutImage);

export { router as imageRoutes }