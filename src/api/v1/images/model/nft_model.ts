import mongoose, { Schema, Model, Document } from "mongoose";
import { USER_NAMING } from "../../user/models/user.model";

export enum ImageType {
  MINTED,
  SCANNED,
  GENERATED,
  IMPORTED,
}

export interface NFTInterface {
  name?: string;
  filename?: string;
  s3Url?: string;
  type?: ImageType;
  user?: string;
  hash: string;
  url: string;
}
export interface NFTDoc extends NFTInterface, Document {}

const NFTSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: USER_NAMING },
  s3Url: { type: Schema.Types.String, required: true },
  filename: { type: Schema.Types.String, required: true },
  name: { type: Schema.Types.String },
  hash: { type: Schema.Types.String },
  url: { type: Schema.Types.String },
  type: {
    type: Schema.Types.String,
    enum: [
      ImageType.MINTED,
      ImageType.SCANNED,
      ImageType.IMPORTED,
      ImageType.GENERATED,
    ],
    required: true,
  },
});

export const NFT_NAMING: string = "NFT";

export const NFTModel: Model<NFTDoc> = mongoose.model<NFTDoc>(
  NFT_NAMING,
  NFTSchema
);
