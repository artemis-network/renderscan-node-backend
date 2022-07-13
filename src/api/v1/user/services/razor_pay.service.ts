import { db, RazorPayInterface, RazorPayDoc } from '../../db'

const { RazorPayModel } = db

import { Razorpay as RP } from 'razorpay-typescript'
import { Err, ErrorFactory, ErrorTypes } from '../../errors/error_factory'
import { DBObject } from '../../db_object'

const instance = new RP({
	authKey: { key_id: 'rzp_test_VmSch4maQMZS9L', key_secret: 'V18z4EipVdrQ9F7UK6Qokx2O' },
	headers: {},
})

interface RazorpayInterface {
	amount: number, notes: { key1: string, key2: string }, currency: string, receipt: string
}

export class RazorPayServices {
	static createOrder = async (razor_pay: RazorpayInterface) => {
		try {
			return await instance.orders.create({
				amount: Number(razor_pay.amount) * 100,
				currency: razor_pay.currency,
				receipt: razor_pay.receipt,
				notes: razor_pay.notes
			})
		} catch (error) {
			const err = error as Err;
			console.log(err);
			throw ErrorFactory.TYPE_ERROR(err.message);
		}
	}


	static createRazpayTranscation = async (razorPay: RazorPayInterface) => {
		try {
			await RazorPayModel.create(razorPay);
		} catch (error) {
			const err = error as Err;
			console.log(err)
			throw ErrorFactory.TYPE_ERROR(err.message);
		}
	}

	static updateAndGetTranscationByOrderId = async (
		orderId: string, paymentId: string, signature: string) => {
		try {
			const query = await RazorPayModel.findOne().where({ orderId: orderId }).exec()
			const payment = new DBObject(query).get() as RazorPayDoc;
			await payment.updateOne({
				$set: { paymentId: paymentId, signature: signature }
			});
			payment.save();
			return payment;
		} catch (error) {
			const err = error as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
				throw ErrorFactory.OBJECT_NOT_FOUND("object does not exist");
			}
		}
	}
}

