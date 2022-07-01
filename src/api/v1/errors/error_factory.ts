import { ErrorTypes } from './types.error'

export class ErrorFactory extends Error {

	static OBJECT_NOT_FOUND(message: string) {
		throw {
			message: message,
			name: ErrorTypes.OBJECT_NOT_FOUND_ERROR.toString(),
		}
	}

	static OBJECT_UN_DEFINED(message: string) {
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
