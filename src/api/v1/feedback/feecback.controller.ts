import { Request, Response } from "express";
import { Err, ErrorTypes } from "../errors/error_factory";
import { HttpFactory } from "../http/http_factory";
import { Required } from "../utils/required";
import { FeedBackInterface } from "./feedback.model";
import { FeedBackServices } from "./feedback.service";

// @desc submit feedback 
// @route /renderscan/v1/feedback/post
// @access public
export class FeedBackController {
	static createFeedBack = async (req: Request, res: Response) => {
		try {
			console.log(req.body)
			const input = new Required(req.body).getItems() as FeedBackInterface
			await FeedBackServices.createFeedback(input)
			return HttpFactory.STATUS_200_OK({ message: "Feedback submitted", error: false }, res);
		} catch (error) {
			console.log(error)
			const err = error as Err;
			if (err.name == ErrorTypes.REQUIRED_ERROR)
				return HttpFactory.STATUS_400_BAD_REQUEST({ message: "bad request", error: true }, res);
			return HttpFactory.STATUS_500_INTERNAL_SERVER_ERROR({ message: "Something went wrong", error: true }, res);
		}
	}
}