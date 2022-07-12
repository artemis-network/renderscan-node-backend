import mongoose, { Schema, Model, Document } from 'mongoose';

import { UserInterface, USER_NAMING } from './user.model';

export interface InAppWalletPaymentInterface {
	userId: string | UserInterface; orderId: string; amount: number; successUrl: string;
	failureUrl: string;
}

export interface InAppWalletPaymentDoc extends InAppWalletPaymentInterface, Document { }

const inAppWalletTranscationSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: USER_NAMING },
	orderId: { type: Schema.Types.String, required: true },
	amount: { type: Schema.Types.Number, required: true },
	successUrl: { type: Schema.Types.String },
	failureUrl: { type: Schema.Types.String },
});

export class InAppWalletTranscation {

	payment: InAppWalletPaymentInterface;

	constructor(payment: InAppWalletPaymentInterface) { this.payment = payment }

	setUserId(userId: InAppWalletPaymentInterface["userId"]) {
		this.payment.userId = userId
		return this;
	}

	setOrderId(orderId: InAppWalletPaymentInterface["orderId"]) {
		this.payment.orderId = orderId
		return this;
	}

	setAmount(amount: InAppWalletPaymentInterface['amount']) {
		this.payment.amount = amount;
		return this;
	}

	setSuccessUrl(successUrl: InAppWalletPaymentInterface["successUrl"]) {
		this.payment.successUrl = successUrl
		return this;
	}

	setFailureUrl(failureUrl: InAppWalletPaymentInterface["failureUrl"]) {
		this.payment.failureUrl = failureUrl;
		return this;
	}
	get() { return this.payment; }
}

export const IN_APP_PAYMENT_NAMING = "IN_APP_PAYMENT_NAMING";

export const InAppWalletTranscationModel: Model<InAppWalletPaymentDoc> = mongoose
	.model<InAppWalletPaymentDoc>(IN_APP_PAYMENT_NAMING, inAppWalletTranscationSchema);