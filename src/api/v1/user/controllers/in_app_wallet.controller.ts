import { Request, Response } from 'express'

import { HttpFactory } from '../../http/http_factory'
import { Err, ErrorFactory, ErrorTypes } from '../../errors/error_factory'

import { RazorPayServices } from '../services/razor_pay.service'
import { InAppWalletServices } from '../services/in_app_wallet.service'

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
				return HttpFactory.STATUS_404_NOT_FOUND(err, res);
			}
			return HttpFactory.STATUS_404_NOT_FOUND(err, res);
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
				return HttpFactory.STATUS_404_NOT_FOUND(err, res);
			}
			return HttpFactory.STATUS_404_NOT_FOUND(err, res);
		}
	}

}


