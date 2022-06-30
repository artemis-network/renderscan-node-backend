import { Request, Response } from 'express';
import { HttpResponseFactory } from '../../http/http_factory';
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
				return HttpResponseFactory.OK({ data: { images: files }, res: res })
			});

		} catch (e) {
			return HttpResponseFactory.INTERNAL_SERVER_ERROR({ data: { message: e }, res: res })
		}
	}

	static deleteImages = async (req: Request, res: Response) => {
		try {
			const { filename, username } = req.body
			const isDeleted: boolean = ImageServices.deleteUserFiles(filename, username)
			return HttpResponseFactory.OK({ data: { isDeleted: isDeleted }, res: res })

		} catch (e) {
			return HttpResponseFactory.INTERNAL_SERVER_ERROR({ data: { message: e }, res: res })
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
				return HttpResponseFactory.OK({ data: { isUploaded: true }, res: res });
			})

		} catch (e) {
			return HttpResponseFactory.INTERNAL_SERVER_ERROR({ data: { message: e }, res: res })
		}

	}

	static cutImage = async (req: Request, res: Response) => {
		if (!req.file)
			return HttpResponseFactory.INTERNAL_SERVER_ERROR({ data: { message: "empty image" }, res: res })

		const { username } = req.body
		console.log("username - " + username)
		const filePath = req.file.path
		try {
			const {currentCutFileName, respImg }:any = await ImageServices.cutImageService(username, filePath)
			return HttpResponseFactory.OK({ data: { filename: currentCutFileName, file: respImg }, res: res });
		} catch (e) {
			return HttpResponseFactory.INTERNAL_SERVER_ERROR({ data: { message: e }, res: res })
		}

	}

}