import express from 'express';
import multer from 'multer'

const router = express.Router();

// middleware 
import { authorizeUserMiddleWare } from '../middlewares/jwtTokenAuthenticator.middleware';
const upload = multer({dest: 'uploads/'});

// controllers
import { MarketplaceController } from './controllers/marketplace.controller';


import { marketplacePrefix } from '../config'


router.post(`${marketplacePrefix}/trendingcollections`, MarketplaceController.getTrendingCollections);
router.post(`${marketplacePrefix}/collectioninfofromslug`, MarketplaceController.getCollectionInfoFromSlug);
router.post(`${marketplacePrefix}/collectionnftsfromslug`, MarketplaceController.getCollectionNFTsFromSlug);

export { router as marketplaceRoutes }