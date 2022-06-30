import winston from 'winston';
const { combine, timestamp, printf, colorize, align } = winston.format;


export const logger = winston.createLogger({
	level: 'info',
	format: combine(
		colorize({ all: true }),
		timestamp({
			format: 'YYYY-MM-DD hh:mm:ss.SSS A',
		}),
		align(),
		printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
	),
	transports: [
		//
		// - Write all logs with importance level of `error` or less to `error.log`
		// - Write all logs with importance level of `info` or less to `combined.log`
		//
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: 'combined.log' }),
	],
});

logger.add(new winston.transports.Console({
	format: winston.format.simple(),
}));