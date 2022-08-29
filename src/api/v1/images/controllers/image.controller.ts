import { Request, Response } from 'express';
import { ConnectionStates } from 'mongoose';
import { HttpFactory } from '../../http/http_factory';
import { UserServices } from '../../user/services/user.service';
import { ImageType, NFT } from '../model/nft_model';
import { ImageServices } from '../services/image.services'

export class ImageController {

	static getGalleryImages = async (req: Request, res: Response) => {
		try {
			const { username } = req.body
			const s3 = ImageServices.getAWSS3Object();
			const params = ImageServices.getS3ParamsToDowload(username)

			s3.listObjectsV2(params, function (err, data) {
				const files: any = []
				if (err) console.log(err, err.stack); // an error occurred
				else {
					data.Contents?.forEach(function (obj) {
						console.log(obj.Key)
						files.push(ImageServices.constructUrl(obj.Key))
					})
				}
				return HttpFactory.STATUS_200_OK({ images: files }, res)
			});

		} catch (e) {
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
		}
	}

	static deleteImages = async (req: Request, res: Response) => {
		try {
			const { filename, username } = req.body
			const isDeleted: boolean = ImageServices.deleteUserFiles(filename, username)
			return HttpFactory.STATUS_200_OK({ isDeleted: isDeleted }, res)

		} catch (e) {
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
		}
	}


	static saveImages = async (req: Request, res: Response) => {
		try {
			const { filename, username } = req.body
			const s3 = ImageServices.getAWSS3Object();
			const params = ImageServices.getS3ParamsToUpload(filename, username)
			const _id = await UserServices.getUserByUsername(username);
			s3.upload(params, async function (err: any, data: any) {
				if (err)
					console.log(err, err.stack); // an error occurred
				else {
					const nft = new NFT({
					})
						.setS3Url(data.Location)
						.setType(ImageType.SCANNED)
						.setUser(_id)
						.setName(filename)
						.setFilename(filename).get();

					await ImageServices.createNFT(nft)
					ImageServices.deleteUserFiles(filename, username)
				}
				return HttpFactory.STATUS_200_OK({ isUploaded: true }, res)
			})

		} catch (e) {
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
		}

	}

	static cutImage = async (req: Request, res: Response) => {
		if (!req.file)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: "empty image" }, res)

		const { username } = req.body
		console.log("username - " + username)
		const filePath = req.file.path
		try {
			const { currentCutFileName, respImg }: any = await ImageServices.cutImageService(username, filePath)
			return HttpFactory.STATUS_200_OK({ filename: currentCutFileName, file: respImg }, res)
		} catch (e) {
			console.log(e);
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
		}
	}

	static addBackground = async (req: Request, res: Response) => {
		if (!req.file)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: "empty image" }, res)

		const { username, background } = req.body
		console.log("username - " + username)
		const filePath = req.file.path
		try {
			const outputBuffer: any = await ImageServices.addBackgroundToImageService(filePath, background)
			return HttpFactory.STATUS_200_OK({ Image: outputBuffer }, res)
		} catch (e) {
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
		}
	}

	static saveGenerateImage = async (req: Request, res: Response) => {
		try {
			if (!req.file)
				return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: "empty image" }, res)

			const { username } = req.body;
			const filePath = req.file.path
			const resp = await ImageServices.saveGeneratedService(req.file.filename, filePath);

			console.log(req.body, filePath)

			const s3 = ImageServices.getAWSS3Object();

			const params = ImageServices.getGenerateImageS3ParamsToUpload(resp?.cutReceivedFilePath ?? "", resp?.cutReceivedFileName ?? "", username)
			const _id = await UserServices.getUserByUsername(username);
			s3.upload(params, async function (err: any, data: any) {
				if (err) {
					console.log(err); // an error occurred
				}
				else {
					// ImageServices.deleteUserFiles(filename, username)
					const nft = new NFT({
					})
						.setS3Url(data.Location)
						.setType(ImageType.GENERATED)
						.setUser(_id)
						.setName(req.file?.filename)
						.setFilename(req.file?.filename).get();

					await ImageServices.createNFT(nft)
				}
				return HttpFactory.STATUS_200_OK({ isUploaded: true }, res)
			})
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: "Something went wrong here" }, res);
		} catch (err) {
			console.log(err);
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: "Something went wrong" }, res);
		}
	}

}