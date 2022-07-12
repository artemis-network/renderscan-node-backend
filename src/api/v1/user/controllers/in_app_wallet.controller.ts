import { Request, Response } from 'express'
import { InAppWalletServices } from '../services/in_app_wallet.service'
import { RazorPayServices } from '../services/razor_pay.servives'

import { classes } from '../../db'

import { PAYMENT_TYPE, TransactionInterface } from '../models/transaction.model'
import { Required } from '../../utils/required'
import { Err, ErrorTypes } from '../../errors/error_factory'
import { HttpFactory } from '../../http/http_factory'
const { Transaction, RazorPay } = classes

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


	static createOrder = async (req: Request, res: Response) => {
		try {
			const { amount, description, notes, userId, currency, } = new Required(req.body)
				.addKey("amount").addKey("description").addKey("notes")
				.addKey("currency").addKey("userId").getItems() as OrderInput;

			const resp = await RazorPayServices.createOrder({
				amount: amount, currency: currency, receipt: "",
				notes: { key1: description, key2: notes }
			});

			const razorpay = new RazorPay({})
				.setOrderId(resp.id).setCreatedAt(new Date(resp.created_at))
				.setAmount(amount).setDescription(description).setNotes(notes)
				.setStatus(resp.status).setUserId(userId).get();
			await RazorPayServices.createRazpayTranscation(razorpay);
			return resp
		} catch (e) {
			const err = e as Err;
			if (err.name == ErrorTypes.REQUIRED_ERROR) {
				return HttpFactory.STATUS_400_BAD_REQUEST({ message: err.message }, res);
			}
		}
	}

	static completeOrder = async (req: Request, res: Response) => {
		const { amount, description, notes, currency, walletId, orderId, paymentId, signature } = req.body;
		const razorPay: any = await RazorPayServices.updateAndGetTranscationByOrderId(orderId, paymentId, signature);
		const transcation = new Transaction({})
			.setAmount(amount)
			.setCreatedAt(new Date())
			.setDescription(description)
			.setWalletId(walletId)
			.setPaymentType(PAYMENT_TYPE.RAZOR_PAY)
			.setRazorPay(razorPay)
			.get() as TransactionInterface;
		await InAppWalletServices.createTranascation(transcation);
		return {
			message: "Transcation successfully"
		}
	}
}


export interface OrderInput {
	amount: number,
	description: string,
	notes: string,
	currency: string,
	userId: string
}
