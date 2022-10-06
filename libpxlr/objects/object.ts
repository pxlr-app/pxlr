import { AutoId } from "../autoid.ts";

export abstract class Object {
	#id: AutoId;
	#kind: string;
	constructor(id: string, kind: string) {
		this.#id = id;
		this.#kind = kind;
	}
	get id() {
		return this.#id;
	}
	get kind() {
		return this.#kind;
	}
}

export abstract class ObjectSerializer<T extends Object> {
	abstract serialize(stream: WritableStream, object: T): Promise<void>;
	abstract deserialize(stream: ReadableStream): Promise<T>;
}
