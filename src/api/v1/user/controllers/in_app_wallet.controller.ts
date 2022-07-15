import { Request, Response } from 'express'

import { classes } from '../../db'
import { DBObject } from '../../db_object'
import { Required } from '../../utils/required'
import { HttpFactory } from '../../http/http_factory'
import { Err, ErrorFactory, ErrorTypes } from '../../errors/error_factory'

import { RewardService } from '../services/reward.service'
import { RazorPayServices } from '../services/razor_pay.service'
import { InAppWalletServices } from '../services/in_app_wallet.service'

import { PAYMENT, PAYMENT_TYPE, TransactionInterface, } from '../models/transaction.model'
import { logger } from '../../utils/logger'

const { Transaction, RazorPay } = classes

export interface OrderDTO {
	amount: number; notes: string; currency: string; userId: string; id: string;
	paymentId: string; signature: string; recepit: string
}

export interface RewardDTO { userId: string, rewardId: string }
export interface WalletDto { walletId: string, }

export class InAppWalletController {

	// @desc get ruby balances
	// @route /renderscan/v1/wallets/balance
	// @access private
	static getBalance = async (req: Request, res: Response) => {
		try {
			const { userId } = req.body
			const { walletId } = await InAppWalletServices.getWallet(userId) as WalletDto;
			const resp = await RazorPayServices.getBalanceFromWalletId(walletId);
			return HttpFactory.STATUS_200_OK(resp, res);
		} catch (error) {
			const err = error as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
				throw ErrorFactory.OBJECT_NOT_FOUND("object doesnot exists")
			}
		}
	}

	// @desc get get transactions 
	// @route /renderscan/v1/wallets/transcations
	// @access private
	static getTranscations = async (req: Request, res: Response) => {
		try {
			const { userId } = req.body
			console.log(req.body)
			const { walletId } = await InAppWalletServices.getWallet(userId) as WalletDto;
			const resp = await RazorPayServices.getTranscations(walletId);
			return HttpFactory.STATUS_200_OK({ transactions: [...resp] }, res);
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
			const { amount, notes, userId, recepit } = new Required(req.body)
				.addKey("amount")
				.addKey("notes")
				.addKey("userId").getItems() as OrderDTO;
			try {
				const resp = await RazorPayServices.createOrder({
					amount: amount, currency: "INR", receipt: recepit, notes:
						{ key1: `${amount.toString()}, bought`, key2: notes }
				});
				logger.info(`>> create razorpay order, order_id : ${resp.id} << `)
				const razorpay = new RazorPay({})
					.setOrderId(resp.id)
					.setCreatedAt(new Date(resp.created_at))
					.setAmount(amount)
					.setDescription(`${amount.toString()}, bought`)
					.setNotes(notes)
					.setStatus(resp.status)
					.setUserId(userId)
					.setPaymentId("")
					.setSignature("").get();

				await RazorPayServices.createRazpayTranscation(razorpay);
				logger.info(`>> coping razorpay order into db, order_id : ${resp.id} << `)
				return HttpFactory.STATUS_200_OK({ ...resp }, res);
			}
			catch (err) {
				const e = err as Err;
				logger.error(`>> ${e} : something went wrong << `)
				return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e.message }, res);
			}
		} catch (e) {
			const err = e as Err;
			if (err.name == ErrorTypes.TYPE_ERROR) {
				logger.error(`>> ${e} : bad request << `)
				return HttpFactory.STATUS_400_BAD_REQUEST({ message: err.message }, res);
			}

			logger.error(`>> something went wrong << `)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: err.message }, res);
		}
	}

	// @desc successfully completing the order 
	// @route /renderscan/v1/orders/complete
	// @access public
	static completeOrder = async (req: Request, res: Response) => {
		try {
			const { amount, userId, id, paymentId, signature } = new Required(req.body)
				.addKey("amount")
				.addKey("notes")
				.addKey("paymentId")
				.addKey("signature")
				.addKey("userId").getItems() as OrderDTO;

			try {
				const razorPay = new DBObject(
					await RazorPayServices.updateAndGetTranscationByOrderId(id, paymentId, signature)
				).get()

				logger.error(`>> completing and updating the razorpay order, order_id : ${id} << `)

				const { walletId } = await InAppWalletServices.getWallet(userId) as WalletDto;
				const transcation = new Transaction({})
					.setAmount(amount)
					.setCreatedAt(new Date())
					.setDescription(`${amount.toString()}, bought`)
					.setWalletId(walletId)
					.setPaymentType(PAYMENT_TYPE.RAZOR_PAY)
					.setRazorPay(razorPay)
					.setPayment(PAYMENT.CREDIT)
					.get() as TransactionInterface;

				await InAppWalletServices.createTranascation(transcation);

				logger.error(`>> creating in app transcation, for order_id : ${id} << `)
				return HttpFactory.STATUS_200_OK({ message: "Transcation successfully" }, res)
			} catch (e) {
				const err = e as Err;
				if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR || err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
					logger.error(`>> order does not exist ,order_id : ${id} << `)
					return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
				}
			}

		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.TYPE_ERROR) {
				logger.error(`>> bad request : ${err.message} << `)
				return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
			}
			logger.error(`>> something went wrong : ${err.message} << `)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
		}
	}

	// @desc rewarding user  
	// @route /renderscan/v1/orders/rewards
	// @access public
	static rewardUser = async (req: Request, res: Response) => {
		try {
			const { rewardId, userId } = new Required(req.body)
				.addKey("userId")
				.addKey("rewardId").getItems() as RewardDTO;
			try {
				const { walletId } = await InAppWalletServices.getWallet(userId) as WalletDto;
				const reward = await RewardService.getRewardById(rewardId)
				logger.info(">> checking rewards <<")
				const transaction = new Transaction({})
					.setAmount(reward.amount)
					.setDescription(reward.description)
					.setPaymentType(PAYMENT_TYPE.REWARD)
					.setWalletId(walletId)
					.setCreatedAt(new Date())
					.setPayment(PAYMENT.CREDIT)
					.setRewardInfo(reward._id).get();
				logger.info(">> completing transaction <<")
				await InAppWalletServices.createTranascation(transaction);
				return HttpFactory.STATUS_200_OK({ message: "transction successfull" }, res)
			} catch (error) {
				const err = error as Err;
				if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
					err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
				) {
					logger.info(`reward not found with ${rewardId}`)
					return HttpFactory.STATUS_404_NOT_FOUND(`reward not found with ${rewardId}`, res);
				}
				throw error;
			}
		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.TYPE_ERROR) {
				logger.info(`invalid type input ${err.message}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(`bad request : ${err.message}`, res)
			}
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(`something went wrong : ${err.message}`, res)
		}
	}
}


