import nodemailer from 'nodemailer';
import { EMAIL_CONFIG } from '../../../config'
import { verificationHtml, forgotPasswordHtml } from './verification_htmls';

export class EmailSender {

	static getTransporter() {
		console.log("emailing from - " + process.env.EMAIL_VERIFICATION_EMAIL)
		console.log("host - " + process.env.EMAIL_VERIFICATION_HOST)
		return nodemailer.createTransport({
			host: EMAIL_CONFIG.host,
			port: Number(EMAIL_CONFIG.port),
			secure: false,
			requireTLS: true,
			auth: {
				user: EMAIL_CONFIG.username,
				pass: EMAIL_CONFIG.password,
			},
		});
	}

	static async sendMail(from: string, to: string, subject: string, text: string, html: string) {
		try {
			return await this.getTransporter().sendMail({
				from: EMAIL_CONFIG.email, // sender address
				to: to, // list of receivers
				subject: subject, // Subject line
				text: text, // plain text body
				html: html, // html body
			});
		}
		catch (err: any) {
			console.log("email error - " + err);
		}
	}

	static getEmailVerificationHTML(token: string): string {
		const url: string = `https://api.renderverse.io/renderscan/v1/users/validate/${token}`
		// const url: string = `http://localhost:5001/renderscan/v1/users/validate/${token}`
		return verificationHtml(url);
	}

	static getForgotPasswordHTML(token: string): string {
		const url: string = `https://api.renderverse.io/renderscan/v1/users/change-password/${token}`
		return forgotPasswordHtml(url);
	}
}