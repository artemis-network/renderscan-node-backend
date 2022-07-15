import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_OAUTH_CLIENT } from '../../../../config'

const client: any = new OAuth2Client(GOOGLE_OAUTH_CLIENT)

import { db, UserDoc } from '../../db'
import { DBObject } from '../../db_object';
import { Err, ErrorFactory, ErrorTypes } from '../../errors/error_factory';
import { logger } from '../../utils/logger';

const { UserModel, InAppWalletModel } = db;

export enum Role { ADMIN = "ADMIN", USER = "USER", GUEST = "GUEST" }

export class UserServices {

	static createToken = (): string => {
		try {
			return crypto.randomBytes(32).toString("hex")
		} catch (e) {
			logger.error(e);
			throw new Error(`something went wrong`);
		}
	}

	static getUserByToken = async (token: string) => {
		try {
			const query = await UserModel.findOne({ token: token })
			return new DBObject(query).get() as UserDoc;
		} catch (err) {
			throw err;
		}
	}

	static setToken = async (email: string) => {
		const token = UserServices.createToken();
		try {
			const query = await UserModel.findOneAndUpdate({ email: email }, {
				$set: { token: token }
			});
			const user = new DBObject(query)
			await user.get()
			return token;
		} catch (err) {
			throw err;
		}
	}

	static updateToken = async (token: string) => {
		const newToken = UserServices.createToken();
		await UserModel.findOneAndUpdate({ token: token }, {
			$set: { token: newToken }
		});
		return newToken;
	}

	static setIsVerified = async (token: string, isVerified: boolean) => {
		const crypto = require('crypto'), hash = crypto.getHashes();
		let referalCode = crypto.createHash('sha1').update(token).digest('hex');
		await UserModel.findOneAndUpdate({ token: token }, {
			$set: {
				isVerified: isVerified,
				referalCode: referalCode
			}
		});
	}

	static isValidToken = async (token: string) => {
		try {
			const query = await UserModel.findOne({ token: token });
			const user = new DBObject(query)
			await user.get()
			return true
		} catch (err) {
			const error = err as Err;
			if (error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR)
				return false
			return false
		}
	}

	static clearToken = async (token: string) => {
		const user = await UserModel.findOneAndUpdate({ token: token }, {
			$set: { token: "" }
		});
		await user?.save()
	}

	static hashPassword = async (password: string) => {
		const salt = await bcrypt.genSalt(10);
		return await bcrypt.hash(password, salt);
	}

	static setPassword = async (token: string, hash: string) => {
		const user = await UserModel.findOne({ token: token });
		await user?.updateOne({ $set: { password: hash } })
	}

	static createWalletForUser = async (user_id: string) =>
		await InAppWalletModel.create({ balance: 5000, isActive: true, user: user_id })

	static getUserByEmail = async (email: string) => {
		try {
			const query = await UserModel.findOne({ email: email })
			const user = new DBObject(query)
			return await user.get();
		} catch (err) {
			throw err;
		}
	}

	static isUserAlreadyExists = async (username: string, email: string) => {
		try {
			const query = await UserModel.findOne({ $or: [{ username: username }, { email: email }] })
			const user = new DBObject(query)
			await user.get()
			return true;
		} catch (err) {
			const error = err as Err;
			if (error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			)
				return false
			return false
		}
	}

	static createUser = async (username: string, email: string, hash: string, token: string, isGoogleAccount: boolean) => {
		try {
			return await UserModel.create({
				username: username, email: email, password: hash, token: token,
				isActivated: false, isGoogleAccount: isGoogleAccount, isVerified: false,
				userType: Role.USER.toString()
			});
		} catch (error) {
			throw ErrorFactory.TYPE_ERROR(`Invalid types`)
		}
	}

	static getUsersCount = async () => await UserModel.countDocuments()


	static authenticateUser = async (username: string) => {
		try {
			const query = await UserModel.findOne({ $or: [{ username: username }, { email: username }] })
			return new DBObject(query).get()
		} catch (err) {
			throw err;
		}
	}


	static verifyPassword = async (password: string, hash: string) => bcrypt.compareSync(password, hash);

	static verifyGoogleTokenAndFetchCredentials = async (token: string) => {
		const { payload } = await client.verifyIdToken({ idToken: token, audience: GOOGLE_OAUTH_CLIENT })
		const { email, email_verified } = payload
		const username = email.split("@")[0]
		return { email: email, username: username, emailVerified: email_verified }
	}


}

