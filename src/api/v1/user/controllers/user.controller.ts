import { Request, Response } from "express";

import { Err } from "../../errors/error_factory";
import { ErrorTypes } from "../../errors/error_types";

import { logger } from "../../utils/logger";
import { Required } from "../../utils/required";
import { HttpFactory } from "../../http/http_factory";
import { EmailSender } from "../../utils/email";

import { JWT } from "../../utils/jwt";
import { Role, UserServices } from "../services/user.service";
import { ADMIN, EMAIL_CONFIG, NFT_STORAGE_API_KEY } from "../../../../config";
import { ReferalService } from "../services/referal.service";
import { RewardService } from "../services/reward.service";
import { RewardType } from "../models/reward.model";
import {
  PAYMENT,
  PAYMENT_TYPE,
  Transaction,
} from "../models/transaction.model";
import { InAppWalletServices } from "../services/in_app_wallet.service";
import { ImageServices } from "../../images/services/image.services";
import { RazorPayServices } from "../services/razor_pay.service";
import { NFTStorage, File } from "nft.storage";
import axios from "axios";
import path from "path";
import fs from "fs";
import mime from "mime";

const client = new NFTStorage({ token: NFT_STORAGE_API_KEY });

export class UserController {
  // helpers
  static async cleanRemoveUser(email: string) {
    const user = await UserServices.getUserByEmail(email);
    InAppWalletServices.cleanUpWallet(user._id);
    UserServices.cleanUpUser(user._id);
  }

  // @desc init admin
  // @route /renderscan/v1/users/init
  // @access private
  static initialize = async (req: Request, res: Response) => {
    const userCount = await UserServices.getUsersCount();
    if (userCount <= 0) {
      logger.info(">> create admin user");
      const hash = await UserServices.hashPassword(ADMIN.password);
      const user = await UserServices.createUser(
        ADMIN.username,
        ADMIN.username,
        ADMIN.email,
        hash,
        Role.ADMIN,
        false
      );
      await UserServices.createWalletForUser(user?._id);
      logger.info(">> successfully admin user");
      return HttpFactory.STATUS_200_OK({ message: "OK" }, res);
    }
    return HttpFactory.STATUS_200_OK({ message: "FAILED" }, res);
  };

