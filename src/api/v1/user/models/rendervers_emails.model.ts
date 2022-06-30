import mongoose, { Schema, Model, Document } from 'mongoose';

type RenderverseEmailsDocument = Document & { email: String };

const renderverseEmailsSchema = new Schema({
	email: { type: Schema.Types.Number, required: true, unique: true, },
});


const RenderverseEmails: Model<RenderverseEmailsDocument> = mongoose.model<RenderverseEmailsDocument>('Renderverse_Email', renderverseEmailsSchema);

export { RenderverseEmails, RenderverseEmailsDocument };