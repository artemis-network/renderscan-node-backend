import mongoose from 'mongoose';

import { logger } from './utils/logger';

import { User, UserInterface, UserDoc, UserModel } from './user/models/user.model'
import { InAppWallet, InAppWalletInterface, InAppWalletDoc, InAppWalletModel } from './user/models/wallet.model'

import { MONGO_DB_URL } from '../../config'

mongoose
	.connect(MONGO_DB_URL, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, })
	.then(() => logger.info("🚀  Database connection initialized..."))
	.catch((err) => logger.error("👉  Database connection failed... " + err))

mongoose.connection
	.on('open', () => logger.info('🚀  Database connected Successfully'))
	.on('error', (err) => logger.error("👉  Error" + err))
	.on('disconnected', () => logger.warn('🚨  Database disconnected...'));

export const db = {
	mongoose,
	// User Modals
	UserModel, InAppWalletModel
}

export const classes = {
	User,
	InAppWallet
}

export {
	// User Types
	UserInterface, InAppWalletInterface,
}

export {
	// User Docs
	UserDoc, InAppWalletDoc,
}
