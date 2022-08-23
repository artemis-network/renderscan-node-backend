import express from 'express';
import multer from 'multer'

const router = express.Router();

// middleware 
import { authorizeUserMiddleWare } from '../middlewares/jwtTokenAuthenticator.middleware';
const upload = multer({dest: 'uploads/'});

// controllers
import { MarketplaceController } from './controllers/marketplace.controller';


import { marketplacePrefix } from '../config'


router.post(`${marketplacePrefix}/gettrendingcollections`, MarketplaceController.getTrendingCollections);
router.post(`${marketplacePrefix}/updatetrendingcollections`, upload.single('data'), MarketplaceController.updateTrendingCollections);
router.post(`${marketplacePrefix}/getcollectioninfo`, MarketplaceController.getCollectionInfo);
router.post(`${marketplacePrefix}/getcollectionnfts`, MarketplaceController.getCollectionNFTs);
router.post(`${marketplacePrefix}/getNFTListings`, MarketplaceController.getNFTListings);
router.post(`${marketplacePrefix}/getNFTOffers`, MarketplaceController.getNFTOffers);
router.post(`${marketplacePrefix}/getnftinfo`, MarketplaceController.getNFTInfo);
router.post(`${marketplacePrefix}/getshowcasenfts`, MarketplaceController.getShowcaseNFTs);
router.post(`${marketplacePrefix}/getnotablecollections`, MarketplaceController.getNotableCollectionInfo);
router.post(`${marketplacePrefix}/searchcollections`, MarketplaceController.searchCollections);
router.post(`${marketplacePrefix}/searchnfts`, MarketplaceController.searchNFTs);

export { router as marketplaceRoutes }