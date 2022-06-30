import { HTTP_STATUS } from './http_status'
import { Response } from 'express'

interface HttpResponse { data: any, res: Response }

export class HttpResponseFactory {
	static resp(status: HTTP_STATUS, data: any, res: Response) {
		return res.status(status).json({ ...data, })
	}

	static OK(http: HttpResponse) {
		return this.resp(HTTP_STATUS.OK, http.data, http.res);
	}

	static CREATED(http: HttpResponse) {
		return this.resp(HTTP_STATUS.CREATED, http.data, http.res);
	}


	static NOT_FOUND(http: HttpResponse) {
		return this.resp(HTTP_STATUS.NOT_FOUND, http.data, http.res);
	}

	static INTERNAL_SERVER_ERROR(http: HttpResponse) {
		return this.resp(HTTP_STATUS.INTERNAL_SERVER_ERROR, http.data, http.res);
	}

	static NOT_ACCEPTABLE(http: HttpResponse) {
		return this.resp(HTTP_STATUS.NOT_ACCEPTABLE, http.data, http.res);
	}
}
