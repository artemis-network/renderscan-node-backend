import mongoose from 'mongoose';

import { logger } from './utils/logger';

import { User, UserDocument, UserType } from './user/models/user.model'
import { UserWallet, UserWalletDocument, UserWalletType } from './user/models/wallet.model'

import { RenderverseEmails, RenderverseEmailsDocument, } from './user/models/rendervers_emails.model'

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
	// email db
	RenderverseEmails,

	// User Modals
	User, UserWallet,
}

export {
	// User Types
	UserType, UserWalletType,
}

export {
	// Renderverse Emails
	RenderverseEmailsDocument,

	// User Docs
	UserDocument, UserWalletDocument,
}