  // @desc creating new user
  // @route /renderscan/v1/users/register
  // @access public
  static createUser = async (req: Request, res: Response) => {
    type input = {
      name: string;
      username: string;
      password: string;
      email: string;
      referalCode: string;
      address: string;
    };
    type wallet_input = { walletId: string };
    try {
      const { name, username, email, password, referalCode, address } =
        new Required(req.body)
          .addKey("username")
          .addKey("email")
          .addKey("password")
          .addKey("name")
          .addKey("address")
          .getItems() as input;
      try {
        const isUserExists = await UserServices.isUserAlreadyExists(
          username,
          email
        );
        if (isUserExists) {
          const response = {
            error: true,
            errorType: "USER_ALREADY_EXIST",
            message: "Username or Email already in use",
          };
          logger.info(`>> user already exists with ${username}, ${email}`);
          return HttpFactory.STATUS_200_OK(response, res);
        }
        try {
          const token: string = UserServices.createToken();
          const hash = await UserServices.hashPassword(password);
          const newUser = await UserServices.createUser(
            name,
            username,
            email,
            hash,
            token,
            false
          );

          const defaultAvatarUrl =
            "https://renderscan-user-avatars.s3.ap-south-1.amazonaws.com/avatar.png";
          await newUser.updateOne({ avatarUrl: defaultAvatarUrl });

          await UserServices.createWalletForUser(newUser._id);
          await InAppWalletServices.createBlockChainWallet(
            newUser._id,
            address
          );
          logger.info(`>> creating wallet for user : ${newUser._id}`);

          if (referalCode !== null && referalCode !== "") {
            logger.info(
              `>> user signed up with referalcode with referal code: ${referalCode}`
            );
            const referer = await ReferalService.getUserByReferalCode(
              referalCode
            );
            await ReferalService.addReferal({
              referalId: newUser._id,
              userId: referer._id,
            });
            const reward = await RewardService.getRewardByType(
              RewardType.REFERAL
            );
            const { walletId } = (await InAppWalletServices.getWallet(
              referer._id
            )) as wallet_input;
            const transaction = new Transaction({})
              .setAmount(reward.amount)
              .setCreatedAt(new Date())
              .setDescription(reward.description)
              .setPaymentType(PAYMENT_TYPE.REWARD)
              .setPayment(PAYMENT.CREDIT)
              .setRewardInfo(reward._id)
              .setWalletId(walletId)
              .get();
            await InAppWalletServices.createTranascation(transaction);
            logger.info(
              `>> creating reward referer for refering user: ${newUser._id}`
            );
          }

          const html: string = EmailSender.getEmailVerificationHTML(token);
          await EmailSender.sendMail(
            EMAIL_CONFIG.email,
            email,
            "Welcome to Renderverse, Please Verify Your Email",
            "",
            html.toString()
          );

          logger.info(`>> sending verification email for ${email}`);
          const response = {
            message:
              "Please click on the confirmation link we sent you by email to keep using our service.",
            errorType: "NONE",
            error: false,
          };
          return HttpFactory.STATUS_200_OK(response, res);
        } catch (error) {
          const err = error as Err;
          this.cleanRemoveUser(email);
          if (err.name === ErrorTypes.TYPE_ERROR) {
            const response = {
              error: true,
              errorType: "USER_ALREADY_EXIST",
              message: "Email is invalid or already taken",
            };
            logger.error(`>> bad request : ${err.message}`);
            return HttpFactory.STATUS_200_OK(response, res);
          }
          if (
            err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
            err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
          ) {
            const response = {
              error: true,
              invalidReferalCode: true,
              message: "Invalid referal code",
            };
            logger.error(`invalid referal code : ${err.message}`);
            return HttpFactory.STATUS_200_OK(response, res);
          }
          if (err.name === ErrorTypes.EMAIL_ERROR) {
            logger.error(`>> issue with email config : ${err.message}`);
            const response = {
              error: true,
              errorType: "USER_ALREADY_EXIST",
              message: "Internal Server Error",
            };
            return HttpFactory.STATUS_200_OK(response, res);
          }
          return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
        }
      } catch (err) {
        this.cleanRemoveUser(email);
        const error = err as Err;
        if (error.name === ErrorTypes.INVALID_REFERAL_CODE) {
          const response = {
            error: true,
            invalidReferalCode: true,
            message: "invalid referal code",
          };
          logger.error(`invalid referal code : ${error.message}`);
          return HttpFactory.STATUS_200_OK(response, res);
        }
        return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
      }
    } catch (err) {
      const error = err as Err;
      if (error.name === ErrorTypes.REQUIRED_ERROR) {
        logger.error(`>> bad request : ${error.message}`);
        return HttpFactory.STATUS_400_BAD_REQUEST(error, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
    }
  };

  // @desc validate user email by token
  // @route /renderscan/v1/users/validate/:token
  // @param token : string
  // @access public
  static validateEmail = async (req: Request, res: Response) => {
    type input = { token: string };
    type wallet_input = { walletId: string };
    try {
      const { token } = new Required(req.params)
        .addKey("token")
        .getItems() as input;
      const isVerified = await UserServices.isValidToken(token);
      await UserServices.setIsVerified(token, isVerified);
      logger.info(`>> token validation check done`);

      const reward = await RewardService.getRewardByType(RewardType.SIGNUP);
      const user = await UserServices.getUserByToken(token);
      const { walletId } = (await InAppWalletServices.getWallet(
        user._id
      )) as wallet_input;

      const alreadyClaimedReward =
        await RazorPayServices.isUserAlreadyClaimedForSignupBonous(walletId);
      if (alreadyClaimedReward) {
        return HttpFactory.STATUS_200_OK(
          { isVerified: true, message: "reward already claimed" },
          res
        );
      }

      const transaction = new Transaction({})
        .setAmount(reward.amount)
        .setCreatedAt(new Date())
        .setRewardInfo(reward._id)
        .setPayment(PAYMENT.CREDIT)
        .setDescription(reward.description)
        .setPaymentType(PAYMENT_TYPE.REWARD)
        .setWalletId(walletId)
        .get();
      await InAppWalletServices.createTranascation(transaction);
      logger.info(`>> creating reward for signing up for user : ${user._id}`);

      return HttpFactory.STATUS_200_OK({ isVerified: isVerified }, res);
    } catch (err) {
      const error = err as Err;
      if (
        error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
        ErrorTypes.OBJECT_UN_DEFINED_ERROR
      ) {
        logger.error(`${error.message}`);
        const response = { isVerified: false, ...error };
        return HttpFactory.STATUS_200_OK(response, res);
      }
      if (error.name === ErrorTypes.REQUIRED_ERROR) {
        logger.error(`${error.message}`);
        return HttpFactory.STATUS_400_BAD_REQUEST(error, res);
      }
    }
  };

  // @desc app login
  // @route /renderscan/v1/users/login
  // @access public
  static loginUser = async (req: Request, res: Response) => {
    type input = {
      username: string;
      password: string;
      address: string;
      nearPublicId: string;
    };
    const { username, password, nearPublicId, address } = new Required(req.body)
      .addKey("username")
      .addKey("password")
      .getItems() as input;
    try {
      console.log(req.body);
      const user = await UserServices.authenticateUser(username);
      if (user.isGoogleAccount) {
        const response = {
          error: true,
          message: "Sign in with Google",
          errorType: "UNAUTHORIZED_ACCESS",
        };
        return HttpFactory.STATUS_200_OK(response, res);
      }
      logger.info(`>> google account check done `);

      const authorized = await UserServices.verifyPassword(
        password,
        user?.password
      );
      if (!authorized) {
        const response = {
          error: true,
          message: "The username and password don't match.",
          errorType: "INVALID_CRENDENTAILS",
        };
        return HttpFactory.STATUS_200_OK(response, res);
      }
      logger.info(`>> authorization check done `);

      if (!user?.isVerified) {
        const response = {
          error: true,
          message: "⚠️ Your account hasn't been confirmed yet.",
          errorType: "UNAUTHORIZED_EMAIL",
        };
        return HttpFactory.STATUS_200_OK(response, res);
      }
      logger.info(`>> verification check done `);

      const token: string = JWT.generateJWTToken(user?._id);
      logger.info(`>> verification token done `);
      const response = {
        error: false,
        accessToken: token,
        email: user?.email,
        userId: user?._id,
        username: user?.username,
        errorType: "NONE",
        avatarUrl: user.avatarUrl,
      };
      await UserServices.updateNearBlockChainDetails(
        user?._id,
        nearPublicId,
        address
      );
      return HttpFactory.STATUS_200_OK(response, res);
    } catch (err) {
      const error = err as Error;
      if (error.name === ErrorTypes.REQUIRED_ERROR) {
        logger.error(`bad request : ${error.message}`);
        return HttpFactory.STATUS_200_OK(error, res);
      }
      if (error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        logger.error(`user does not exist : ${error.message}`);
        const response = {
          errorType: "INVALID_CREDENTIALS",
          message: "username or email does not exists",
          error: true,
        };
        return HttpFactory.STATUS_200_OK(response, res);
      }
      logger.error(`something went wrong : ${error.message}`);
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({}, res);
    }
  };

  // @desc forgot-password request
  // @route /renderscan/v1/users/forgot-password-request
  // @access public
  static forgotPasswordSendRequest = async (req: Request, res: Response) => {
    type input = { email: string };
    try {
      const { email } = new Required(req.body).getItems() as input;
      const token = await UserServices.setToken(email);
      logger.info(`>> generating token is done, `);
      const html: string = EmailSender.getForgotPasswordHTML(token);
      logger.info(">> sending forgot password email to - " + email);
      await EmailSender.sendMail(
        EMAIL_CONFIG.email,
        email,
        "Password Change",
        "",
        html.toString()
      );
      logger.info(">> sent forgot password email");
      return HttpFactory.STATUS_200_OK({ isEmailSend: true }, res);
    } catch (err) {
      const error = err as Err;
      if (error.name === ErrorTypes.EMAIL_ERROR) {
        logger.error(`email service unavailable : ${error.message}`);
        return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(error, res);
      }
      if (error.name === ErrorTypes.REQUIRED_ERROR) {
        logger.error(`bad request : ${error.message}`);
        return HttpFactory.STATUS_400_BAD_REQUEST(error, res);
      }
      if (
        error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR ||
        error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR
      ) {
        const e = { isEmailSend: false, message: "user does not exists" };
        return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(e, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
    }
  };

  // @desc change password form
  // @route /renderscan/v1/users/change-password/:token
  // @param token : string
  // @access public
  static changePassword = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const isValidToken = await UserServices.isValidToken(token);
      if (isValidToken) {
        return res.render("changePasswordForm.ejs", {
          warning: false,
          success: false,
          error: false,
        });
      }
      return HttpFactory.STATUS_200_OK({ message: "Unauthorized access" }, res);
    } catch (err) {
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
    }
  };

  // @desc change password form
  // @route /renderscan/v1/users/change-password/:token
  // @param token : string
  // @access public
  static changePasswordPost = async (req: Request, res: Response) => {
    type inputOne = { token: string };
    type inputTwo = { password: string; confirmPassword: string };
    try {
      const { token } = new Required(req.params).getItems() as inputOne;
      const { password, confirmPassword } = new Required(
        req.body
      ).getItems() as inputTwo;

      const passw = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;

      if (!password.trim().match(passw))
        return res.render("changePasswordForm.ejs", {
          warning: true,
          success: false,
          error: false,
        });
      if (password.trim() !== confirmPassword.trim())
        return res.render("changePasswordForm.ejs", {
          warning: true,
          success: false,
          error: false,
        });
      const isVerified = await UserServices.isValidToken(token);
      if (isVerified) {
        const hash = await UserServices.hashPassword(password);
        await UserServices.setPassword(token, hash);
        await UserServices.updateToken(token);
        return res.render("changePasswordForm.ejs", {
          warning: false,
          success: true,
          error: false,
        });
      }
      logger.info(`invalid token or user does not exits`);
      return res.render("changePasswordForm.ejs", {
        warning: false,
        success: false,
        error: true,
      });
    } catch (err) {
      const error = err as Err;
      if (error.name === ErrorTypes.REQUIRED_ERROR) {
        logger.error(`>> bad request : ${error}`);
        return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
      }
      logger.error(`>> something went wrong ${error}`);
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
    }
  };

  // @desc google-login for web app
  // @route /renderscan/v1/users/google-login
  // @access public
  static createGoogleUser = async (req: Request, res: Response) => {
    type input = { token: string };
    try {
      const { token } = new Required(req.body).getItems() as input;
      const { username, email, emailVerified } =
        await UserServices.verifyGoogleTokenAndFetchCredentials(token);
      try {
        if (emailVerified) {
          const isExists = await UserServices.isUserAlreadyExists(
            username,
            email
          );
          if (isExists) {
            const user = await UserServices.getUserByEmail(email);
            if (user?.isGoogleAccount === false) {
              const response = {
                error: true,
                message:
                  "It's not a google account, SignIn with Email & Password",
                errorType: "UNAUTHORIZED_ACCESS",
              };
              return HttpFactory.STATUS_200_OK(response, res);
            }
            const token: string = JWT.generateJWTToken(user?._id);
            const response = {
              error: false,
              errorType: "NONE",
              username: username,
              accessToken: token,
            };
            return HttpFactory.STATUS_200_OK(response, res);
          }
          const { _id }: any = await UserServices.createUser(
            username,
            username,
            email,
            "",
            "",
            true
          );
          UserServices.createWalletForUser(_id);
          const token: string = JWT.generateJWTToken(_id);
          const response = {
            error: false,
            errorType: "NONE",
            username: username,
            accessToken: token,
          };
          return HttpFactory.STATUS_200_OK(response, res);
        }
      } catch (err) {
        const error = err as Err;
        if (
          error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
          error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
        ) {
          logger.error(`user does not exists ${err}`);
          return HttpFactory.STATUS_404_NOT_FOUND(err, res);
        }
        if (error.name === ErrorTypes.TYPE_ERROR) {
          logger.error(`bad request ${err}`);
          return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
        }
        logger.error(`something went wrong ${err}`);
        return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
      }
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        logger.error(`bad request, ${err}`);
        return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
      }
      logger.error(`something went wrong, ${err}`);
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
    }
  };

  // @desc google-login for mobile app
  // @route /renderscan/v1/users/google-mobile-login
  // @access public
  static createMobileGoogleUser = async (req: Request, res: Response) => {
    type input = { email: string; address: string; nearPublicId: string };
    type wallet = { walletId: string };
    try {
      const { email, address, nearPublicId } = new Required(req.body)
        .addKey("email")
        .addKey("address")
        .getItems() as input;
      const username = email.split("@")[0];
      try {
        const isExists = await UserServices.isUserAlreadyExists(
          username,
          email
        );
        if (isExists) {
          const user = await UserServices.getUserByEmail(email);
          if (user?.isGoogleAccount === false) {
            const response = {
              error: true,
              message:
                "It's not a google account, SignIn with Email & Password",
              errorType: "UNAUTHORIZED_ACCESS",
            };
            return HttpFactory.STATUS_200_OK(response, res);
          }

          const token: string = JWT.generateJWTToken(user?._id);
          const response = {
            error: false,
            errorType: "NONE",
            username: username,
            accessToken: token,
            userId: user._id,
            email: email,
            message: "SUCCESS",
            avatarUrl: user.avatarUrl,
          };
          await UserServices.updateNearBlockChainDetails(
            user._id,
            nearPublicId,
            address
          );
          return HttpFactory.STATUS_200_OK(response, res);
        }
        const stdToken = UserServices.createToken();
        const { _id }: any = await UserServices.createUser(
          username,
          username,
          email,
          "",
          stdToken,
          true
        );

        const defaultAvatarUrl =
          "https://renderscan-user-avatars.s3.ap-south-1.amazonaws.com/avatar.png";
        await UserServices.setAvtarUrl(_id, defaultAvatarUrl);

        UserServices.createWalletForUser(_id);
        await InAppWalletServices.createBlockChainWallet(_id, address);
        await UserServices.setIsVerified(stdToken, true);

        const reward = await RewardService.getRewardByType(RewardType.SIGNUP);
        const { walletId } = (await InAppWalletServices.getWallet(
          _id
        )) as wallet;
        const alreadyClaimedReward =
          await RazorPayServices.isUserAlreadyClaimedForSignupBonous(walletId);
        if (!alreadyClaimedReward) {
          const transaction = new Transaction({})
            .setAmount(reward.amount)
            .setCreatedAt(new Date())
            .setRewardInfo(reward._id)
            .setPayment(PAYMENT.CREDIT)
            .setDescription(reward.description)
            .setPaymentType(PAYMENT_TYPE.REWARD)
            .setWalletId(walletId)
            .get();
          await InAppWalletServices.createTranascation(transaction);
        }

        const token: string = JWT.generateJWTToken(_id);
        const response = {
          error: false,
          errorType: "NONE",
          username: username,
          accessToken: token,
          userId: _id,
          email: email,
          message: "SUCCESS",
          avatarUrl: defaultAvatarUrl,
        };
        await UserServices.updateNearBlockChainDetails(
          _id,
          nearPublicId,
          address
        );
        return HttpFactory.STATUS_200_OK(response, res);
      } catch (err) {
        const error = err as Err;
        if (
          error.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
          error.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
        ) {
          logger.error(`user does not exists ${err}`);
          return HttpFactory.STATUS_404_NOT_FOUND(err, res);
        }
        if (error.name === ErrorTypes.TYPE_ERROR) {
          logger.error(`bad request ${err}`);
          return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
        }
        logger.error(`something went wrong ${err}`);
        return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
      }
    } catch (err) {
      const error = err as Err;
      if (error.name === ErrorTypes.REQUIRED_ERROR) {
        logger.error(`bad request, ${error}`);
        return HttpFactory.STATUS_400_BAD_REQUEST(err, res);
      }
      logger.error(`something went wrong, ${error}`);
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err, res);
    }
  };

