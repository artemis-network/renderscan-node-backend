import { db, RazorPayInterface, RazorPayDoc } from '../../db'

const { RazorPayModel } = db

import { Razorpay as RP } from 'razorpay-typescript'
import { Err, ErrorFactory, ErrorTypes } from '../../errors/error_factory'
import { DBObject } from '../../db_object'
import { PAYMENT, PAYMENT_TYPE, TransactionInterface, TranscationModel } from '../models/transaction.model'
import { RAZOR_PAY } from '../../../../config'
import { RewardType } from '../models/reward.model'

const instance = new RP({
	authKey: { key_id: RAZOR_PAY.KEY_ID ?? "", key_secret: RAZOR_PAY.KEY_SECRET ?? "" },
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
			throw ErrorFactory.TYPE_ERROR(err.message);
		}
	}


	static createRazpayTranscation = async (razorPay: RazorPayInterface) => {
		try {
			await RazorPayModel.create(razorPay);
		} catch (error) {
			const err = error as Err;
			throw ErrorFactory.TYPE_ERROR(err.message);
		}
	}

	static updateAndGetTranscationByOrderId = async (
		orderId: string, paymentId: string, signature: string
	) => {
		try {
			const query = await RazorPayModel.findOne().where({ orderId: orderId }).exec()
			const payment = new DBObject(query).get() as RazorPayDoc;
			await payment.updateOne({
				$set: { paymentId: paymentId, signature: signature }
			});
			payment.save();
			return payment;
		} catch (error) {
			throw error;
		}
	}

	static getTranscations = async (walletId: string) => {
		try {
			return new DBObject(await TranscationModel.find().where({ walletId: walletId }).sort({ createdAt: -1 })).get();
		} catch (error) {
			throw error;
		}
	}

	static isUserAlreadyClaimedForSignupBonous = async (walletId: string) => {
		try {
			const transcations = new DBObject(
				await TranscationModel.find({ walletId: walletId }).where({ paymentType: PAYMENT_TYPE.REWARD }).populate('rewardInfo')
			).get() as any[];
			for (let i = 0; i < transcations.length; i++) {
				if (transcations[i].rewardInfo.type === RewardType.SIGNUP) return true
			}
			return false
		} catch (error) {
			console.log(error)
			throw error;
		}
	}

	static getBalanceFromWalletId = async (walletId: string) => {
		try {
			const transcations = await TranscationModel.find().where({ walletId: walletId }) as TransactionInterface[];
			let normalRubyDebits = 0; let normalRubyCredits = 0;
			let rewardDebits = 0; let rewardCredits = 0;
			transcations.forEach(({ amount, payment, paymentType, walletId }) => {
				if (payment === PAYMENT.CREDIT && paymentType === PAYMENT_TYPE.RAZOR_PAY)
					normalRubyCredits += amount ?? 0
				if (payment === PAYMENT.DEBIT && paymentType === PAYMENT_TYPE.RAZOR_PAY)
					normalRubyDebits += amount ?? 0
				if (payment === PAYMENT.CREDIT && paymentType === PAYMENT_TYPE.REWARD)
					rewardCredits += amount ?? 0
				if (payment === PAYMENT.DEBIT && paymentType === PAYMENT_TYPE.REWARD)
					rewardDebits += amount ?? 0
			});
			const ruby = normalRubyCredits - normalRubyDebits
			const rewards = rewardCredits - rewardDebits
			return { ruby: rewards, superRuby: ruby }
		} catch (error) {
			throw error;
		}
	}
}

