import { db, classes, FeedBackDoc, FeedBackInterface } from '../db'
import { authorizeUserMiddleWare } from '../middlewares/jwtTokenAuthenticator.middleware'

const { FeedBack } = classes
const { FeedBackModel } = db

export class FeedBackServices {
	static createFeedback = async (feedback: FeedBackInterface) => {
		try {
			await FeedBackModel.create({
				user: feedback.user,
				message: feedback.message,
				feedback: feedback.feedback,
				category: feedback.category,
				rating: feedback.rating
			})
		} catch (error) {
			throw error;
		}
	}
} 