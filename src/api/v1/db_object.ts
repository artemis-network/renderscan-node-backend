import { ErrorFactory } from './errors/error_factory'

export class DBObject {

	object: any;

	constructor(object: any) { this.object = object }

	get(): any {
		if (this.object === null)
			throw ErrorFactory.OBJECT_NOT_FOUND("object not found")
		if (this.object === undefined)
			throw ErrorFactory.OBJECT_UN_DEFINED("object undefined")
		return this.object
	}

}