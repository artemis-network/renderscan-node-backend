import aws from 'aws-sdk'
import { AVATAR_PATH, AWS_CREDS, IMAGE_CREDS, ML_MODEL_IP } from '../../../../config'
import fs from 'fs'
import path from 'path'
import axios, { AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import Jimp from 'jimp'
import { spawn } from 'child_process'
import { Blob } from "buffer";

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

    static getAvatarFileToUpload = async (filename: string, filePath: string) => {
        try {
            const blob = fs.readFileSync(filePath)
            var params = {
                Bucket: AWS_CREDS.avatarContainer,
                Key: filename,
                Body: blob,
                ContentType: 'image/png'
            };
            return params
        } catch (error) {
            console.log(error)
            throw error;
        }
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

    static deleteAvatarFiles = (filePath: string) => {
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

    static spawnPythonProcess = async (cutReceivedFilePath: string, cutMaskFilePath: string, currentCutFilePath: string) => {
        const pythonProcess = spawn('python3', [
            path.join(
                process.cwd(), 'src', 'api', 'v1', 'images', 'process', 'composite.py'
            ), cutReceivedFilePath, cutMaskFilePath, currentCutFilePath]);
        let data = "";
        for await (const chunk of pythonProcess.stdout) {
            data += chunk;
        }
        let error = "";
        for await (const chunk of pythonProcess.stderr) {
            console.error('stderr chunk: ' + chunk);
            error += chunk;
        }
        const exitCode = await new Promise((resolve, reject) => {
            pythonProcess.on('close', resolve);
        });
        if (exitCode) {
            throw new Error(`subprocess error exit ${exitCode}, ${error}`);
        }
        return data;
    }

    static cutImageService = async (username: string, inputFilePath: any) => {
        if (!fs.existsSync(IMAGE_CREDS.localImageFolderPath)) {
            fs.mkdirSync(IMAGE_CREDS.localImageFolderPath);
        }
        if (!fs.existsSync(path.join(IMAGE_CREDS.localImageFolderPath, username))) {
            fs.mkdirSync(path.join(IMAGE_CREDS.localImageFolderPath, username));
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
            url: ML_MODEL_IP,
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
            let respImg = null
            if (mask) {
                mask.writeAsync(cutMaskFilePath)
                console.log(' > compositing final image...')
                try {
                    const pythonResp = await this.spawnPythonProcess(cutReceivedFilePath, cutMaskFilePath, currentCutFilePath)
                    console.log(pythonResp)
                    if (pythonResp.trim() == "True") {
                        console.log(' > cut finished...')
                        const currentCutImg = await Jimp.read(currentCutFilePath)
                        const respImg = await currentCutImg.getBase64Async(currentCutImg.getMIME())
                        this.deleteTempFiles(currTime)
                        return { currentCutFileName, respImg }
                    }
                }
                catch (e) {
                    this.deleteTempFiles(currTime)
                    throw e;
                }
            }
        }
        return
    }
}
