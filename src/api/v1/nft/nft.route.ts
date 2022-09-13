import express from 'express';
import multer from 'multer';
import { nftsPrefix } from '../config';

const router = express.Router();

router.post(`${nftsPrefix}/mint`)

export { router as nftRoutes }