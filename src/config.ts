import 'dotenv/config'

const ADMIN = {
	username: process.env.ADMIN_USERNAME || "",
	email: process.env.ADMIN_EMAIL || "",
	password: process.env.ADMIN_PASSWORD || ""
}

const EMAIL_CONFIG = {
	username: process.env.EMAIL_AUTH_USER || "",
	password: process.env.EMAIL_AUTH_PASSWORD || "",
	port: process.env.EMAIL_VERIFICATION_PORT || 25,
	host: process.env.EMAIL_VERIFICATION_HOST || "",
	email: process.env.EMAIL_VERIFICATION_EMAIL || "",
}

const JWT_SECRET = process.env.JWT_SECRET || ""
const GOOGLE_OAUTH_CLIENT = process.env.GOOGLE_OUTH_CLIENT_CREDENTIAL || ""
const MONGO_DB_URL = process.env.MONGO_DB_URL || ""
const PORT = process.env.PORT || 5000

const AWS_CREDS = {
	container: process.env.AWS_S3_CONTAINER || "",
	avatarContainer: process.env.AWS_S3_AVATAR_CONTAINER || "",
	accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
	accessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
}

const IMAGE_CREDS = {
	ml_model_ip: process.env.ML_MODEL_IP || "",
	localImageFolderPath: process.env.LOCAL_IMAGE_FOLDER_PATH || "",
}

const API_ADMIN_PASSWORD = process.env.API_ADMIN_PASSWORD || ""
const USER_AGENT = process.env.USER_AGENT || ""
const LOCAL_DATA_FOLDER_PATH = process.env.LOCAL_DATA_FOLDER_PATH || ""
const LOCAL_SLUGS_FOLDER_PATH = process.env.LOCAL_SLUGS_FOLDER_PATH || ""
const ML_MODEL_IP = process.env.ML_MODEL_IP
const BLOCKDAEMON_API_KEY = process.env.BLOCKDAEMON_API_KEY
const NFTPORT_API_KEY = process.env.NFTPORT_API_KEY


const RAZOR_PAY = {
	KEY_ID: process.env.RAZOR_PAY_KEY_ID,
	KEY_SECRET: process.env.RAZOR_PAY_KEY_SECRET,
}

const AVATAR_PATH = process.env.AVATAR_PATH ?? ""

export {
	PORT,
	ADMIN,
	RAZOR_PAY,
	JWT_SECRET,
	AVATAR_PATH,
	MONGO_DB_URL,
	EMAIL_CONFIG,
	API_ADMIN_PASSWORD,
	GOOGLE_OAUTH_CLIENT,
	AWS_CREDS,
	IMAGE_CREDS,
	USER_AGENT,
	ML_MODEL_IP,
	LOCAL_DATA_FOLDER_PATH,
	LOCAL_SLUGS_FOLDER_PATH,
	BLOCKDAEMON_API_KEY,
	NFTPORT_API_KEY
}