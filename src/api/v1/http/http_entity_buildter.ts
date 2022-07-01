import { Response } from "express";
import { HTTP_STATUS } from "./http_status";

export interface HttpResponseEntity {
	status?: HTTP_STATUS, data?: any, responseEntity?: Response
}

export class HttpResponseEntityBuilder {
	httpResponseEntity: HttpResponseEntity;

	constructor(httpResponseEntity: HttpResponseEntity) {
		this.httpResponseEntity = httpResponseEntity;
	}

	setStatus(status: HttpResponseEntity["status"]) {
		this.httpResponseEntity.status = status
		return this;
	}
	setData(data: HttpResponseEntity["data"]) {
		this.httpResponseEntity.data = data
		return this;
	}
	setResponseEntity(responseEntity: HttpResponseEntity["responseEntity"]) {
		this.httpResponseEntity.responseEntity = responseEntity
		return this;
	}
	getResponseEntity() {
		const httpResponseEntity = this.httpResponseEntity;
		return this.httpResponseEntity
			.responseEntity?.status(httpResponseEntity.status ?? 500)
			.json({ ...httpResponseEntity.data });
	}
}