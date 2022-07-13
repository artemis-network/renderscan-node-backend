import mongoose, { Schema, Model, Document } from 'mongoose';

import { IN_APP_WALLET_NAMING } from './in_app_wallet.model';
import { RAZORPAY_NAMING } from './razorpay.model'
import { REWARD_NAMING } from './reward.model';

export interface TransactionDoc extends TransactionInterface, Document { }
export enum PAYMENT_TYPE { RAZOR_PAY = "RAZOR_PAY", REWARD = "REWARD", }
export enum PAYMENT { DEBIT = "DEBIT", CREDIT = "CREDIT", }
export interface TransactionInterface {
	amount?: number; description?: string; walletId?: string; paymentType?: PAYMENT_TYPE;
	razorPayInfo?: string; createdAt?: Date; rewardInfo?: string; payment?: PAYMENT
}
const TranscationSchema = new Schema({
	amount: { type: Schema.Types.Number, required: true },
	walletId: { type: Schema.Types.ObjectId, ref: IN_APP_WALLET_NAMING },
	createdAt: { type: Schema.Types.Date, default: new Date(), },
	description: { type: Schema.Types.String },
	paymentType: { type: Schema.Types.String, enum: [PAYMENT_TYPE.REWARD, PAYMENT_TYPE.RAZOR_PAY], required: true },
	razorPayInfo: { type: Schema.Types.ObjectId, ref: RAZORPAY_NAMING },
	rewardInfo: { type: Schema.Types.ObjectId, ref: REWARD_NAMING },
	payment: { type: Schema.Types.String, enum: [PAYMENT.DEBIT, PAYMENT.CREDIT], required: true },
});

export class Transaction {

	transcation: TransactionInterface;
	constructor(transaction: TransactionInterface) { this.transcation = transaction }
	setAmount(amount: TransactionInterface["amount"]) {
		this.transcation.amount = amount
		return this;
	}
	setRazorPay(razorPay: TransactionInterface["razorPayInfo"]) {
		this.transcation.razorPayInfo = razorPay
		return this;
	}
	setCreatedAt(createdAt: TransactionInterface["createdAt"]) {
		this.transcation.createdAt = createdAt
		return this;
	}
	setDescription(description: TransactionInterface["description"]) {
		this.transcation.description = description
		return this;
	}
	setRewardInfo(rewardInfo: TransactionInterface["rewardInfo"]) {
		this.transcation.rewardInfo = rewardInfo;
		return this;
	}
	setPaymentType(paymentType: TransactionDoc["paymentType"]) {
		this.transcation.paymentType = paymentType
		return this;
	}
	setPayment(payment: TransactionDoc["payment"]) {
		this.transcation.payment = payment;
		return this;
	}
	setWalletId(walletId: TransactionInterface["walletId"]) {
		this.transcation.walletId = walletId
		return this;
	}
	get() { return this.transcation; }
}

export const TRANSACTION_NAMING = "TRANSACTION"

export const TranscationModel: Model<TransactionDoc> = mongoose
	.model<TransactionDoc>(TRANSACTION_NAMING, TranscationSchema);