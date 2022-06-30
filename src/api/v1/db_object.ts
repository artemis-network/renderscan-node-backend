import { DBErrors } from './errors/db.errors'

export class DBObject {

	object: any;

	constructor(object: any) { this.object = object }

	get(): any {
		if (this.object === null)
			return DBErrors.OBJECT_NOT_FOUND("object does not exist")
		if (this.object === undefined)
			return DBErrors.OBJECT_UN_DEFINED("object undefined")
		return this.object
	}

}