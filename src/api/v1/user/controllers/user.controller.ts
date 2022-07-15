import { Request, Response } from 'express';

import { Err } from '../../errors/error_factory';
import { ErrorTypes } from '../../errors/error_types';

import { logger } from '../../utils/logger';
import { Required } from '../../utils/required'
import { HttpFactory } from '../../http/http_factory';
import { EmailSender } from '../../utils/email'

import { JWT } from '../../utils/jwt';
import { Role, UserServices } from '../services/user.service'
import { ADMIN, EMAIL_CONFIG } from '../../../../config';
import { ReferalService } from '../services/referal.service';
import { RewardService } from '../services/reward.service';
import { RewardType } from '../models/reward.model';
import { PAYMENT_TYPE, Transaction } from '../models/transaction.model';
import { InAppWalletServices } from '../services/in_app_wallet.service';

export class UserController {

	// @desc init admin 
	// @route /renderscan/v1/users/init
	// @access private
	static initialize = async (req: Request, res: Response) => {
		const userCount = await UserServices.getUsersCount();
		if (userCount <= 0) {
			logger.info(">> create admin user")
			const hash = await UserServices.hashPassword(ADMIN.password);
			const user = await UserServices.createUser(ADMIN.username, ADMIN.email, hash, Role.ADMIN, false)
			await UserServices.createWalletForUser(user?._id);
			logger.info(">> successfully admin user")
			return HttpFactory.STATUS_200_OK({ message: "OK" }, res)
		}
		return HttpFactory.STATUS_200_OK({ message: "FAILED" }, res)
	}

