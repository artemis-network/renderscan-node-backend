import { classes } from '../../db'

import { RazorPayDoc, RazorPayInterface, RazorPayModel } from '../models/razorpay.model'

const { Transaction, RazorPay } = classes

import { Razorpay as RP } from 'razorpay-typescript'

const instance = new RP({
	authKey: { key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' },
	headers: {},
})

interface RazorpayInterface {
	amount: number, notes: { key1: string, key2: string }, currency: string, receipt: string
}

export class RazorPayServices {
	static createOrder = async (razor_pay: RazorpayInterface) => {
		return instance.orders.create({
			amount: razor_pay.amount,
			currency: razor_pay.currency,
			receipt: razor_pay.receipt,
			notes: razor_pay.notes
		})
	}

	static createRazpayTranscation = async (razorPay: RazorPayInterface) => {
		await RazorPayModel.create(razorPay);
	}
	static updateAndGetTranscationByOrderId = async (orderId: string, paymentId: string, signature: string): Promise<any> => {
		const model = await RazorPayModel.findOne({ orderId: orderId })
		await model?.updateOne({
			$set: {
				paymentId: paymentId,
				signature: signature
			}
		});
		return model;
	}
}

