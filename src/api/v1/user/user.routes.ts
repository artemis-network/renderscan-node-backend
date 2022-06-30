import express from 'express';

const router = express.Router();

// middleware 
import { authorizeUserMiddleWare } from '../middlewares/jwtTokenAuthenticator.middleware';

// controllers
import { checkForAccountActivationController, verifyUserEmailController } from './controllers/verification.controller';
import { UserController } from './controllers/user.controller'
import { WalletController } from './controllers/wallet.controller'

import { userPrefix, walletPrefix } from '../config'
import { userInitController } from './controllers/user_init.controller';

router.post(`${userPrefix}/init`, userInitController);
router.post(`${userPrefix}/login`, UserController.loginUser);
router.post(`${userPrefix}/register`, UserController.createUser);
router.post(`${userPrefix}/google-login`, UserController.createGoogleUser);
router.post(`${userPrefix}/google-mobile-login`, UserController.createMobileGoogleUser);


router.post(`${userPrefix}/validate/:token`, UserController.validateToken)

router.post(`${userPrefix}/forgot-password/request`, UserController.forgotPasswordSendRequest)
router.post(`${userPrefix}/change-password/:token`, UserController.changePassword)

router.get(`${userPrefix}/test-token`, authorizeUserMiddleWare, (req, res) => res.send("hello"));

router.post(`${userPrefix}/users/activate-user`, checkForAccountActivationController)
router.post(`${userPrefix}/users/verify-user`, verifyUserEmailController)

router.post(`${walletPrefix}`,authorizeUserMiddleWare, WalletController.getWalletController)
router.post(`${walletPrefix}/deposit`,authorizeUserMiddleWare, WalletController.depositFundsController)

export { router as userRoutes }