import crypto from 'crypto';

const createToken = (): string => {
	try {
		return crypto.randomBytes(32).toString("hex")
	} catch (e) {
		throw new Error("Error");
	}
}




export { createToken };
