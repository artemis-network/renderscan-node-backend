import { classes, NotificationDoc, NotificationInterface, db } from '../../db'
const { NotificationModel, UserModel } = db

export class NotificationService {

	static sendNotificationToUser = async (
		userId: string, message: string, hasNotification: boolean, notification: string
	) => {
		try {
			const currentNotification = await NotificationModel.findOne({ userId: userId });
			if (currentNotification !== null) {
				await currentNotification.updateOne({
					$set: {
						message: message,
						notification: notification,
						hasNotification: hasNotification
					}
				})
				await currentNotification.save()
			} else {
				await NotificationModel.create({
					userId: userId,
					message: message,
					hasNotification: hasNotification,
					notification: notification
				})
			}
		} catch (error) {
			throw error;
		}
	}

	static checkForNotifications = async (userId: string) => {
		try {
			const currentNotification = await NotificationModel.findOne({ userId: userId });
			if (currentNotification !== null) {
				return currentNotification;
			}
			return {
				hasNotification: false,
				message: "",
				notification: "",
				userId: userId
			}
		} catch (error) {
			throw error;
		}
	}

}