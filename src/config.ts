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
export {
	PORT,
	ADMIN,
	JWT_SECRET,
	MONGO_DB_URL,
	EMAIL_CONFIG,
	API_ADMIN_PASSWORD,
	GOOGLE_OAUTH_CLIENT,
	AWS_CREDS,
	IMAGE_CREDS,
	USER_AGENT,
	LOCAL_DATA_FOLDER_PATH,
	LOCAL_SLUGS_FOLDER_PATH
}