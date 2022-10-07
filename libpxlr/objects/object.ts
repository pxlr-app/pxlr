import { AutoId, isAutoid } from "../autoid.ts";

export abstract class Object {
	constructor(public readonly id: AutoId, public readonly kind: string) {
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
	}
}

export abstract class ObjectSerializer<T extends Object> {
	abstract serialize(stream: WritableStream, object: T): Promise<void>;
	abstract deserialize(stream: ReadableStream): Promise<T>;
}
