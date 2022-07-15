import express from 'express';

const router = express.Router();

// middleware 
import { authorizeUserMiddleWare } from '../middlewares/jwtTokenAuthenticator.middleware';

import { UserController } from './controllers/user.controller'
import { InAppWalletController } from './controllers/in_app_wallet.controller'

import { orderPrefix, userPrefix, walletPrefix } from '../config'


router.post(`${userPrefix}/init`, UserController.initialize);
router.post(`${userPrefix}/login`, UserController.loginUser);
router.post(`${userPrefix}/register`, UserController.createUser);
router.post(`${userPrefix}/google-login`, UserController.createGoogleUser);
router.post(`${userPrefix}/google-mobile-login`, UserController.createMobileGoogleUser);

router.post(`${userPrefix}/validate/:token`, UserController.validateToken)

router.post(`${userPrefix}/forgot-password/request`, UserController.forgotPasswordSendRequest)
router.post(`${userPrefix}/change-password/:token`, UserController.changePassword)

router.get(`${userPrefix}/test-token`, authorizeUserMiddleWare, (req, res) => res.send("hello"));

router.post(`${walletPrefix}/balance`, InAppWalletController.getBalance)
router.post(`${walletPrefix}/transactions`, InAppWalletController.getTranscations)

router.post(`${orderPrefix}/create`, InAppWalletController.createOrder)
router.post(`${orderPrefix}/complete`, InAppWalletController.completeOrder)
router.post(`${orderPrefix}/rewards`, InAppWalletController.rewardUser)
router.post(`${orderPrefix}/rewards/init`, authorizeUserMiddleWare, InAppWalletController.initRewards)

export { router as userRoutes }