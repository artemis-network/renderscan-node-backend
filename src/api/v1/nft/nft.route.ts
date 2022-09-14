import express from 'express';
import { nftsPrefix } from '../config';
import { NFTController } from './nft.controller';

const router = express.Router();

router.post(`${nftsPrefix}/mint`, NFTController.mintNFT)

export { router as nftRoutes }