  // @desc set avatar url
  // @route /renderscan/v1/users/set-avatar
  // @access public
  static setAvatarUrl = async (req: Request, res: Response) => {
    console.log(req.body);
    if (!req.file)
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(
        { message: "empty file" },
        res
      );
    try {
      type input = { userId: string };
      const { userId } = new Required(JSON.parse(JSON.stringify(req.body)))
        .addKey("userId")
        .getItems() as input;
      const filename: string =
        (await UserServices.getUsername(userId)) + ".png";
      const s3 = ImageServices.getAWSS3Object();
      const filePath = req.file.path;
      const params = await ImageServices.getAvatarFileToUpload(
        filename,
        filePath
      );
      s3.upload(params, function (err: any, data: any) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
          ImageServices.deleteAvatarFiles(filePath);
        }
        return HttpFactory.STATUS_200_OK({ isUploaded: true }, res);
      });
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  // @desc get referal code
  // @route /renderscan/v1/users/referal-code
  // @access public
  static getReferalCode = async (req: Request, res: Response) => {
    try {
      console.log(req.body);
      type input = { userId: string };
      const { userId } = new Required(req.body).getItems() as input;
      const code: string = await UserServices.getReferalCode(userId);
      return HttpFactory.STATUS_200_OK({ referalCode: code }, res);
    } catch (error) {
      const err = error as Err;
      console.log(error);
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  // @desc get referals
  // @route /renderscan/v1/users/referals
  // @access public
  static getReferals = async (req: Request, res: Response) => {
    try {
      type input = { userId: string };
      const { userId } = new Required(req.body).getItems() as input;
      const referals: any[] = await ReferalService.getReferals(userId);
      return HttpFactory.STATUS_200_OK({ referals: referals }, res);
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  // @desc update user
  // @route /renderscan/v1/users/update
  // @access public
  static updateUser = async (req: Request, res: Response) => {
    try {
      type input = {
        userId: string;
        displayName: string;
        language: string;
        region: string;
      };
      const { userId, displayName, language, region } = new Required(
        req.body
      ).getItems() as input;
      await UserServices.updateUser(userId, region, language, displayName);
      return HttpFactory.STATUS_200_OK(
        { message: "User updated successfully", error: false },
        res
      );
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  // @desc user details
  // @route /renderscan/v1/users/details
  // @access public
  static getUserDetails = async (req: Request, res: Response) => {
    try {
      type input = { userId: string };
      const { userId } = new Required(req.body).getItems() as input;
      console.log(userId);
      const response = await UserServices.getUserDetails(userId);
      console.log(response);
      return HttpFactory.STATUS_200_OK({ ...response }, res);
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  // @desc update new email request
  // @route /renderscan/v1/users/update-email
  // @access public
  static updateNewEmail = async (req: Request, res: Response) => {
    try {
      type input = { userId: string; email: string };
      const { userId, email } = new Required(req.body).getItems() as input;
      const isUserExists = await UserServices.isUserAlreadyExists("", email);
      if (isUserExists) {
        const response = { error: true, message: "Email already in use" };
        logger.info(`>> user already exists with ${""}, ${email}`);
        return HttpFactory.STATUS_200_OK(response, res);
      }
      const token = UserServices.createToken();
      await UserServices.updateEmail(userId, email, token);
      const html: string = EmailSender.getEmailVerificationHTML(token);
      await EmailSender.sendMail(
        EMAIL_CONFIG.email,
        email,
        "Welcome to Renderverse, Please Verify Your Email",
        "",
        html.toString()
      );
      logger.info(`>> sending verification email for ${email}`);
      return HttpFactory.STATUS_200_OK(
        { message: "Verification email has been sent", error: false },
        res
      );
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  static createEthereumWallet = async (req: Request, res: Response) => {
    try {
      type input = { pin: string; userId: string };
      const { pin, userId } = new Required(req.body).getItems() as input;
      const resp = await UserServices.createEthereumWallet(pin);
      return HttpFactory.STATUS_200_OK({ ...resp }, res);
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  static retriveEthereumWallet = async (req: Request, res: Response) => {
    console.log(req.body);
    type input = { mnemonic: string; pin: string };
    try {
      const { mnemonic, pin } = new Required(req.body).getItems() as input;
      const resp = await UserServices.retriveEthereumWallet(mnemonic, pin);
      console.log(resp);
      return HttpFactory.STATUS_200_OK({ ...resp }, res);
    } catch (error) {
      console.log(error);
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  static createNearWallet = async (req: Request, res: Response) => {
    try {
      type input = { accountId: string };
      const { accountId } = new Required(req.body).getItems() as input;
      const resp = await UserServices.createNearWallet(accountId);
      console.log(resp);
      return HttpFactory.STATUS_200_OK(resp, res);
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };

  static getNEARNFTS = async (req: Request, res: Response) => {
    try {
      const { accountId } = req.body;
      const nfts = await UserServices.getNEARNFTs(accountId);
      return res.status(200).json(nfts);
    } catch (error) {
      console.log(error);
      return res.status(200).json(error);
    }
  };

  // @desc mint near nft
  // @route /renderscan/v1/users/mintnearnft
  // @access public
  static mintNearNFT = async (req: Request, res: Response) => {
    try {
      type input = {
        tokenId: string;
        title: string;
        description: string;
        receiver_id: string;
        media: string;
      };
      const { tokenId, title, description, receiver_id, media } =
        req.body as input;
      const data = await axios.get(media);

      const metadata = await client.store({
        name: title,
        description: description,
        image: new File([data.data], path.basename(media), {
          type: "image/png",
        }),
      });

      await UserServices.updateNFTHash(
        metadata.data.image.toString(),
        metadata.ipnft,
        media
      );
      const resp = await UserServices.mintNEARNFT({
        tokenId,
        title,
        description,
        receiver_id,
        media,
      });
      return HttpFactory.STATUS_200_OK(resp, res);
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ err }, res);
    }
  };

  static retriveNearWallet = async (req: Request, res: Response) => {
    try {
      type input = { mnemonic: string };
      const { mnemonic } = new Required(req.body).getItems() as input;
      const resp = await UserServices.retriveNearWallet(mnemonic);
      return HttpFactory.STATUS_200_OK({ ...resp }, res);
    } catch (error) {
      const err = error as Err;
      if (err.name === ErrorTypes.REQUIRED_ERROR) {
        return HttpFactory.STATUS_400_BAD_REQUEST(err.message, res);
      }
      if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
        return HttpFactory.STATUS_404_NOT_FOUND(err.message, res);
      }
      return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR(err.message, res);
    }
  };
}
