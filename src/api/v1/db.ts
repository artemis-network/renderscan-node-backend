import mongoose from 'mongoose';

import { logger } from './utils/logger';

import { User, UserInterface, UserDoc, UserModel } from './user/models/user.model'
import { RazorPay, RazorPayInterface, RazorPayDoc, RazorPayModel, } from './user/models/razorpay.model';
import { InAppWallet, InAppWalletInterface, InAppWalletDoc, InAppWalletModel, } from './user/models/in_app_wallet.model'
import { Transaction, TransactionInterface, TransactionDoc, TranscationModel, } from './user/models/transaction.model'
import { Reward, RewardInterface, RewardDoc, RewardModel } from './user/models/reward.model'
import { Referal, ReferalInterface, ReferalDoc, ReferalModel } from './user/models/referal.model'
import { BlockChainWallet, BlockChainWalletInterface, BlockChainWalletDoc, BlockChainWalletModel } from './user/models/block_chain_wallet'
import { Notification, NotificationInterface, NotificationDoc, NotificationModel } from './user/models/notifiactions'
import { FeedBack, FeedBackDoc, FeedBackInterface, FeedBackModel } from './feedback/feedback.model'


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
	// Modals
	UserModel, InAppWalletModel, RazorPayModel, TranscationModel, ReferalModel,
	RewardModel, BlockChainWalletModel, NotificationModel, FeedBackModel
}

export const RUBY_VALUE_PER_ONE_INR = 100;

export const classes = {
	User, RazorPay, Transaction, InAppWallet, Reward, Referal, BlockChainWallet,
	Notification, FeedBack
}

export {
	// Types
	UserInterface, InAppWalletInterface, RazorPayInterface, TransactionInterface,
	ReferalInterface, RewardInterface, BlockChainWalletInterface, NotificationInterface,
	FeedBackInterface
}

export {
	// Docs
	UserDoc, InAppWalletDoc, RazorPayDoc, TransactionDoc, RewardDoc, ReferalDoc,
	BlockChainWalletDoc, NotificationDoc, FeedBackDoc
}
