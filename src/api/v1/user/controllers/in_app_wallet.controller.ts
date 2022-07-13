import { Request, Response } from 'express'
import { InAppWalletServices } from '../services/in_app_wallet.service'
import { RazorPayServices } from '../services/razor_pay.service'

import { classes } from '../../db'

import { PAYMENT, PAYMENT_TYPE, TransactionInterface, } from '../models/transaction.model'
import { Required } from '../../utils/required'
import { Err, ErrorFactory, ErrorTypes } from '../../errors/error_factory'
import { HttpFactory } from '../../http/http_factory'
import { DBObject } from '../../db_object'
import { RewardService } from '../services/reward.service'
const { Transaction, RazorPay } = classes

export interface OrderInput {
	amount: number; description: string; notes: string; currency: string;
	userId: string; id: string; paymentId: string; signature: string
	recepit: string
}

export class InAppWalletController {

	static getWallet = async (req: Request, res: Response) => {
		const { userId } = req.body
		const result = await InAppWalletServices.getBalance(userId)
		return res.status(200).json(result)
	}


	static depositFunds = async (req: Request, res: Response) => {
		const { userId, amount, password } = req.body
		if (password === "password@1234") {
			const result = await InAppWalletServices.depositFunds(userId, amount);
			return res.status(200).json(result)
		}
		return res.status(200).json({ message: "invalid password", error: true })
	}

	// @desc get ruby balances
	// @route /renderscan/v1/wallets/balance
	// @access private
	static getBalance = async (req: Request, res: Response) => {
		try {
			const { userId } = req.body
			const { walletId } = InAppWalletServices.getWallet(userId) as any;


		} catch (error) {
			const err = error as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
				throw ErrorFactory.OBJECT_NOT_FOUND("object doesnot exists")
			}
		}
	}

	// @desc init rewards
	// @route /renderscan/v1/orders/rewards/init
	// @access private
	static initRewards = async (req: Request, res: Response) => {
		try {
			await RewardService.initRewards();
			return HttpFactory.STATUS_200_OK({ message: "Successfully initiazlied" }, res)
		} catch (e) {
			const err = e as Err;
			if (err.name == ErrorTypes.TYPE_ERROR)
				return HttpFactory.STATUS_400_BAD_REQUEST({ message: err.message }, res);
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: err.message }, res);
		}
	}

	// @desc creating new order 
	// @route /renderscan/v1/orders/create
	// @access public
	static createOrder = async (req: Request, res: Response) => {
		try {
			const { amount, description, notes, userId, currency, recepit } = new Required(req.body)
				.addKey("amount")
				.addKey("description")
				.addKey("notes")
				.addKey("currency")
				.addKey("userId").getItems() as OrderInput;

			try {
				const resp = await RazorPayServices.createOrder({
					amount: amount, currency: currency, receipt: recepit, notes:
						{ key1: description, key2: notes }
				});
				const razorpay = new RazorPay({})
					.setOrderId(resp.id)
					.setCreatedAt(new Date(resp.created_at))
					.setAmount(amount)
					.setDescription(description)
					.setNotes(notes)
					.setStatus(resp.status)
					.setUserId(userId)
					.setPaymentId("")
					.setSignature("").get();

				await RazorPayServices.createRazpayTranscation(razorpay);
				return HttpFactory.STATUS_200_OK({ ...resp }, res);
			}
			catch (err) {
				const e = err as Err;
				return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e.message }, res);
			}
		} catch (e) {
			const err = e as Err;
			if (err.name == ErrorTypes.TYPE_ERROR)
				return HttpFactory.STATUS_400_BAD_REQUEST({ message: err.message }, res);
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: err.message }, res);
		}
	}

	// @desc successfully completing the order 
	// @route /renderscan/v1/orders/complete
	// @access public
	static completeOrder = async (req: Request, res: Response) => {
		try {
			const { amount, description, userId, id, paymentId, signature } = new Required(req.body)
				.addKey("amount")
				.addKey("description")
				.addKey("notes")
				.addKey("currency")
				.addKey("userId").getItems() as OrderInput;

			const razorPay = new DBObject(
				RazorPayServices.updateAndGetTranscationByOrderId(id, paymentId, signature)
			).get()

			const { walletId } = await InAppWalletServices.getWallet(userId)
			const transcation = new Transaction({})
				.setAmount(amount)
				.setCreatedAt(new Date())
				.setDescription(description)
				.setWalletId(walletId)
				.setPaymentType(PAYMENT_TYPE.RAZOR_PAY)
				.setRazorPay(razorPay)
				.setPayment(PAYMENT.CREDIT)
				.get() as TransactionInterface;

			await InAppWalletServices.createTranascation(transcation);
			return HttpFactory.STATUS_200_OK({ message: "Transcation successfully" }, res)
		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR || err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
				return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
			}
			if (err.name === ErrorTypes.TYPE_ERROR) {
				return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
			}
		}
		finally {
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR("something went wrong", res);
		}
	}

	// @desc rewarding user  
	// @route /renderscan/v1/orders/rewards
	// @access public
	static rewardUser = async (req: Request, res: Response) => {
		try {
			const { rewardId, userId } = new Required(req.body)
				.addKey("userId")
				.addKey("rewardId").getItems() as any;
			try {
				const { walletId } = InAppWalletServices.getWallet(userId) as any
				const reward = await RewardService.getRewardById(rewardId._id)
				const transaction = new Transaction({})
					.setAmount(reward.amount)
					.setDescription(reward.description)
					.setPaymentType(PAYMENT_TYPE.REWARD)
					.setWalletId(walletId)
					.setCreatedAt(new Date())
					.setPayment(PAYMENT.CREDIT)
					.setRewardInfo(reward._id).get();
				await InAppWalletServices.createTranascation(transaction);
				return HttpFactory.STATUS_200_OK({ message: "transction successfull" }, res)
			} catch (error) {
				const err = error as Err;
				if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
					err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
				) return HttpFactory.STATUS_404_NOT_FOUND("object not found", res)
			}
		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			) return HttpFactory.STATUS_400_BAD_REQUEST("bad request", res)
		} finally {
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR("something went wrong", res)
		}
	}
}


