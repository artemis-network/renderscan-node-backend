import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserInterface, USER_NAMING } from './user.model'

export interface BlockChainWalletInterface {
	chain: string; address: string; isActive: Boolean; user: UserInterface | string, publicId: string
}
export interface BlockChainWalletDoc extends BlockChainWalletInterface, Document { }

const BlockChainWalletSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: USER_NAMING },
	isActive: { type: Schema.Types.Boolean, required: true, },
	address: { type: Schema.Types.String, required: true, },
	publicId: { type: Schema.Types.String, },
	chain: { type: Schema.Types.String },
});

export const BLOCK_CHAIN_WALLET_NAMING: string = 'BLOCK_CHAIN_WALLET';

export class BlockChainWallet {
	wallet: BlockChainWalletInterface;
	constructor(wallet: BlockChainWalletInterface) { this.wallet = wallet }
	setIsActive(isActivate: BlockChainWalletInterface["isActive"]) {
		this.wallet.isActive = isActivate
		return this;
	}
	setUser(user: BlockChainWalletInterface["user"]) {
		this.wallet.user = user;
		return this;
	}
	setPublicId(publicId: BlockChainWalletInterface["publicId"]) {
		this.wallet.publicId = publicId;
		return this;
	}
	setChain(chain: BlockChainWalletInterface["chain"]) {
		this.wallet.chain = chain;
		return this;
	}
	setAddress(address: BlockChainWalletInterface["address"]) {
		this.wallet.address = address;
		return this;
	}
	get() {
		return this.wallet;
	}
}

export const BlockChainWalletModel: Model<BlockChainWalletDoc> = mongoose
	.model<BlockChainWalletDoc>(BLOCK_CHAIN_WALLET_NAMING, BlockChainWalletSchema);