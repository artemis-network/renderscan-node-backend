export enum ErrorTypes {
	OBJECT_NOT_FOUND_ERROR = "OBJECT_NOT_FOUND_ERROR",
	OBJECT_UN_DEFINED_ERROR = "OBJECT_UN_DEFINED_ERROR",
	EMAIL_ERROR = "EMAIL_ERROR",
}

export class DBErrors extends Error {

	static OBJECT_NOT_FOUND(message: string) {
		const error: Error = {
			message: message,
			name: ErrorTypes.OBJECT_NOT_FOUND_ERROR.toString(),
		}
		throw error;
	}


	static OBJECT_UN_DEFINED(message: string) {
		const error: Error = {
			message: message,
			name: ErrorTypes.OBJECT_UN_DEFINED_ERROR.toString(),
		}
		throw error;
	}

	static EMAIL_ERROR(message: string) {
		const error: Error = {
			message: message,
			name: ErrorTypes.EMAIL_ERROR.toString(),
		}
		throw error;
	}
}
