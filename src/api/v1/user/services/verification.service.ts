import { db } from "../../db"
import { activationCodes } from '../data/activationCodes'

const { User } = db;

interface Result {
	error: boolean,
	message: string,
	isActivated: boolean
}

const checkForAccountActivation = async (username: string, code: string) => {
	const response: Result = {
		error: false,
		message: "account activated",
		isActivated: true
	}
	const error: Result = {
		error: true,
		message: "invalid activation code",
		isActivated: false
	}
	try {
		const user = await User.findOne({ username: username });
		if (!user?.$isEmpty) {
			if (user?.isActivated) return response

			for (let c in activationCodes) {
				if (c === code) {
					await user?.updateOne({
						$set: {
							isActivated: true
						}
					});
					await user?.save()
					return response;
				}
			}
			return error;
		}
		return error;
	} catch (e) {
		return error;
	}
}

const verifyUserEmail = async (username: string, token: string) => {
	try {
		const user = await User.findOne({ username: username })
		if (!user?.$isEmpty) {
			if (user?.token === token) {
				user?.updateOne({
					$set: {
						token: "",
						isVerified: true,
					}
				})
				await user?.save();
				return { message: "email verified", error: false }
			}
			return { message: "invalid token", error: true }
		}
		return { message: "user does not exits", error: true }
	} catch (e) {
		return { message: "something went wrong", error: true }
	}
}

export {
	checkForAccountActivation,
	verifyUserEmail
}