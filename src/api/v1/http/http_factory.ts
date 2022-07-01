import { HTTP_STATUS } from './http_status'

import { Response } from "express";
import { HttpResponseEntityBuilder } from './http_entity_buildter'

export class HttpFactory {
	static STATUS_404_NOT_FOUND(data: any, responseEntity: Response) {
		return new HttpResponseEntityBuilder({})
			.setData(data)
			.setResponseEntity(responseEntity)
			.setStatus(HTTP_STATUS.NOT_FOUND)
			.getResponseEntity();
	}

	static STATUS_200_OK(data: any, responseEntity: Response) {
		return new HttpResponseEntityBuilder({})
			.setData(data)
			.setResponseEntity(responseEntity)
			.setStatus(HTTP_STATUS.OK)
			.getResponseEntity();
	}

	static STATUS_500_INTERNAL_SERVER_ERROR(data: any, responseEntity: Response) {
		return new HttpResponseEntityBuilder({})
			.setData(data)
			.setResponseEntity(responseEntity)
			.setStatus(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.getResponseEntity();
	}


	static STATUS_400_BAD_REQUEST(data: any, responseEntity: Response) {
		return new HttpResponseEntityBuilder({})
			.setData(data)
			.setResponseEntity(responseEntity)
			.setStatus(HTTP_STATUS.BAD_REQUEST)
			.getResponseEntity();
	}
}