import bcrypt from "bcrypt";
import crypto from "crypto";
import { errorMonitor } from "form-data";

import { OAuth2Client, UserRefreshClient } from "google-auth-library";
import {
  AVATAR_PATH,
  GOOGLE_OAUTH_CLIENT,
  NEAR_TESTNET_CONNECTION_CONFIG,
  NEAR_CREDS_PATH,
} from "../../../../config";

const client: any = new OAuth2Client(GOOGLE_OAUTH_CLIENT);

import { db, UserDoc } from "../../db";
import { DBObject } from "../../db_object";
import { Err, ErrorFactory, ErrorTypes } from "../../errors/error_factory";
import { NFTModel } from "../../images/model/nft_model";
import { ImageServices } from "../../images/services/image.services";
import { logger } from "../../utils/logger";
import { BlockChainWalletModel } from "../models/block_chain_wallet";

const bip39 = require("bip39");
const HDWallet = require("ethereum-hdwallet");
const BN = require("bn.js");
const { connect, keyStores, utils, Contract } = require("near-api-js");
const { parseSeedPhrase, generateSeedPhrase } = require("near-seed-phrase");
const { UserModel, InAppWalletModel } = db;

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

type mintNFTInput = {
  tokenId: string;
  title: string;
  description: string;
  receiver_id: string;
  media: string;
};

export class UserServices {
  static updateNearBlockChainDetails = async (
    userId: string,
    newPublicId: string,
    address: string
  ) => {
    try {
      const wallet: any = await BlockChainWalletModel.findOne({ user: userId });
      await wallet.updateOne({
        $set: {
          publicId: newPublicId,
          address: address,
        },
      });
      await wallet.save();
    } catch (error) {
      throw error;
    }
  };

  static setAvtarUrl = async (userId: string, avatarUrl: string) => {
    try {
      const user = new DBObject(
        await UserModel.findById(userId)
      ).get() as UserDoc;
      await user.updateOne({ avatarUrl: avatarUrl });
      await user.save();
    } catch (e) {
      throw e;
    }
  };

  static getVerifiedUsers = async () => {
    try {
      return new DBObject(
        await UserModel.find().where({ isVerified: true })
      ).get();
    } catch (e) {
      throw e;
    }
  };

  static cleanUpUser = async (userId: string) => {
    await UserModel.findByIdAndRemove(userId);
  };

  static getUsername = async (userId: string) => {
    try {
      const { username } = new DBObject(
        await UserModel.findById(userId)
      ).get() as UserDoc;
      return username;
    } catch (e) {
      throw e;
    }
  };

  static getUserByUsername = async (username: string) => {
    try {
      const { _id } = new DBObject(
        await UserModel.findOne({ username: username })
      ).get() as UserDoc;
      return _id;
    } catch (e) {
      throw e;
    }
  };

  static createToken = (): string => {
    try {
      return crypto.randomBytes(32).toString("hex");
    } catch (e) {
      logger.error(e);
      throw new Error(`something went wrong`);
    }
  };

  static getUserByToken = async (token: string) => {
    try {
      const query = await UserModel.findOne({ token: token });
      return new DBObject(query).get() as UserDoc;
    } catch (err) {
      throw ErrorFactory.OBJECT_NOT_FOUND("user does not exists");
    }
  };

  static setToken = async (email: string) => {
    const token = UserServices.createToken();
    try {
      const query = await UserModel.findOneAndUpdate(
        { email: email },
        {
          $set: { token: token },
        }
      );
      const user = new DBObject(query);
      await user.get();
      return token;
    } catch (err) {
      throw err;
    }
  };

  static getReferalCode = async (userId: string) => {
    try {
      const user = new DBObject(
        await UserModel.findById(userId)
      ).get() as UserDoc;
      return user.referalCode;
    } catch (err) {
      throw ErrorFactory.OBJECT_NOT_FOUND("user does not exists");
    }
  };

  // experimental
  // try check with new DBObject
  static updateToken = async (token: string) => {
    const newToken = UserServices.createToken();
    try {
      new DBObject(
        await UserModel.findOneAndUpdate(
          { token: token },
          {
            $set: { token: newToken },
          }
        )
      ).get();
      return newToken;
    } catch (error) {
      throw error;
    }
  };

