import express from 'express';
import multer from 'multer';

const router = express.Router();

// middleware 
import { authorizeUserMiddleWare } from '../middlewares/jwtTokenAuthenticator.middleware';

import { UserController } from './controllers/user.controller'
import { InAppWalletController } from './controllers/in_app_wallet.controller'

import { userPrefix } from '../config'

const upload = multer({ dest: 'uploads/' });

router.post(`${userPrefix}/init`, UserController.initialize);
router.post(`${userPrefix}/login`, UserController.loginUser);
router.post(`${userPrefix}/register`, UserController.createUser);
router.post(`${userPrefix}/google-login`, UserController.createGoogleUser);
router.post(`${userPrefix}/google-mobile-login`, UserController.createMobileGoogleUser);

router.get(`${userPrefix}/validate/:token`, UserController.validateEmail)

router.post(`${userPrefix}/forgot-password/request`, UserController.forgotPasswordSendRequest)
router.get(`${userPrefix}/change-password/:token`, UserController.changePassword)
router.post(`${userPrefix}/change-password/:token`, UserController.changePasswordPost)


router.get(`${userPrefix}/test-token`, authorizeUserMiddleWare, (req, res) => res.send("hello"));

router.post(`${userPrefix}/balance`, InAppWalletController.getBalance)
router.post(`${userPrefix}/transactions`, InAppWalletController.getTranscations)
router.post(`${userPrefix}/set-avatar`, upload.single('avatar'), UserController.setAvatarUrl)
router.post(`${userPrefix}/referal-code`, UserController.getReferalCode)
router.post(`${userPrefix}/referals`, UserController.getReferals)
router.post(`${userPrefix}/update`, UserController.updateUser)
router.post(`${userPrefix}/details`, UserController.getUserDetails)
router.post(`${userPrefix}/update-email`, UserController.updateNewEmail)

export { router as userRoutes }