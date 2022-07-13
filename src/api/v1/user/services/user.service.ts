import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { JWT } from '../../utils/jwt';
import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_OAUTH_CLIENT } from '../../../../config'

const client: any = new OAuth2Client(GOOGLE_OAUTH_CLIENT)

import { db } from '../../db'
import { DBObject } from '../../db_object';
import { ErrorFactory } from '../../errors/error_factory';

type ErrorType = { name: string, message: string } | any

const { UserModel, InAppWalletModel } = db;

export enum Role { ADMIN = "ADMIN", USER = "USER", GUEST = "GUEST" }

export class UserServices {

	static createToken = (): string => {
		try {
			return crypto.randomBytes(32).toString("hex")
		} catch (e) {
			throw new Error("Error");
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
		} catch (err: ErrorType) {
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
		} catch (err: ErrorType) {
			if (err.name === ErrorFactory.OBJECT_NOT_FOUND ||
				err.name === ErrorFactory.OBJECT_UN_DEFINED)
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
		const query = await UserModel.findOne({ email: email })
		const user = new DBObject(query)
		return await user.get();
	}

	static isUserAlreadyExists = async (username: string, email: string) => {
		const query = await UserModel.findOne({ $or: [{ username: username }, { email: email }] })
		try {
			const user = new DBObject(query)
			await user.get()
			console.log(user)
			return true;
		} catch (err: ErrorType) {
			if (
				err.name === ErrorFactory.OBJECT_NOT_FOUND ||
				err.name === ErrorFactory.OBJECT_UN_DEFINED
			)
				return false
			return false
		}
	}

	static createUser = async (username: string, email: string, hash: string, token: string, isGoogleAccount: boolean) => {
		return await UserModel.create({
			username: username, email: email, password: hash, token: token,
			isActivated: false, isGoogleAccount: isGoogleAccount, isVerified: false,
			userType: Role.USER.toString()
		});
	}

	static authenticateUser = async (username: string) => {
		try {
			const query = await UserModel.findOne({ $or: [{ username: username }, { email: username }] })
			const user = new DBObject(query)
			return user.get()
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


	static googleLogin = async (googleToken: string) => {
		try {

		} catch (err: any) {
			return {
				error: true, userId: null, message: "FAILED", username: "", email: "",
				accessToken: "", publicToken: "[GUEST]", status: 200, errorType: "FAILED"
			}
		}

	}

	static googleMobileLogin = async (email: string) => {
		try {
			const username = email.split("@")[0]
			try {
				const newUser = await UserModel.create({
					username: username, email: email, password: "", token: "",
					isActivated: false, isGoogleAccount: true, isVerified: false,
				})
				UserServices.createWalletForUser(newUser._id)
				const token: string = JWT.generateJWTToken(newUser._id);
				return {
					error: false, userId: newUser._id, message: "SUCCESS",
					username: newUser.username, errorType: "NONE", email: newUser.email,
					accessToken: token, publicToken: "[ADMIN]", status: 200
				};
			} catch (err: any) {
				console.log(err)
				if (err["code"] === 11000) {
					const user = await UserModel.findOne({ email: email })
					const token: string = JWT.generateJWTToken(user?._id);
					return {
						error: false, userId: user?._id, message: "SUCCESS",
						username: username, email: email, accessToken: token,
						publicToken: "[ADMIN]", status: 200, errorType: "NONE"
					}
				}
			}
		} catch (err: any) {
			return {
				error: true, userId: "", message: "FAILED", username: "", email: "",
				accessToken: "", publicToken: "[GUEST]", status: 200, errorType: "FAILED"
			}
		}

	}

}