  // experimental
  // try catch with new DBObject
  static setIsVerified = async (token: string, isVerified: boolean) => {
    try {
      const user = await UserModel.findOne({ token: token });
      const random = Math.floor(Math.random() * (100 - 10 + 1) + 10);
      const referalCode =
        "REND" +
        user?.username.substring(0, 3).toUpperCase() +
        random.toString();
      await user?.updateOne({
        $set: {
          isVerified: isVerified,
          referalCode: referalCode,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  static isValidToken = async (token: string) => {
    try {
      const user = new DBObject(await UserModel.findOne({ token: token }));
      await user.get();
      return true;
    } catch (err) {
      const error = err as Err;
      if (
        error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
        error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
      )
        return false;
      return false;
    }
  };

  static clearToken = async (token: string) => {
    try {
      const user = new DBObject(
        await UserModel.findOneAndUpdate(
          { token: token },
          {
            $set: { token: "" },
          }
        )
      ).get();
      await user?.save();
    } catch (err) {
      throw err;
    }
  };

  static hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };

  static setPassword = async (token: string, hash: string) => {
    try {
      const user = new DBObject(
        await UserModel.findOne({ token: token })
      ).get();
      await user?.updateOne({ $set: { password: hash } });
    } catch (err) {
      throw err;
    }
  };

  static createWalletForUser = async (user_id: string) =>
    await InAppWalletModel.create({
      balance: 5000,
      isActive: true,
      user: user_id,
    });

  static getUserByEmail = async (email: string) => {
    try {
      const query = await UserModel.findOne({ email: email });
      const user = new DBObject(query);
      return await user.get();
    } catch (err) {
      throw err;
    }
  };

  static isUserAlreadyExists = async (username: string, email: string) => {
    try {
      const query = await UserModel.findOne({
        $or: [{ username: username }, { email: email }],
      });
      const user = new DBObject(query);
      await user.get();
      return true;
    } catch (err) {
      const error = err as Err;
      if (
        error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
        error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
      )
        return false;
      return false;
    }
  };

  static createUser = async (
    name: string,
    username: string,
    email: string,
    hash: string,
    token: string,
    isGoogleAccount: boolean
  ) => {
    try {
      return await UserModel.create({
        displayName: name,
        username: username,
        email: email,
        password: hash,
        token: token,
        isActivated: false,
        isGoogleAccount: isGoogleAccount,
        isVerified: false,
        userType: Role.USER.toString(),
      });
    } catch (error) {
      console.log(error);
      throw ErrorFactory.TYPE_ERROR(`Invalid types`);
    }
  };

  static getUsersCount = async () => await UserModel.countDocuments();

  static authenticateUser = async (username: string) => {
    try {
      const query = await UserModel.findOne({
        $or: [{ username: username }, { email: username }],
      });
      return new DBObject(query).get();
    } catch (err) {
      throw err;
    }
  };

  static updateUser = async (
    userId: string,
    region: string,
    language: string,
    displayName: string
  ) => {
    try {
      const user = new DBObject(
        await UserModel.findById(userId)
      ).get() as UserDoc;
      await user.updateOne({
        $set: {
          region: region,
          language: language,
          displayName: displayName,
        },
      });
      await user.save();
    } catch (error) {
      throw error;
    }
  };

  static getUserDetails = async (userId: string) => {
    try {
      const user = new DBObject(
        await UserModel.findById(userId)
      ).get() as UserDoc;
      const response = {
        region: user.region,
        displayName: user.displayName,
        language: user.language,
        email: user.email,
      };
      return response;
    } catch (error) {
      throw error;
    }
  };

  static verifyPassword = async (password: string, hash: string) =>
    bcrypt.compareSync(password, hash);

  static verifyGoogleTokenAndFetchCredentials = async (token: string) => {
    const { payload } = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_OAUTH_CLIENT,
    });
    const { email, email_verified } = payload;
    const username = email.split("@")[0];
    return { email: email, username: username, emailVerified: email_verified };
  };

  static updateEmail = async (
    userId: string,
    newEmail: string,
    token: string
  ) => {
    try {
      const user = new DBObject(
        await UserModel.findById(userId)
      ).get() as UserDoc;
      await user?.updateOne({
        $set: {
          isVerified: false,
          email: newEmail,
          token: token,
        },
      });
      await user?.save();
    } catch (error) {
      throw error;
    }
  };

  static createEthereumWallet = async (pin: string) => {
    try {
      const mnemonic = bip39.generateMnemonic();
      const seed = bip39.mnemonicToSeedSync(mnemonic, pin);
      const wallet = HDWallet.fromSeed(seed).derive(`m/44'/60'/0'/0/0`);
      const addr = wallet.derive(0).getAddress().toString("hex");
      return { address: addr, mnemonic: mnemonic };
    } catch (error) {
      throw error;
    }
  };

  static retriveEthereumWallet = async (mnemonic: string, pin: string) => {
    try {
      const ismnemonic: boolean = bip39.validateMnemonic(mnemonic);
      if (ismnemonic) {
        const seed = bip39.mnemonicToSeedSync(mnemonic, pin);
        const wallet = HDWallet.fromSeed(seed).derive(`m/44'/60'/0'/0/0`);
        const addr = wallet.derive(0).getAddress().toString("hex");
        return { address: addr, mnemonic: mnemonic };
      } else {
        return { error: "wrong mnemonic given" };
      }
    } catch (error) {
      throw error;
    }
  };

  static createNearWallet = async (accountId: string) => {
    try {
      const { seedPhrase, publicKey, secretKey } = generateSeedPhrase();
      const myKeyStore = new keyStores.UnencryptedFileSystemKeyStore(
        NEAR_CREDS_PATH
      );
      NEAR_TESTNET_CONNECTION_CONFIG["keyStore"] = myKeyStore;
      const nearConnection = await connect(NEAR_TESTNET_CONNECTION_CONFIG);
      const creatorAccount = await nearConnection.account(
        "renderverse.testnet"
      );
      const resp = await creatorAccount.functionCall({
        contractId: "testnet",
        methodName: "create_account",
        args: {
          new_account_id: accountId,
          new_public_key: publicKey,
        },
        gas: "300000000000000",
        attachedDeposit: utils.format.parseNearAmount("0.01"),
      });
      const url =
        "https://wallet.testnet.near.org/auto-import-secret-key#" +
        accountId +
        "/" +
        secretKey;
      for (let outcome in resp.receipts_outcome) {
        if ("Failure" in resp.receipts_outcome[outcome].outcome.status) {
          return {
            error:
              "Error in creating account, Account ID may be already present" +
              accountId,
          };
        }
      }
      return {
        address: publicKey,
        mnemonic: seedPhrase,
        privatekey: secretKey,
        accountId: accountId,
        walletUrl: url,
      };
    } catch (error) {
      throw error;
    }
  };

  static getNEARNFTs = async (accountId: string) => {
    try {
      const myKeyStore = new keyStores.UnencryptedFileSystemKeyStore(
        NEAR_CREDS_PATH
      );
      NEAR_TESTNET_CONNECTION_CONFIG["keyStore"] = myKeyStore;
      const nearConnection = await connect(NEAR_TESTNET_CONNECTION_CONFIG);
      const creatorAccount = await nearConnection.account(
        "renderverse.testnet"
      );
      const contract = new Contract(
        creatorAccount, // the account object that is connecting
        "renderverse.testnet",
        {
          viewMethods: ["nft_tokens"],
          sender: creatorAccount, // account object to initialize and sign transactions.
        }
      );
      const resp = await contract.nft_tokens({
        limit: 10,
      });
      const nfts = [];
      for (let i = 0; i < resp.length; i++)
        if (resp[i].owner_id === accountId) nfts.push(resp[i]);
      return nfts;
    } catch (error) {
      throw error;
    }
  };

  static updateNFTHash = async (hash: string, url: string, s3url: string) => {
    const nft = await NFTModel.findOne({ s3Url: s3url });
    await nft?.updateOne({
      hash: hash,
      url: url,
    });
    await nft?.save();
  };

  //Change the logic for this method
  static mintNEARNFT = async (input: mintNFTInput) => {
    try {
      const myKeyStore = new keyStores.UnencryptedFileSystemKeyStore(
        NEAR_CREDS_PATH
      );
      NEAR_TESTNET_CONNECTION_CONFIG["keyStore"] = myKeyStore;
      const nearConnection = await connect(NEAR_TESTNET_CONNECTION_CONFIG);
      const creatorAccount = await nearConnection.account(
        "renderverse.testnet"
      );
      const contract = new Contract(
        creatorAccount, // the account object that is connecting
        "renderverse.testnet",
        {
          viewMethods: ["check_token"],
          changeMethods: ["nft_mint"],
          sender: creatorAccount, // account object to initialize and sign transactions.
        }
      );

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
      return resp;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  static retriveNearWallet = async (mnemonic: string) => {
    try {
      const { publicKey, secretKey } = parseSeedPhrase(mnemonic);
      // SHOW user account ID here
      const url = "https://wallet.testnet.near.org/recover-seed-phrase";
      return {
        address: publicKey,
        mnemonic: mnemonic,
        privatekey: secretKey,
        recoverUrl: url,
      };
    } catch (error) {
      throw error;
    }
  };
}
