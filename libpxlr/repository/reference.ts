import { assertAutoId, AutoId } from "../autoid.ts";
import { deserializeObjectLike, Object } from "./object.ts";

export type ReferencePath = string;

const ReferencePathRegExp = new RegExp(`^([a-z0-9-]+/){1,}[a-z0-9%.+-]+$`, "i");

/**
 * Test if value is a ReferencePath
 * @param value The value to test
 * @returns If value is a ReferencePath
 */
export function assertReferencePath(value?: unknown): asserts value is ReferencePath {
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

	async serialize(stream: WritableStream<Uint8Array>) {
		const encoder = new TextEncoder();
		const writer = stream.getWriter();
		await writer.write(encoder.encode(`ref ${this.ref}\r\n`));
		await writer.write(encoder.encode(`commit ${this.commit}\r\n`));
		await writer.write(encoder.encode(`\r\n`));
		await writer.write(encoder.encode(this.message));
		await writer.close();
	}

	static async deserialize(stream: ReadableStream<Uint8Array>): Promise<Reference> {
		const { headers, body } = await deserializeObjectLike(stream);
		const ref = headers.get("ref") ?? "";
		headers.delete("ref");
		assertReferencePath(ref);
		const commit = headers.get("commit") ?? "";
		headers.delete("commit");
		assertAutoId(commit);
		const message = await new Response(body).text();
		return new Reference(ref, commit, message);
	}
}