import mongoose, { Schema, Model, Document, SchemaType } from 'mongoose';
import { USER_NAMING } from './user.model';

export interface NotificationInterface {
	userId?: string;
	notification?: string;
	message?: string;
	hasNotification: boolean;

}

export interface NotificationDoc extends NotificationInterface, Document { }

const NotificationSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, required: true, ref: USER_NAMING },
	notification: { type: Schema.Types.String, required: true, },
	message: { type: Schema.Types.String, required: true, },
	hasNotification: { type: Schema.Types.Boolean, required: true, }
});

export class Notification {
	notification: NotificationInterface;

	constructor(notification: NotificationInterface) { this.notification = notification }

	setUserId(userId: NotificationInterface["userId"]) {
		this.notification.userId = userId
		return this;
	}
	setNotification(notification: NotificationInterface["notification"]) {
		this.notification.notification
		return this;
	}
	setMessage(message: NotificationInterface["message"]) {
		this.notification.message = message
		return this;
	}
	setHasNotification(hasNotification: NotificationInterface["hasNotification"]) {
		this.notification.hasNotification = hasNotification;
		return this;
	}
	get() { return this.notification }
}

export const Notification_NAMING = "NOTIFICATION";

export const NotificationModel: Model<NotificationDoc> = mongoose
	.model<NotificationDoc>(Notification_NAMING, NotificationSchema);