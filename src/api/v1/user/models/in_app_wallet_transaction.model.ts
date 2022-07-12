import mongoose, { Schema, Model, Document } from 'mongoose';
import { InAppWalletPaymentInterface, IN_APP_PAYMENT_NAMING } from './in_app_payment.model';

import { InAppWalletInterface, IN_APP_WALLET_NAMING } from './in_app_wallet.model';

export interface InAppWalletTransactionInterface {
	paymentId: string | InAppWalletPaymentInterface; description: String; status: string;
	confirms: boolean; amount: number; netWorkFee: number;
	inAppWalletId: string | InAppWalletInterface
}

export interface InAppWalletTransactionDoc extends InAppWalletTransactionInterface, Document { }

export enum STATUS { IN_PROGRESS = "IN_PROGRESS", COMPLETED = "COMPLETED" }

const inAppWalletTranscationSchema = new Schema({
	paymentId: { type: Schema.Types.ObjectId, ref: IN_APP_PAYMENT_NAMING },
	status: {
		required: true,
		type: Schema.Types.String,
		enum: [STATUS.IN_PROGRESS, STATUS.IN_PROGRESS],
	},
	amount: { type: Schema.Types.Number, required: true },
	description: { type: Schema.Types.String },
	inAppWalletId: { type: Schema.Types.ObjectId, ref: IN_APP_WALLET_NAMING }
});

export class InAppWalletTranscation {

	transcation: InAppWalletTransactionInterface;
	constructor(transaction: InAppWalletTransactionInterface) { this.transcation = transaction }

	setPaymentId(paymentId: InAppWalletTransactionInterface["paymentId"]) {
		this.transcation.paymentId = paymentId
		return this;
	}
	setStatus(status: InAppWalletTransactionInterface["status"]) {
		this.transcation.status = status;
		return this;
	}
	setAmount(amount: InAppWalletTransactionInterface['amount']) {
		this.transcation.amount = amount;
		return this;
	}
	setDescription(description: InAppWalletTransactionInterface["description"]) {
		this.transcation.description = description
		return this;
	}
	setInAppWalletId(inAppWalletId: InAppWalletTransactionInterface["inAppWalletId"]) {
		this.transcation.inAppWalletId = inAppWalletId
		return this;
	}
	get() {
		return this.transcation;
	}
}

export const InAppWalletTranscationModel: Model<InAppWalletTransactionDoc> = mongoose
	.model<InAppWalletTransactionDoc>('IN_APP_WALLET_TRANSACTION', inAppWalletTranscationSchema);