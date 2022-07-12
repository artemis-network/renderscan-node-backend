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
router.post(`${marketplacePrefix}/collectioninfofromslug`, MarketplaceController.getCollectionInfoFromSlug);
router.post(`${marketplacePrefix}/collectionnftsfromslug`, MarketplaceController.getCollectionNFTsFromSlug);
router.post(`${marketplacePrefix}/getshowcasenfts`, MarketplaceController.getShowcaseNFTs);
router.post(`${marketplacePrefix}/getnotablecollections`, MarketplaceController.getNotableCollectionInfo);


export { router as marketplaceRoutes }