import mongoose, { Schema, Model, Document, SchemaType } from 'mongoose';
import { USER_NAMING } from './user.model';

export interface RazorPayInterface {
	orderId?: string; paymentId?: string; signature?: string; notes?: string;
	createdAt?: Date, amount?: number, status?: string; description?: string;
	userId?: string
}

export interface RazorPayDoc extends RazorPayInterface, Document { }

const razorPaySchema = new Schema({
	userId: { type: Schema.Types.ObjectId, required: true, ref: USER_NAMING },
	orderId: { type: Schema.Types.String, required: true },
	createdAt: { type: Schema.Types.String, required: true },
	status: { type: Schema.Types.String, required: true },
	description: { type: Schema.Types.String, },
	notes: { type: Schema.Types.String, },
	amount: { type: Schema.Types.Number, required: true },
	paymentId: { type: Schema.Types.String },
	signature: { type: Schema.Types.String },
});

export class RazorPay {
	payment: RazorPayInterface;
	constructor(payment: RazorPayInterface) { this.payment = payment }
	setUserId(userId: RazorPayInterface["userId"]) {
		this.payment.userId = userId
		return this;
	}
	setOrderId(orderId: RazorPayInterface["orderId"]) {
		this.payment.orderId = orderId
		return this;
	}
	setNotes(notes: RazorPayInterface["notes"]) {
		this.payment.notes = notes
		return this;
	}
	setDescription(description: RazorPayInterface["description"]) {
		this.payment.description = description
		return this;
	}
	setCreatedAt(createdAt: RazorPayInterface["createdAt"]) {
		this.payment.createdAt = createdAt
		return this;
	}
	setStatus(status: RazorPayInterface["status"]) {
		this.payment.status = status
		return this;
	}
	setAmount(amount: RazorPayInterface["amount"]) {
		this.payment.amount = amount
		return this;
	}
	setPaymentId(paymentId: RazorPayInterface["paymentId"]) {
		this.payment.paymentId = paymentId
		return this;
	}
	setSignature(signature: RazorPayInterface["signature"]) {
		this.payment.signature = signature
		return this;
	}
	get() { return this.payment }
}

export const RAZORPAY_NAMING = "RAZORPAY";

export const RazorPayModel: Model<RazorPayDoc> = mongoose
	.model<RazorPayDoc>(RAZORPAY_NAMING, razorPaySchema);