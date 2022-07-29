import express from 'express';

const router = express.Router();

// middleware 
import { paymentsPrefix } from '../config'
import { PaymentsController } from './controllers/payments.controller'
import { authorizeUserMiddleWare } from '../middlewares/jwtTokenAuthenticator.middleware';
import { adminAuthenticatorMiddleWare } from '../middlewares/adminAuthenticator.middleware';

router.post(`${paymentsPrefix}/create`, PaymentsController.createOrder)
router.post(`${paymentsPrefix}/complete`, PaymentsController.completeOrder)
router.post(`${paymentsPrefix}/rewards`, PaymentsController.rewardUser)
router.post(`${paymentsPrefix}/rewards/init`, adminAuthenticatorMiddleWare, PaymentsController.initRewards)

export { router as paymentsRoutes }
