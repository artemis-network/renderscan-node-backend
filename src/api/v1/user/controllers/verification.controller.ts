import { Request, Response } from 'express';
import { checkForAccountActivation, verifyUserEmail } from '../services/verification.service';

export const checkForAccountActivationController = async (req: Request, res: Response) => {
	const { username, code } = req.body;
	const result = await checkForAccountActivation(username, code);
	res.status(200).json(result)

}


export const verifyUserEmailController = async (req: Request, res: Response) => {
	const { username, token } = req.body;
	const result = await verifyUserEmail(username, token);
	res.status(200).json(result);
}
