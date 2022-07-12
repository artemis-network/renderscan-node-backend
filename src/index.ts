import cors from 'cors';
import express from 'express';

import { PORT } from './config';

import { json } from 'body-parser';
import { logger } from './api/v1/utils/logger';

import { pingRoutes } from './api/v1/main.route';
import { userRoutes } from './api/v1/user/user.routes'
import { imageRoutes } from './api/v1/images/images.routes'
import { marketplaceRoutes } from './api/v1/marketplace/marketplace.routes'

import bodyParser from 'body-parser';

const app = express();

const init = () => logger.info(`🚀  server running on port: ${PORT}`)

app.use(cors())
app.use(json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send("🚀  WELCOME TO RENDERVERSE"))
app.use(pingRoutes);
app.use(userRoutes);
app.use(imageRoutes);
app.use(marketplaceRoutes);

app.listen(PORT, () => init());