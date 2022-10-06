import { AutoId } from "../autoid.ts";

export abstract class Object {
	#id: AutoId;
	#type: string;
	constructor(id: string, type: string) {
		this.#id = id;
		this.#type = type;
	}
	get id() {
		return this.#id;
	}
	get type() {
		return this.#type;
	}
}

export abstract class ObjectSerializer<T extends Object> {
	abstract serialize(stream: WritableStream, object: T): Promise<void>;
	abstract deserialize(stream: ReadableStream): Promise<T>;
}
