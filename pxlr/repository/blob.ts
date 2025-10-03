import { sha1 } from "@noble/hashes/legacy.js";

export class Blob {
	#hash: string;
	#kind: string;
	#content: Uint8Array<ArrayBuffer>;

	constructor(hash: string, kind: string, content: Uint8Array<ArrayBuffer>) {
		this.#hash = hash;
		this.#kind = kind;
		this.#content = content;
	}

	static create(kind: string, content: Uint8Array<ArrayBuffer>): Blob {
		const hashBuffer = sha1.create()
			.update(Blob.#getHeaderArrayBuffer(kind, content))
			.update(content)
			.digest();
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return new Blob(hash, kind, content);
	}

	static #getHeaderArrayBuffer(kind: string, content: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return new TextEncoder().encode(`${kind} ${content.length}\0`);
	}

	get hash() {
		return this.#hash;
	}

	get kind() {
		return this.#kind;
	}

	get content() {
		return this.#content;
	}

	static async fromReadableStream(stream: ReadableStream<Uint8Array<ArrayBuffer>>): Promise<Blob> {
		let inHeader = true;
		let kind = "";
		let size = 0;
		const header = new Uint8Array(new ArrayBuffer(0, { maxByteLength: 128 }));
		const content = new Uint8Array(new ArrayBuffer(0, { maxByteLength: 1024 * 1024 * 1024 }));
		let offset = 0;
		for await (let chunk of stream) {
			if (inHeader) {
				header.buffer.resize(header.buffer.byteLength + chunk.byteLength);
				header.set(chunk, offset);
				offset += chunk.byteLength;
				const nullIndex = header.indexOf(0);
				if (nullIndex > -1) {
					const [kindPart, sizePart] = new TextDecoder().decode(header.slice(0, nullIndex)).split(" ");
					kind = kindPart;
					size = parseInt(sizePart, 10);
					chunk = chunk.slice(nullIndex + 1);
					inHeader = false;
					offset = 0;
				}
			}
			if (!inHeader) {
				content.buffer.resize(content.buffer.byteLength + chunk.byteLength);
				content.set(chunk, offset);
				offset += chunk.byteLength;
			}
		}
		return Blob.create(kind, content);
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		return ReadableStream.from([Blob.#getHeaderArrayBuffer(this.kind, this.content), this.#content]);
	}
}
