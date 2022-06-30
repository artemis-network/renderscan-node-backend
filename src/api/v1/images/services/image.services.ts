import aws from 'aws-sdk'
import { AWS_CREDS, IMAGE_CREDS } from '../../../../config'
import fs from 'fs'
import path from 'path'
import axios, { Axios, AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import FormData from 'form-data'
import Jimp from 'jimp'

export class ImageServices {

    static getAWSS3Object = () => {

        aws.config.update(
            {
                accessKeyId: AWS_CREDS.accessKeyId,
                secretAccessKey: AWS_CREDS.accessKey,
                region: 'ap-southeast-1'
            }
        );
        var s3 = new aws.S3();
        return s3;
    }

    static getS3ParamsToDowload = (username: string) => {
        var params = {
            Bucket: AWS_CREDS.container, /* required */
            Delimiter: '/',
            Prefix: username  // Can be your folder name
        };
        return params
    }

    static getS3ParamsToUpload = (filename: string, username: string) => {
        const filePath = path.join(IMAGE_CREDS.localImageFolderPath, username, filename)
        const key = username + "/" + filename
        const blob = fs.readFileSync(filePath)

        var params = {
            Bucket: AWS_CREDS.container,
            Key: key,
            Body: blob,
            ContentType: 'image/png'
        };
        return params
    }

    static constructUrl = (name: any) => {
        return `https://${AWS_CREDS.container}.s3.ap-south-1.amazonaws.com/${name}`
    }

    static deleteTempFiles = (currTime: string) => {
        const cutReceivedFileName = 'cut_received_'.concat(currTime).concat('.png')
        const cutMaskFileName = 'cut_mask_'.concat(currTime).concat('.png')
        const cutReceivedFilePath = path.join(process.cwd(), IMAGE_CREDS.localImageFolderPath, cutReceivedFileName)
        const cutMaskFilePath = path.join(process.cwd(), IMAGE_CREDS.localImageFolderPath, cutMaskFileName)

        if (fs.existsSync(cutReceivedFilePath)) {
            fs.unlinkSync(cutReceivedFilePath)
        }

        if (fs.existsSync(cutMaskFilePath)) {
            fs.unlinkSync(cutMaskFilePath)
        }
    }

    static deleteUserFiles = (filename: string, username: string) => {
        const filePath = path.join(IMAGE_CREDS.localImageFolderPath, username, filename)

        var isDeleted: boolean = false
        if (fs.existsSync(filePath)) {
            console.log('Deleting file at ' + filePath);
            fs.unlinkSync(filePath);
            isDeleted = true
        }
        else {
            console.log('File not found, so not deleting.');
        }
        return isDeleted;
    }

    static cutImageService = async (username: string, inputFilePath: any) => {

        if (!fs.existsSync(IMAGE_CREDS.localImageFolderPath)) {
            fs.mkdirSync(IMAGE_CREDS.localImageFolderPath);
        }
        if (!fs.existsSync(path.join(IMAGE_CREDS.localImageFolderPath,username))) {
            fs.mkdirSync(path.join(IMAGE_CREDS.localImageFolderPath,username));
        }

        const currTime = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(':', '_').replace(':', '_')
        const cutReceivedFileName = 'cut_received_'.concat(currTime).concat('.png')
        const currentCutFileName = 'current_Cut_'.concat(currTime).concat('.png')
        const cutMaskFileName = 'cut_mask_'.concat(currTime).concat('.png')
        const cutReceivedFilePath = path.join(process.cwd(), IMAGE_CREDS.localImageFolderPath, cutReceivedFileName)
        const currentCutFilePath = path.join(process.cwd(), IMAGE_CREDS.localImageFolderPath, username, currentCutFileName)
        const cutMaskFilePath = path.join(process.cwd(), IMAGE_CREDS.localImageFolderPath, cutMaskFileName)

        const src = fs.readFileSync(inputFilePath);
        fs.writeFileSync(cutReceivedFilePath, src);
        fs.unlinkSync(inputFilePath)
        console.log("received file for cut - " + cutReceivedFilePath)
        console.log('CUT Started')
        const cutReceivedFile = await Jimp.read(cutReceivedFilePath)
        const iWidth: number = cutReceivedFile.bitmap.width
        const iHeight: number = cutReceivedFile.bitmap.height
        console.log("dimesions of image = " + iWidth + "," + iHeight)

        console.log(' > sending to BASNET...')
        var data = new FormData();
        data.append('data', fs.createReadStream(cutReceivedFilePath));

        var requestConfig: AxiosRequestConfig = {
            method: 'post',
            responseType: 'arraybuffer',
            url: 'http://u2net-predictor.tenant-compass.global.coreweave.com',
            headers: {
                ...data.getHeaders()
            },
            data: data
        };
        
        const resp = await axios(requestConfig)
            .then(function (response) {
                return response
            })
            .catch(function (error) {
                console.log(error)
                return null
            });

        if (resp != null && resp.status == 200) {
            console.log(' > saving results...')
            const base64str = Buffer.from(resp.data, 'binary').toString('base64');
            const buffer = Buffer.from(base64str, 'base64');
            let mask = await Jimp.read(buffer)
            console.log(' > opening mask...')
            if (mask) {
                mask = mask.grayscale().resize(iWidth, iHeight, Jimp.RESIZE_BICUBIC)
                mask.writeAsync(cutMaskFilePath)
                console.log(' > compositing final image...')
                const ref = await Jimp.read(cutReceivedFilePath)
                const empty = new Jimp(iWidth,iHeight)
                const composite = ref.mask(mask, 0, 0)
                const scaled = composite.resize(composite.bitmap.width * 3, composite.bitmap.height * 3, Jimp.RESIZE_BICUBIC)
                scaled.writeAsync(currentCutFilePath)
                const respImg = await scaled.getBase64Async(scaled.getMIME())  
                this.deleteTempFiles(currTime)
                return {currentCutFileName, respImg}
            }
        }
        return
    }
}