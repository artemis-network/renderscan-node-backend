import { connect, KeyPair, keyStores, utils, Contract, WalletConnection } from "near-api-js";
import path from 'path';
import BN from 'bn.js'
// import { data } from "cheerio/lib/api/attributes";

const { parseSeedPhrase, generateSeedPhrase } = require("near-seed-phrase");
// const {seedPhrase, publicKey, secretKey} = generateSeedPhrase()
//const { publicKey, secretKey } = parseSeedPhrase("slab copper wool universe creek identify concert into ritual cereal sight ");

const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(__dirname, CREDENTIALS_DIR);
const myKeyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

var connectionConfig = {
	networkId: "testnet",
	nodeUrl: "https://rpc.testnet.near.org",
	walletUrl: "https://wallet.testnet.near.org",
	helperUrl: "https://helper.testnet.near.org",
	explorerUrl: "https://explorer.testnet.near.org",
};

// type mintNFTInput = {
// 	tokenId: string,
// 	receiver_id: string,
// 	title: string,
// 	description: string,
// 	media: string
// }


export class NFTServices {

	static createAccount = async (newAccountId) => {
		connectionConfig["keyStore"] = myKeyStore;
		const nearConnection = await connect(connectionConfig);
		const creatorAccount = await nearConnection.account("renderverse.testnet");
		const bal = await creatorAccount.getAccountDetails();
		console.log(bal);
		// const keyPair = KeyPair.fromRandom("ed25519");
		// const publicKey = keyPair.publicKey.toString();
		// await myKeyStore.setKey("testnet", newAccountId, keyPair);
		// return await creatorAccount.functionCall({
		//   contractId: "near",
		//   methodName: "create_account",
		//   args: {
		//     new_account_id: "renderverse3.mainnet",
		//     new_public_key: publicKey,
		//   },
		//   gas: "300000000000000",
		//   attachedDeposit: utils.format.parseNearAmount("0"),
		// });
		// return await creatorAccount.functionCall({
		//   contractId: "testnet",
		//   methodName: "create_account",
		//   args: {
		//     new_account_id: newAccountId,
		//     new_public_key: publicKey,
		//   },
		//   gas: "300000000000000",
		//   attachedDeposit: utils.format.parseNearAmount("0.01"),
		// });
	}

	static mintNFT = async (input) => {
		connectionConfig["keyStore"] = myKeyStore;
		const nearConnection = await connect(connectionConfig);
		const creatorAccount = await nearConnection.account("renderverse.testnet");
		const contract = new Contract(
			creatorAccount, // the account object that is connecting
			"renderverse.testnet",
			{
				viewMethods: ["check_token"],
				changeMethods: ["nft_mint"],
				sender: creatorAccount, // account object to initialize and sign transactions.
			}
		);
		console.log(contract.contractId);
		console.log(contract);
		const resp = await contract.nft_mint(
			{
				token_id: input.tokenId,
				metadata: {
					title: input.title,
					description: input.description,
					media: input.media,
				},
				receiver_id: input.receiver_id,
			},
			300000000000000, // attached GAS (optional)
			new BN("1000000000000000000000000")
		);
		console.log(resp)
		return resp;
	}
}


