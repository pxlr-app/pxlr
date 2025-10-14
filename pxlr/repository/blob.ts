import { assert } from "@std/assert/assert";
import { ResponseTransformStream } from "./response.ts";

export class Blob {
	#headers: Headers;
	#content: Uint8Array<ArrayBuffer>;

	constructor(content: Uint8Array<ArrayBuffer>);
	constructor(headerInits: HeadersInit, content: Uint8Array<ArrayBuffer>);
	constructor(content_or_headerInits: Uint8Array<ArrayBuffer> | HeadersInit, content?: Uint8Array<ArrayBuffer>) {
		const headerInits = content ? content_or_headerInits as HeadersInit : new Headers();
		content = content ?? content_or_headerInits as Uint8Array<ArrayBuffer>;
		this.#headers = new Headers(headerInits);
		this.#content = content;
		this.#headers.has("content-type") || this.#headers.set("content-type", "application/octet-stream");
		this.#headers.has("content-length") || this.#headers.set("content-length", content.byteLength.toString());
		assert(Number(this.#headers.get("content-length")) === content.byteLength, "Content-Length does not match content size.");
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
				headers.set(chunk.key, chunk.value);
			} else {
				const len = content.byteLength;
				content.buffer.resize(len + chunk.data.byteLength);
				content.set(chunk.data, len);
			}
		}
		return new Blob(headers, content);
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
