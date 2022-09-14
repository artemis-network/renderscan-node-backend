
import { stringMap } from 'aws-sdk/clients/backup';
import { Request, Response } from 'express'
import { HttpFactory } from '../http/http_factory';
import { logger } from '../utils/logger';
import { Required } from '../utils/required'
import { NFTServices } from './nft.services'


export class NFTController {
	// @desc mint near nft 
	// @route /renderscan/v1/nfts/mint
	// @access public
	static mintNFT = async (req: Request, res: Response) => {
		type input = { tokenId: stringMap, title: string, description: string, receiver_id: string, media: string }
		try {
			const { tokenId, title, description, receiver_id, media } = req.body as input;

			const resp = await NFTServices.mintNFT({ tokenId, title, description, receiver_id, media })
			console.log(resp)
			return HttpFactory.STATUS_200_OK(resp, res);
		} catch (err) {
			logger.error(err);
			return HttpFactory.STATUS_200_OK(err, res);
		}

	}

}