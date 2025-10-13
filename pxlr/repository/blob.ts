import { sha1 } from "@noble/hashes/legacy.js";
import { assert } from "@std/assert/assert";
import { ResponseTransformStream } from "./response.ts";

export class Blob {
	#hash: string;
	#headers: Headers;
	#content: Uint8Array<ArrayBuffer>;

	constructor(hash: string, headerInits: HeadersInit, content: Uint8Array<ArrayBuffer>) {
		this.#hash = hash;
		this.#headers = new Headers(headerInits);
		this.#content = content;
	}

	static async new(content: Uint8Array<ArrayBuffer>): Promise<Blob>;
	static async new(headersInit: HeadersInit, content: Uint8Array<ArrayBuffer>): Promise<Blob>;
	static async new(headersInit_or_content: HeadersInit | Uint8Array<ArrayBuffer>, content?: Uint8Array<ArrayBuffer>): Promise<Blob> {
		const headersInit = headersInit_or_content instanceof Uint8Array ? {} : headersInit_or_content;
		content = headersInit_or_content instanceof Uint8Array ? headersInit_or_content : content!;

		const headers = new Headers(headersInit);
		headers.has("content-type") || headers.set("content-type", "application/octet-stream");
		headers.set("content-length", content.byteLength.toString());
		const tmp = new Blob("", headers, content);
		const hasher = sha1.create();
		for await (const chunk of tmp.toReadableStream()) {
			hasher.update(chunk);
		}
		const hashBuffer = hasher.digest();
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return new Blob(hash, headers, content);
	}

	get hash() {
		return this.#hash;
	}

	get headers() {
		return this.#headers;
	}

	get content() {
		return this.#content;
	}

	static async fromReadableStream(stream: ReadableStream<Uint8Array<ArrayBuffer>>): Promise<Blob> {
		const headers = new Headers();
		const content = new Uint8Array(new ArrayBuffer(0, { maxByteLength: 1024 * 1024 * 100 }));
		const transformer = new ResponseTransformStream();
		stream.pipeThrough(transformer);
		for await (const chunk of transformer.readable) {
			if (chunk.type === "header") {
				headers.append(chunk.key, chunk.value);
			} else {
				const len = content.byteLength;
				content.buffer.resize(len + chunk.data.byteLength);
				content.set(chunk.data, len);
			}
		}
		assert(Number(headers.get("content-length")) === content.byteLength, "Content-Length does not match content size.");
		return Blob.new(headers, content);
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		return new ReadableStream<Uint8Array<ArrayBuffer>>({
			start: (controller) => {
				const encoder = new TextEncoder();
				const separator = encoder.encode(": ");
				const eol = encoder.encode("\r\n");

				for (const [key, value] of this.headers) {
					controller.enqueue(encoder.encode(encodeURI(key)));
					controller.enqueue(separator);
					controller.enqueue(encoder.encode(encodeURI(value)));
					controller.enqueue(eol);
				}
				controller.enqueue(eol);
				controller.enqueue(this.content);
				controller.close();
			},
		});
	}
}
