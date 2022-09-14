import cors from 'cors';
import express from 'express';

import { PORT } from './config';

import { json } from 'body-parser';
import { logger } from './api/v1/utils/logger';

import { pingRoutes } from './api/v1/main.route';
import { userRoutes } from './api/v1/user/user.routes'
import { paymentsRoutes } from './api/v1/user/payments.routes'
import { imageRoutes } from './api/v1/images/images.routes'
import { marketplaceRoutes } from './api/v1/marketplace/marketplace.routes'

import bodyParser from 'body-parser';
import { MarketplaceServices } from './api/v1/marketplace/services/marketplace.services';
import { feedbackRoutes } from './api/v1/feedback/feeback.route';

const app = express();

const init = async () => {
	logger.info(`🚀  server running on port: ${PORT}`)
}

app.use(cors())
app.use(json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/static", express.static("static"))

app.get('/', (req, res) => res.send("🚀  WELCOME TO RENDERVERSE"))

app.get('/warmup', async (req, res) => {
	await MarketplaceServices.searchCollectionsService("ape", 2);
	await MarketplaceServices.searchNFTService("ape", 2)
	await MarketplaceServices.getNotableCollectionService(2)
	return res.status(200).json({ "message": "warmed up!" })
})

app.use(pingRoutes);
app.use(userRoutes);
app.use(imageRoutes);
app.use(paymentsRoutes);
app.use(marketplaceRoutes);
app.use(feedbackRoutes)

app.listen(PORT, async () => await init());