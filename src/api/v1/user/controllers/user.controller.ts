import { Request, Response } from 'express';
import { UserServices } from '../services/user.service'
import { EmailSender } from '../../utils/email'
import { HttpFactory } from '../../http/http_factory';
import { JWT } from '../../utils/jwt';
import { ErrorTypes } from '../../errors/error_types';

export class UserController {

	// @desc creating new user
	// @route /backend/v1/users/register
	// @access public
	static createUser = async (req: Request, res: Response) => {
		try {
			const { username, email, password } = req.body;
			const isExists = await UserServices.isUserAlreadyExists(username, email)
			if (isExists) {
				const response = {
					errorType: "USER_ALREADY_EXIST", message: "Username or Email already in use",
					error: true,
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}
			const token: string = UserServices.createToken();
			const hash = await UserServices.hashPassword(password)
			const newUser = await UserServices.createUser(username, email, hash, token, false);
			await UserServices.createWalletForUser(newUser?._id)
			const html: string = EmailSender.getEmailVerificationHTML(token);
			console.log("sending verification email to - " + email)
			await EmailSender.sendMail("contact@renderverse.io", email, "Welcome to Renderplay, Please Verify Your Email", "", html.toString());
			console.log("sent verification email")
			const response = { message: "Successfully created", errorType: "NONE", error: false };
			return HttpFactory.STATUS_200_OK(response, res)
		} catch (err) {
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
		}
	};

	// @desc google-login for web app 
	// @route /backend/v1/users/google-login
	// @access public
	static createGoogleUser = async (req: Request, res: Response) => {
		const { token } = req.body;
		const { username, email, emailVerified } = await UserServices.verifyGoogleTokenAndFetchCredentials(token)
		if (emailVerified) {
			try {
				const isExists = await UserServices.isUserAlreadyExists(username, email)
				if (isExists) {
					const user = await UserServices.getUserByEmail(email)
					if (user?.isGoogleAccount === false) {
						const response = {
							error: true, message: "It's not a google account, SignIn with Email & Password", errorType: "UNAUTHORIZED_ACCESS"
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
				console.log(username)
				return { error: false, errorType: "NONE", username: username, accessToken: token, };
			} catch (err) {
				return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
			}
		}
	}

	// @desc google-login for mobile app 
	// @route /backend/v1/users/google-mobile-login
	// @access public
	static createMobileGoogleUser = async (req: Request, res: Response) => {
		const { email, client } = req.body;
		if (client === "client0123") {
			const result = await UserServices.googleMobileLogin(email)
			return res.status(200).json(result)
		}
		return res.status(200).json({ message: "invalid client id" })
	}

	// @desc app login 
	// @route /backend/v1/users/login
	// @access public
	static loginUser = async (req: Request, res: Response) => {
		const { username, password } = req.body;
		try {
			const user = await UserServices.authenticateUser(username)
			if (user?.isGoogleAccount) {
				const response = {
					error: true,
					message: "Sign in with Google",
					errorType: "UNAUTHORIZED_ACCESS"
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}

			const authorized = await UserServices.verifyPassword(password, user?.password)
			if (!authorized) {
				const response = {
					error: true,
					message: "invalid username or password",
					errorType: "INVALID_CRENDENTAILS",
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}

			if (!user?.isVerified) {
				const response = {
					error: true,
					message: "verify email, to login",
					errorType: "UNAUTHORIZED_EMAIL"
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}

			const token: string = JWT.generateJWTToken(user?._id);
			const response = { error: false, accessToken: token, username: username, errorType: 'NONE' }
			return HttpFactory.STATUS_200_OK(response, res)
		} catch (err: any) {
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
				const response = {
					errorType: "INVALID_CREDENTIALS", message: "username or email does not exists",
					error: true
				}
				return HttpFactory.STATUS_200_OK(response, res)
			}
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({}, res)
		}
	};

	// @desc forgot-password request 
	// @route /backend/v1/users/forgot-password-request
	// @access public
	static forgotPasswordSendRequest = async (req: Request, res: Response) => {
		try {
			const { email } = req.body;
			const token = await UserServices.setToken(email)
			const html: string = EmailSender.getForgotPasswordHTML(token);
			console.log("sending forgot password email to - " + email)
			await EmailSender.sendMail("contact@renderverse.io", email, "Password Change", "", html.toString());
			console.log("sent forgot password email")
			return HttpFactory.STATUS_200_OK({ isEmailSend: true }, res)
		} catch (err) {
			const e = { isEmailSend: false, message: "user does not exists" }
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(e, res)
		}
	};

	// @desc validate user email by token 
	// @route /backend/v1/users/validate/:token
	// @param token : string
	// @access public
	static validateToken = async (req: Request, res: Response) => {
		try {
			const { token } = req.params;
			const isVerified = await UserServices.isValidToken(token)
			await UserServices.setIsVerified(token, isVerified);
			return HttpFactory.STATUS_200_OK({ isVerified: isVerified }, res)
		} catch (err) {
			const e = { isVerified: false, message: "user does not exists" };
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(e, res)
		}
	}

	// @desc validate user email by token 
	// @route /backend/v1/users/change-password/:token
	// @param token : string
	// @access public
	static changePassword = async (req: Request, res: Response) => {
		try {
			const { token } = req.params;
			const { password } = req.body
			const isVerified = await UserServices.isValidToken(token)
			if (isVerified) {
				const hash = await UserServices.hashPassword(password)
				await UserServices.setPassword(token, hash)
				await UserServices.updateToken(token)
				return HttpFactory.STATUS_200_OK({ isPasswordChanged: true }, res)
			}
			return HttpFactory.STATUS_200_OK({ isPasswordChanged: false }, res)
		} catch (err) {
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res)
		}
	}

}
