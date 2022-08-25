import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { OAuth2Client, UserRefreshClient } from 'google-auth-library'
import { AVATAR_PATH, GOOGLE_OAUTH_CLIENT } from '../../../../config'

const client: any = new OAuth2Client(GOOGLE_OAUTH_CLIENT)

import { db, UserDoc } from '../../db'
import { DBObject } from '../../db_object';
import { Err, ErrorFactory, ErrorTypes } from '../../errors/error_factory';
import { ImageServices } from '../../images/services/image.services';
import { logger } from '../../utils/logger';

const { UserModel, InAppWalletModel } = db;

export enum Role { ADMIN = "ADMIN", USER = "USER", GUEST = "GUEST" }

export class UserServices {

	static setAvtarUrl = async (userId: string, avatarUrl: string) => {
		try {
			const user = new DBObject(await UserModel.findById(userId)).get() as UserDoc;
			await user.updateOne({ avatarUrl: avatarUrl })
			await user.save();
		} catch (e) {
			throw e;
		}
	}

	static getVerifiedUsers = async () => {
		try {
			return new DBObject(await UserModel.find().where({ isVerified: true })).get();
		} catch (e) {
			throw e;
		}
	}

	static cleanUpUser = async (userId: string) => {
		await UserModel.findByIdAndRemove(userId)
	}

	static getUsername = async (userId: string) => {
		try {
			const { username } = new DBObject(await UserModel.findById(userId)).get() as UserDoc;
			return username
		} catch (e) {
			throw e;
		}
	}


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
			throw ErrorFactory.OBJECT_NOT_FOUND("user does not exists");
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

	static getReferalCode = async (userId: string) => {
		try {
			const user = new DBObject(await UserModel.findById(userId)).get() as UserDoc;
			return user.referalCode;
		} catch (err) {
			throw ErrorFactory.OBJECT_NOT_FOUND("user does not exists");
		}
	}

	// experimental
	// try check with new DBObject
	static updateToken = async (token: string) => {
		const newToken = UserServices.createToken();
		try {
			new DBObject(await UserModel.findOneAndUpdate({ token: token }, {
				$set: { token: newToken }
			})).get();
			return newToken;
		} catch (error) {
			throw error;
		}
	}


	// experimental
	// try catch with new DBObject
	static setIsVerified = async (token: string, isVerified: boolean) => {
		const crypto = require('crypto'), hash = crypto.getHashes();
		let referalCode = crypto.createHash('sha1').update(token).digest('hex');
		try {
			new DBObject(await UserModel.findOneAndUpdate({ token: token }, {
				$set: {
					isVerified: isVerified,
					referalCode: referalCode,
				}
			})).get()
		} catch (error) {
			throw error;
		}
	}

	static isValidToken = async (token: string) => {
		try {
			const user = new DBObject(await UserModel.findOne({ token: token }));
			await user.get()
			return true
		} catch (err) {
			const error = err as Err;
			if (
				error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			)
				return false
			return false
		}
	}

	static clearToken = async (token: string) => {
		try {
			const user = new DBObject(await UserModel.findOneAndUpdate({ token: token }, {
				$set: { token: "" }
			})).get();
			await user?.save()
		} catch (err) {
			throw err;
		}
	}

	static hashPassword = async (password: string) => {
		const salt = await bcrypt.genSalt(10);
		return await bcrypt.hash(password, salt);
	}

	static setPassword = async (token: string, hash: string) => {
		try {
			const user = new DBObject(await UserModel.findOne({ token: token })).get();
			await user?.updateOne({ $set: { password: hash } })
		} catch (err) {
			throw err;
		}
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
			if (
				error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			)
				return false
			return false
		}
	}

	static createUser = async (name: string, username: string, email: string, hash: string, token: string, isGoogleAccount: boolean) => {
		try {
			return await UserModel.create({
				displayName: name,
				username: username, email: email, password: hash, token: token,
				isActivated: false, isGoogleAccount: isGoogleAccount, isVerified: false,
				userType: Role.USER.toString()
			});
		} catch (error) {
			console.log(error)
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

	static updateUser = async (userId: string, region: string, language: string, displayName: string) => {
		try {
			const user = new DBObject(await UserModel.findById(userId)).get() as UserDoc
			await user.updateOne({
				$set: {
					region: region,
					language: language,
					displayName: displayName
				}
			})
			await user.save()
		} catch (error) {
			throw error
		}

	}

	static getUserDetails = async (userId: string) => {
		try {
			const user = new DBObject(await UserModel.findById(userId)).get() as UserDoc
			const response = {
				region: user.region,
				displayName: user.displayName,
				language: user.language,
				email: user.email
			}
			return response;
		} catch (error) {
			throw error;
		}
	}

	static verifyPassword = async (password: string, hash: string) => bcrypt.compareSync(password, hash);

	static verifyGoogleTokenAndFetchCredentials = async (token: string) => {
		const { payload } = await client.verifyIdToken({ idToken: token, audience: GOOGLE_OAUTH_CLIENT })
		const { email, email_verified } = payload
		const username = email.split("@")[0]
		return { email: email, username: username, emailVerified: email_verified }
	}

	static updateEmail = async (userId: string, newEmail: string, token: string) => {
		try {
			const user = new DBObject(await UserModel.findById(userId)).get() as UserDoc;
			await user?.updateOne({
				$set: {
					isVerified: false,
					email: newEmail,
					token: token
				}
			});
			await user?.save();
		} catch (error) {
			throw error;
		}
	}


}

