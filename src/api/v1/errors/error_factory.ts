import { ErrorTypes } from './error_types'

export interface Err { message: string; name: ErrorTypes; }

export { ErrorTypes };

export class ErrorFactory {

	static OBJECT_NOT_FOUND(message: string): Err {
		throw {
			message: message,
			name: ErrorTypes.OBJECT_NOT_FOUND_ERROR.toString(),
		}
	}

	static INVALID_REFERAL_CODE(message: string): Err {
		throw {
			message: message,
			name: ErrorTypes.INVALID_REFERAL_CODE.toString(),
		}
	}

	static OBJECT_UN_DEFINED(message: string): Err {
		throw {
			message: message,
			name: ErrorTypes.OBJECT_UN_DEFINED_ERROR.toString(),
		}
	}

	static TYPE_ERROR(message: string) {
		throw {
			message: message,
			name: ErrorTypes.OBJECT_UN_DEFINED_ERROR.toString(),
		}
	}

	static REQUIRED_ERROR(message: string) {
		throw {
			message: message,
			name: ErrorTypes.OBJECT_UN_DEFINED_ERROR.toString(),
		}
	}
}
