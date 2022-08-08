import mongoose, { Schema, Model, Document } from 'mongoose';

export interface FeedBackInterface {
	user?: string; feedback?: string; category?: string; message?: string; rating?: string;
}
export interface FeedBackDoc extends FeedBackInterface, Document { }

const FeedBackSchema = new Schema({
	user: { type: Schema.Types.String, required: true },
	feedback: { type: Schema.Types.String, },
	category: { type: Schema.Types.String, required: true },
	message: { type: Schema.Types.String },
	rating: { type: Schema.Types.Number }
});

export const FEEDBACK_NAMING: string = 'FEEDBACK';

export class FeedBack {

	feedback: FeedBackInterface;

	constructor(feedback: FeedBackInterface) { this.feedback = feedback }

	setFeedback(feedback: FeedBackInterface["feedback"]) {
		this.feedback.feedback = feedback
		return this;
	}
	setUser(user: FeedBackInterface["user"]) {
		this.feedback.user = user;
		return this;
	}
	setCategory(category: FeedBackInterface["category"]) {
		this.feedback.category = category;
		return this;
	}
	setMessage(message: FeedBackInterface["message"]) {
		this.feedback.message = message;
		return this;
	}
	setRating(rating: FeedBackInterface["rating"]) {
		this.feedback.rating = rating;
		return this;
	}
	get() { return this.feedback }
}

export const FeedBackModel: Model<FeedBackDoc> = mongoose
	.model<FeedBackDoc>(FEEDBACK_NAMING, FeedBackSchema);