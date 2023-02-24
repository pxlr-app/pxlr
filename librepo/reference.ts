import { AutoId } from "/libpxlr/autoid.ts";
import { BaseObject, deserializeBaseObject, serializeBaseObject } from "./object.ts";

export type ReferencePath = string;

const ReferencePathRegExp = new RegExp(`^([a-z0-9-]+/){1,}[a-z0-9%.+-]+$`, "i");

/**
 * Test if value is a ReferencePath
 * @param value The value to test
 * @returns If value is a ReferencePath
 */
export function assertReferencePath(
	value?: unknown,
): asserts value is ReferencePath {
	if (!value || typeof value !== "string" || !ReferencePathRegExp.test(value)) {
		throw new InvalidReferencePathError(value);
	}
}

export class InvalidReferencePathError extends Error {
	public name = "InvalidReferencePathError";
	public constructor(value: unknown) {
		super(`Invalid ReferencePath, got ${value}.`);
	}
}

export class Reference {
	#ref: ReferencePath;
	#commit: AutoId;
	#message: string;
	constructor(
		ref: ReferencePath,
		commitId: AutoId,
		message?: string,
	) {
		assertReferencePath(ref);
		this.#ref = ref;
		this.#commit = commitId;
		this.#message = message ?? "";
	}

	get ref() {
		return this.#ref;
	}
	get commit() {
		return this.#commit;
	}
	get message() {
		return this.#message;
	}

	static async readFromStream(ref: ReferencePath, readableStream: ReadableStream<Uint8Array>) {
		const obj = await deserializeBaseObject(readableStream);
		return new Reference(ref, obj.headers.get("commit") ?? "", await obj.text());
	}

	async writeToStream(writableStream: WritableStream<Uint8Array>) {
		const obj = new BaseObject({ commit: this.commit }, this.message);
		await serializeBaseObject(obj, writableStream);
	}
}
