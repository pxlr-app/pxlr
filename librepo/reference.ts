import { ResponseReaderStream, ResponseWriterStream } from "./response.ts";
import { AutoId } from "/libpxlr/autoid.ts";

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

	static async fromStream(hash: AutoId, stream: ReadableStream<Uint8Array>) {
		const decoder = new TextDecoder();
		const headers = new Map<string, string>();
		let message = "";
		const transformer = new ResponseWriterStream();
		stream.pipeThrough(transformer);
		for await (const chunk of transformer.readable) {
			if (chunk.type === "header") {
				headers.set(chunk.key, chunk.value);
			} else {
				message += decoder.decode(chunk.data);
			}
		}
		return new Reference(hash, headers.get("commit") ?? "", message);
	}

	toStream() {
		const transformer = new ResponseReaderStream();
		const writer = transformer.writable.getWriter();
		writer.write({ type: "header", key: "commicommitter", value: this.commit });
		writer.write({
			type: "body",
			data: new TextEncoder().encode(this.message),
		});
		writer.close();
		return transformer.readable;
	}
}
