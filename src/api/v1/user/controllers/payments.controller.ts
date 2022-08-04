
import { Request, Response } from 'express'

import { classes } from '../../db'
import { DBObject } from '../../db_object'
import { Required } from '../../utils/required'
import { HttpFactory } from '../../http/http_factory'
import { Err, ErrorTypes } from '../../errors/error_factory'

import { RewardService } from '../services/reward.service'
import { RazorPayServices } from '../services/razor_pay.service'
import { InAppWalletServices } from '../services/in_app_wallet.service'

import { PAYMENT, PAYMENT_TYPE, TransactionInterface, } from '../models/transaction.model'
import { logger } from '../../utils/logger'
import { Reward, RewardType } from '../models/reward.model'
import { UserServices } from '../services/user.service'
import { NotificationService } from '../services/notification.service'
import { has } from 'cheerio/lib/api/traversing'

const { Transaction, RazorPay } = classes

export class PaymentsController {

	// @desc init rewards
	// @route /renderscan/v1/payments/rewards/init
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
	// @route /renderscan/v1/payments/create
	// @access public
	static createOrder = async (req: Request, res: Response) => {
		type input = { amount: number, notes: string, userId: string, recepit: string }
		try {
			const { amount, notes, userId, recepit } = new Required(req.body)
				.addKey("amount")
				.addKey("notes")
				.addKey("userId").getItems() as input;
			console.log(req.body)
			try {
				const resp = await RazorPayServices.createOrder({
					amount: amount, currency: "INR", receipt: recepit, notes:
						{ key1: `${amount.toString()}, bought`, key2: notes }
				});
				console.log(resp)
				logger.info(`>> create razorpay order, order_id : ${resp.id} << `)
				const razorpay = new RazorPay({})
					.setOrderId(resp.id)
					.setCreatedAt(new Date(resp.created_at))
					.setAmount(amount)
					.setDescription(`Super Ruby purchase : ${amount.toString()}, `)
					.setNotes(notes)
					.setStatus(resp.status)
					.setUserId(userId)
					.setPaymentId("")
					.setSignature("").get();

				console.log(razorpay)
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
	// @route /renderscan/v1/payments/complete
	// @access public
	static completeOrder = async (req: Request, res: Response) => {
		type input = { walletId: string }
		type input_transcation = {
			amount: number; userId: string; id: string; paymentId: string; signature: string;
		}
		try {
			const { amount, userId, id, paymentId, signature } = new Required(req.body)
				.addKey("amount")
				.addKey("notes")
				.addKey("paymentId")
				.addKey("signature")
				.addKey("userId").getItems() as input_transcation;

			try {
				const razorPay = new DBObject(
					await RazorPayServices.updateAndGetTranscationByOrderId(id, paymentId, signature)
				).get()

				logger.info(`>> completing and updating the razorpay order, order_id : ${id} << `)

				const { walletId } = await InAppWalletServices.getWallet(userId) as input;
				const transcation = new Transaction({})
					.setAmount(amount)
					.setCreatedAt(new Date())
					.setDescription(`Super Ruby purchase : ${amount.toString()}`)
					.setWalletId(walletId)
					.setPaymentType(PAYMENT_TYPE.RAZOR_PAY)
					.setRazorPay(razorPay)
					.setPayment(PAYMENT.CREDIT)
					.get() as TransactionInterface;

				await InAppWalletServices.createTranascation(transcation);

				logger.info(`>> creating in app transcation, for order_id : ${id} << `);
				return HttpFactory.STATUS_200_OK({ message: "Transcation successfully" }, res);
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
	// @route /renderscan/v1/payments/rewards
	// @access public
	static rewardUser = async (req: Request, res: Response) => {
		type input = { rewardId: RewardType, userId: string }
		type input_wallet = { walletId: string }
		try {
			const { rewardId, userId } = new Required(req.body)
				.addKey("userId")
				.addKey("rewardId").getItems() as input;
			try {
				const { walletId } = await InAppWalletServices.getWallet(userId) as input_wallet;
				const reward = await RewardService.getRewardByType(rewardId)
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


	// @desc daily bonous rewarding user  
	// @route /renderscan/v1/payments/rewards/daily-bonous
	// @access private 
	static dailyBounous = async (req: Request, res: Response) => {
		const users = await UserServices.getVerifiedUsers()
		for (let i = 0; i < users.length; i++) {
			await NotificationService.sendNotificationToUser(users[i]._id, "Daily bonous", true, "Claim reward")
			this.paymentFun(users[i]._id, RewardType.DAILY);
		}
		return HttpFactory.STATUS_200_OK({ message: "daily bonous awareded all users" }, res)
	}


	// @desc payment notifications for user  
	// @route /renderscan/v1/payments/notifications/update
	// @access public 
	static sendRewardNotification = async (req: Request, res: Response) => {
		type input = { userId: string, hasNotification: boolean }
		try {
			const { userId, hasNotification } = new Required(req.body).getItems() as input;
			console.log(req.body)
			await NotificationService.sendNotificationToUser(userId, "", hasNotification, "")
			return HttpFactory.STATUS_200_OK({ message: "Daily rewward claimed" }, res)
		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.TYPE_ERROR) {
				logger.info(`invalid type input ${err.message}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(`bad request : ${err.message}`, res)
			}
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(`something went wrong : ${err.message}`, res)

		}
	}

	// @desc get notififactions  
	// @route /renderscan/v1/payments/notifications
	// @access public 
	static getNotificationsForUser = async (req: Request, res: Response) => {
		type input = { userId: string }
		try {
			const { userId } = new Required(req.body).getItems() as input;
			const { notification, hasNotification, message } = await NotificationService.checkForNotifications(userId)
			return HttpFactory.STATUS_200_OK({ notification, hasNotification, message }, res)
		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.TYPE_ERROR) {
				logger.info(`invalid type input ${err.message}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(`bad request : ${err.message}`, res)
			}
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(`something went wrong : ${err.message}`, res)

		}
	}

	// refactor later
	static paymentFun = async (userId: string, rewardId: RewardType) => {
		type input_wallet = { walletId: string }
		try {
			const { walletId } = await InAppWalletServices.getWallet(userId) as input_wallet;
			const reward = await RewardService.getRewardByType(rewardId)
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
		} catch (error) {
			const err = error as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			) {
				logger.info(`reward not found with ${rewardId}`)
			}
			throw error;
		}
	}


}