import { sha1 } from "@noble/hashes/legacy.js";

export class Blob {
	#hash: string;
	#headers: Headers;
	#content: Uint8Array<ArrayBuffer>;

	constructor(hash: string, headerInits: HeadersInit, content: Uint8Array<ArrayBuffer>) {
		this.#hash = hash;
		this.#headers = new Headers(headerInits);
		this.#content = content;
	}

	static create(headersInit: HeadersInit, content: Uint8Array<ArrayBuffer>): Blob {
		const headers = new Headers(headersInit);
		const hashBuffer = sha1.create()
			.update(Blob.#toArrayBuffer(headers, content))
			.digest();
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return new Blob(hash, headers, content);
	}

	static #toArrayBuffer(
		headers: Headers,
		content: Uint8Array<ArrayBuffer>,
	): Uint8Array<ArrayBuffer> {
		const header = headers.entries()
			.reduce((acc, [key, value]) => {
				return acc.length > 0 ? `${acc}\n${key}: ${encodeURIComponent(value)}` : `${key}: ${encodeURIComponent(value)}`;
			}, "");
		const headerData = new TextEncoder().encode(header + `\n\n`);
		const data = new Uint8Array(headerData.byteLength + content.byteLength);
		data.set(headerData, 0);
		data.set(content, headerData.byteLength);
		return data;
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
		const content = new Uint8Array(new ArrayBuffer(0, { maxByteLength: 1024 * 1024 * 1000 }));
		const transformer = new ResponseWriterStream();
		stream.pipeThrough(transformer);
		for await (const chunk of transformer.readable) {
			if (chunk.type === "header") {
				headers.append(chunk.key, chunk.value);
			} else {
				content.buffer.resize(content.byteLength + chunk.data.byteLength);
				content.set(chunk.data, content.byteLength - chunk.data.byteLength);
			}
		}
		return Blob.create(headers, content);
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		const transformer = new ResponseReaderStream();
		const writer = transformer.writable.getWriter();
		for (const [key, value] of this.#headers) {
			writer.write({ type: "header", key, value });
		}
		writer.write({ type: "body", data: this.#content });
		writer.close();
		return transformer.readable;
	}
}

interface ResponseChunkHeader {
	type: "header";
	key: string;
	value: string;
}
interface ResponseChunkBody {
	type: "body";
	data: Uint8Array<ArrayBuffer>;
}
type ResponseChunk = ResponseChunkHeader | ResponseChunkBody;
class ResponseReaderStream extends TransformStream<ResponseChunk, Uint8Array<ArrayBuffer>> {
	constructor() {
		const encoder = new TextEncoder();
		let inBody = false;
		super({
			transform(chunk, controller) {
				switch (chunk.type) {
					case "header":
						if (inBody) {
							throw new Error("Body sent, can not send header.");
						}
						controller.enqueue(encoder.encode(encodeURIComponent(chunk.key)));
						controller.enqueue(encoder.encode(": "));
						controller.enqueue(encoder.encode(encodeURIComponent(chunk.value)));
						controller.enqueue(encoder.encode(`\r\n`));
						break;
					case "body":
						if (!inBody) {
							controller.enqueue(encoder.encode(`\r\n`));
							inBody = true;
						}
						controller.enqueue(new Uint8Array(chunk.data));
				}
			},
			flush(controller) {
				if (!inBody) {
					controller.enqueue(encoder.encode(`\r\n`));
				}
			},
		});
	}
}
class ResponseWriterStream extends TransformStream<Uint8Array<ArrayBuffer>, ResponseChunk> {
	constructor() {
		const encoder = new TextEncoder();
		const decoder = new TextDecoder();
		let inBody = false;
		let inKey = true;
		let inValue = false;
		let key = "";
		let tmp = "";
		super({
			transform(chunk, controller) {
				if (inBody === false) {
					const text = decoder.decode(chunk);
					for (let i = 0, l = chunk.length; i < l; ++i) {
						// Reached key-value seperator
						if (inKey && text.at(i) === ":" && text.at(i + 1) === " ") {
							key = tmp;
							tmp = "";
							inKey = false;
							inValue = true;
							i += 1;
						} // Reached EOL
						else if (text.at(i) === `\r` && text.at(i + 1) === `\n`) {
							// End of header value
							if (inValue) {
								controller.enqueue({ type: "header", key: decodeURIComponent(key), value: decodeURIComponent(tmp) });
								tmp = "";
								inKey = true;
								inValue = false;
								i += 1;
							} // End of head
							else if (inKey) {
								inBody = true;
								controller.enqueue({ type: "body", data: encoder.encode(text.slice(i + 2)) });
								break;
							}
						} // Buffer character
						else {
							tmp += text.at(i);
						}
					}
				} else {
					controller.enqueue({ type: "body", data: chunk });
				}
			},
		});
	}
}
