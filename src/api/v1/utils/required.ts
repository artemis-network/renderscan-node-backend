import { ErrorFactory } from '../errors/error_factory'

export class Required {
	keys: Array<string> = [];
	object: Object;
	constructor(object: Object) {
		this.object = object;
	}
	addKey(key: string) {
		this.keys.push(key);
		return this;
	}
	getItems() {
		for (let i = 0; i < this.keys.length; i++) {
			if (!this.object.hasOwnProperty(this.keys[i])) {
				throw ErrorFactory.REQUIRED_ERROR("requrired : " + this.keys[i])
			}
		}
		return this.object
	}
}