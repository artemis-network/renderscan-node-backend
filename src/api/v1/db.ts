import mongoose from 'mongoose';

import { logger } from './utils/logger';

import { User, UserInterface, UserDoc, UserModel } from './user/models/user.model'
import { RazorPay, RazorPayInterface, RazorPayDoc, RazorPayModel, } from './user/models/razorpay.model';
import { InAppWallet, InAppWalletInterface, InAppWalletDoc, InAppWalletModel, } from './user/models/in_app_wallet.model'
import { Transaction, TransactionInterface, TransactionDoc, TranscationModel, PAYMENT_TYPE } from './user/models/transaction.model'


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
	UserModel, InAppWalletModel, RazorPayModel, TranscationModel
}

export const RUBY_VALUE_PER_ONE_INR = 100;

export const classes = {
	User,
	RazorPay,
	Transaction,
	InAppWallet,
}

export {
	// User Types
	UserInterface, InAppWalletInterface, RazorPayInterface, TransactionInterface
}

export {
	// User Docs
	UserDoc, InAppWalletDoc, RazorPayDoc, TransactionDoc
}
