import { encode, decode, TAlgorithm } from "jwt-simple";
import { JWT_SECRET } from '../../../config'
import { Role } from '../user/services/user.service'

interface JwtCreds { session: any, issued: number, expires: number }

export class JWT {

	static unPackSession = (token: string): JwtCreds => this.decodeJWTToken(token)

	static generateJWTToken = (userId: string): string => {
		const session = { userId: userId }
		// Always use HS512 to sign the token
		const algorithm: TAlgorithm = "HS512";
		// Determine when the token should expire
		const issued = new Date().getTime()
		const fiveHoursInMs = 60 * 60 * 5 * 1000;
		const expires = issued + fiveHoursInMs;
		const encoded: any = { session: session, issued: issued, expires: expires };
		return encode(encoded, JWT_SECRET, algorithm);
	}

	static decodeJWTToken = (token: string): JwtCreds => decode(token, JWT_SECRET);
}
