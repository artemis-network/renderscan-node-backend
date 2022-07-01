import { Request, Response } from 'express';
import { HttpFactory } from '../../http/http_factory';
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

			s3.upload(params, function (err: any, data: any) {
				if (err)
					console.log(err, err.stack); // an error occurred
				else {
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
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: e }, res)
		}
	}

	static saveGenerateImage = async (req: Request, res: Response) => {

	}

}