	// @desc creating new user
	// @route /backend/v1/users/register
	// @access public
	static createUser = async (req: Request, res: Response) => {
		type input = { username: string, password: string, email: string, referalCode: string };
		type wallet_input = { walletId: string };
		try {
			const { username, email, password, referalCode } = new Required(req.body)
				.addKey("username")
				.addKey("email")
				.addKey("password")
				.getItems() as input;
			try {
				const isExists = await UserServices.isUserAlreadyExists(username, email)
				if (isExists) {
					const response = {
						error: true,
						errorType: "USER_ALREADY_EXIST",
						message: "Username or Email already in use",
					}
					logger.info(`>> user already exists with ${username}, ${email}`)
					return HttpFactory.STATUS_200_OK(response, res)
				}
				try {
					const token: string = UserServices.createToken();
					const hash = await UserServices.hashPassword(password)
					const newUser = await UserServices.createUser(username, email, hash, token, false);

					await UserServices.createWalletForUser(newUser._id)
					logger.info(`>> creating wallet for user : ${newUser._id}`)

					if (referalCode !== null || referalCode !== undefined) {
						logger.info(`>> user signed up with referalcode with referal code: ${referalCode}`)
						const referer = await ReferalService.getUserByReferalCode(referalCode);
						await ReferalService.addReferal({ referalId: referer._id, userId: newUser._id })
						const reward = await RewardService.getRewardByType(RewardType.REFERAL);
						const { walletId } = await InAppWalletServices.getWallet(referer._id) as wallet_input;
						const transaction = new Transaction({})
							.setAmount(reward.amount)
							.setCreatedAt(new Date())
							.setDescription(reward.description)
							.setPaymentType(PAYMENT_TYPE.REWARD)
							.setRewardInfo(reward._id)
							.setWalletId(walletId)
							.get();
						await InAppWalletServices.createTranascation(transaction)
						logger.info(`>> creating reward referer for refering user: ${newUser._id}`)
					}

					const html: string = EmailSender.getEmailVerificationHTML(token);
					await EmailSender.sendMail(
						EMAIL_CONFIG.email,
						email,
						"Welcome to Renderplay, Please Verify Your Email",
						"",
						html.toString()
					);

					logger.info(`>> sending verification email for ${email}`)
					const response = { message: "Successfully created", errorType: "NONE", error: false };
					return HttpFactory.STATUS_200_OK(response, res)

				} catch (error) {
					const err = error as Err;
					if (err.name === ErrorTypes.TYPE_ERROR) {
						logger.error(`>> bad request : ${err.message}`)
						return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
					}
					if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
						err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
						logger.error(`>> object not found : ${err.message}`)
						return HttpFactory.STATUS_404_NOT_FOUND(err, res);
					}
					if (err.name === ErrorTypes.EMAIL_ERROR) {
						logger.error(`>> issue with email config : ${err.message}`)
						return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
					}
					return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
				}
			} catch (err) {
				const error = err as Err;
				if (error.name === ErrorTypes.INVALID_REFERAL_CODE) {
					const response = { error: true, invalidReferalCode: true }
					return HttpFactory.STATUS_200_OK(response, res)
				}
				return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
			}
		} catch (err) {
			const error = err as Err;
			if (error.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`>> bad request : ${error.message}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(error, res);
			}
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
		}
	};


	// @desc validate user email by token 
	// @route /backend/v1/users/validate/:token
	// @param token : string
	// @access public
	static validateEmail = async (req: Request, res: Response) => {
		type input = { token: string };
		type wallet_input = { walletId: string }
		try {
			const { token } = new Required(req.params)
				.addKey("token").getItems() as input;
			const isVerified = await UserServices.isValidToken(token)
			await UserServices.setIsVerified(token, isVerified);
			logger.info(`>> token validation check done`)

			const reward = await RewardService.getRewardByType(RewardType.SIGNUP);
			const user = await UserServices.getUserByToken(token);
			const { walletId } = await InAppWalletServices.getWallet(user._id) as wallet_input;
			const transaction = new Transaction({})
				.setAmount(reward.amount)
				.setCreatedAt(new Date())
				.setDescription(reward.description)
				.setPaymentType(PAYMENT_TYPE.REWARD)
				.setRewardInfo(reward._id)
				.setWalletId(walletId)
				.get();
			await InAppWalletServices.createTranascation(transaction)
			logger.info(`>> creating reward for signing up for user : ${user._id}`)

			return HttpFactory.STATUS_200_OK({ isVerified: isVerified }, res)
		} catch (err) {
			const error = err as Err;
			if (error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR || ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
				logger.error(`bad request ${error.message}`)
				const response = { isVerified: false, message: "user does not exists" };
				return HttpFactory.STATUS_200_OK(response, res)
			}
			if (error.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`bad request ${error.message}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(error, res)
			}
		}
	}

	// @desc app login 
	// @route /backend/v1/users/login
	// @access public
	static loginUser = async (req: Request, res: Response) => {
		type input = { username: string, password: string }
		const { username, password } = new Required(req.body)
			.addKey("username").addKey("password").getItems() as input;
		try {
			const user = await UserServices.authenticateUser(username)
			if (user.isGoogleAccount) {
				const response = {
					error: true,
					message: "Sign in with Google",
					errorType: "UNAUTHORIZED_ACCESS"
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}
			logger.info(`>> google account check done `)

			const authorized = await UserServices.verifyPassword(password, user?.password)
			if (!authorized) {
				const response = {
					error: true,
					message: "invalid username or password",
					errorType: "INVALID_CRENDENTAILS",
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}
			logger.info(`>> authorization check done `)

			if (!user?.isVerified) {
				const response = {
					error: true,
					message: "verify email, to login",
					errorType: "UNAUTHORIZED_EMAIL"
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}
			logger.info(`>> verification check done `)

			const token: string = JWT.generateJWTToken(user?._id);
			logger.info(`>> verification token done `)
			const response = { error: false, accessToken: token, userId: user?._id, username: username, errorType: 'NONE' }
			return HttpFactory.STATUS_200_OK(response, res)
		} catch (err) {
			const error = err as Error;
			if (error.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`bad request : ${error.message}`)
				return HttpFactory.STATUS_200_OK(error, res)
			}
			if (error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
				logger.error(`user does not exist : ${error.message}`)
				const response = {
					errorType: "INVALID_CREDENTIALS",
					message: "username or email does not exists",
					error: true
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}
			logger.error(`something went wrong : ${error.message}`)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({}, res)
		}
	};

	// @desc forgot-password request 
	// @route /backend/v1/users/forgot-password-request
	// @access public
	static forgotPasswordSendRequest = async (req: Request, res: Response) => {
		type input = { email: string };
		try {
			const { email } = new Required(req.body).getItems() as input;
			const token = await UserServices.setToken(email)
			logger.info(`>> generating token is done, `)
			const html: string = EmailSender.getForgotPasswordHTML(token);
			logger.info(">> sending forgot password email to - " + email)
			await EmailSender.sendMail(EMAIL_CONFIG.email, email, "Password Change", "", html.toString());
			logger.info(">> sent forgot password email")
			return HttpFactory.STATUS_200_OK({ isEmailSend: true }, res)
		} catch (err) {
			const error = err as Err;
			if (error.name === ErrorTypes.EMAIL_ERROR) {
				logger.error(`email service unavailable : ${error.message}`)
				return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(error, res)
			}
			if (error.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`bad request : ${error.message}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(error, res)
			}
			if (error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR ||
				error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
				const e = { isEmailSend: false, message: "user does not exists" }
				return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(e, res)
			}
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
		}
	};

	// @desc validate user email by token 
	// @route /backend/v1/users/change-password/:token
	// @param token : string
	// @access public
	static changePassword = async (req: Request, res: Response) => {
		type inputOne = { token: string };
		type inputTwo = { password: string };
		try {
			const { token } = new Required(req.params).getItems() as inputOne;
			const { password } = new Required(req.body).getItems() as inputTwo;
			const isVerified = await UserServices.isValidToken(token)
			if (isVerified) {
				const hash = await UserServices.hashPassword(password)
				await UserServices.setPassword(token, hash)
				await UserServices.updateToken(token)
				return HttpFactory.STATUS_200_OK({ isPasswordChanged: true }, res)
			}
			logger.info(`invalid token or user doesnot exits`);
			return HttpFactory.STATUS_200_OK({ isPasswordChanged: false }, res);
		} catch (err) {
			const error = err as Err;
			if (error.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`>> bad request : ${error}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(err, res)
			}
			logger.error(`>> something went wrong ${error}`)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
		}
	}


	// @desc google-login for web app 
	// @route /backend/v1/users/google-login
	// @access public
	static createGoogleUser = async (req: Request, res: Response) => {
		type input = { token: string };
		try {
			const { token } = new Required(req.body).getItems() as input;
			const { username, email, emailVerified } = await UserServices.verifyGoogleTokenAndFetchCredentials(token)
			try {
				if (emailVerified) {
					const isExists = await UserServices.isUserAlreadyExists(username, email)
					if (isExists) {
						const user = await UserServices.getUserByEmail(email)
						if (user?.isGoogleAccount === false) {
							const response = {
								error: true,
								message: "It's not a google account, SignIn with Email & Password",
								errorType: "UNAUTHORIZED_ACCESS"
							}
							return HttpFactory.STATUS_200_OK(response, res)
						}
						const token: string = JWT.generateJWTToken(user?._id);
						const response = { error: false, errorType: "NONE", username: username, accessToken: token }
						return HttpFactory.STATUS_200_OK(response, res)
					}
					const { _id }: any = await UserServices.createUser(username, email, "", "", true)
					UserServices.createWalletForUser(_id)
					const token: string = JWT.generateJWTToken(_id);
					const response = { error: false, errorType: "NONE", username: username, accessToken: token, };
					return HttpFactory.STATUS_200_OK(response, res)
				}
			} catch (err) {
				const error = err as Err;
				if (error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR || error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
					logger.error(`user does not exists ${err}`)
					return HttpFactory.STATUS_404_NOT_FOUND(err, res)
				}
				if (error.name === ErrorTypes.TYPE_ERROR) {
					logger.error(`bad request ${err}`)
					return HttpFactory.STATUS_400_BAD_REQUEST(err, res)
				}
				logger.error(`something went wrong ${err}`)
				return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
			}
		} catch (error) {
			const err = error as Err;
			if (err.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`bad request, ${err}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
			}
			logger.error(`something went wrong, ${err}`)
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
		}
	}

	// @desc google-login for mobile app 
	// @route /backend/v1/users/google-mobile-login
	// @access public
	static createMobileGoogleUser = async (req: Request, res: Response) => {
		type input = { email: string };
		try {
			const { email } = new Required(req.body).addKey("email").getItems() as input;
			const username = email.split("@")[0]
			try {
				const newUser = await UserServices.createUser(username, email, "", "", true)
				UserServices.createWalletForUser(newUser._id)
				const token: string = JWT.generateJWTToken(newUser._id);
				const response = {
					error: false, userId: newUser._id, message: "SUCCESS",
					username: newUser.username, errorType: "NONE", email: newUser.email,
					accessToken: token, publicToken: "[ADMIN]", status: 200
				};
				return HttpFactory.STATUS_200_OK(response, res);
			} catch (err) {
				const error = err as Err;
				if (error.name === ErrorTypes.TYPE_ERROR) {
					const user = await UserServices.getUserByEmail(email);
					const token: string = JWT.generateJWTToken(user?._id);
					const response = {
						error: false, userId: user?._id, message: "SUCCESS",
						username: username, email: email, accessToken: token,
						publicToken: "[ADMIN]", status: 200, errorType: "NONE"
					}
					return HttpFactory.STATUS_200_OK(response, res);
				}
			}
		} catch (err) {
			const error = err as Err;
			if (error.name === ErrorTypes.REQUIRED_ERROR) {
				logger.error(`bad request : ${error}`)
				return HttpFactory.STATUS_400_BAD_REQUEST(error, res);
			}
			const e = {
				error: true, userId: "", message: "FAILED", username: "", email: "",
				accessToken: "", publicToken: "[GUEST]", status: 200, errorType: "FAILED"
			}
			return HttpFactory.STATUS_200_OK(e, res);
		}

	}
}



