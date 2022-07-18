import { Request, Response } from 'express'

import { logger } from '../../utils/logger'
import { Required } from '../../utils/required'
import { HttpFactory } from '../../http/http_factory'
import { Err, ErrorTypes } from '../../errors/error_factory'

import { RazorPayServices } from '../services/razor_pay.service'
import { InAppWalletServices } from '../services/in_app_wallet.service'

export class InAppWalletController {

	// @desc get ruby balances
	// @route /renderscan/v1/wallets/balance
	// @access private
	static getBalance = async (req: Request, res: Response) => {
		type input = { userId: string }
		type wallet_input = { walletId: string }
		try {
			const { userId } = new Required(req.body).addKey("userId").getItems() as input;
			const { walletId } = await InAppWalletServices.getWallet(userId) as wallet_input;
			const resp = await RazorPayServices.getBalanceFromWalletId(walletId);
			return HttpFactory.STATUS_200_OK(resp, res);
		} catch (error) {
			const err = error as Err;
			if (
				err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			) {
				logger.error(`object not found : ${err}`)
				return HttpFactory.STATUS_404_NOT_FOUND(err, res);
			}
			if (err.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`bad request : ${err}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
			}
			logger.error(`internal server error : ${err}`)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
		}
	}

	// @desc get get transactions 
	// @route /renderscan/v1/wallets/transcations
	// @access private
	static getTranscations = async (req: Request, res: Response) => {
		type input = { userId: string }
		type wallet_input = { walletId: string }
		try {
			const { userId } = new Required(req.body).addKey("userId").getItems() as input;
			const { walletId } = await InAppWalletServices.getWallet(userId) as wallet_input;
			const resp: any = await RazorPayServices.getTranscations(walletId);
			return HttpFactory.STATUS_200_OK({ transactions: resp }, res);
		} catch (error) {
			const err = error as Err;
			if (
				err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			) {
				logger.error(`object not found : ${err}`)
				return HttpFactory.STATUS_404_NOT_FOUND(err, res);
			}
			if (err.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`bad request : ${err}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
			}
			logger.error(`internal server error : ${err}`)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
		}
	}

}


