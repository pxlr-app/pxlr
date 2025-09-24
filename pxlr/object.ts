const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class Object {
	#hash: string | null;
	#kind: string;
	#body: Uint8Array;

	constructor(hash: string, kind: string, body: Uint8Array) {
		this.#hash = hash;
		this.#kind = kind;
		this.#body = body;
	}

	static #toBuffer(kind: string, body: Uint8Array) {
		const headerBuffer = textEncoder.encode(`${kind} ${body.length}\0`);
		const content = new Uint8Array(headerBuffer.length + body.length);
		content.set(headerBuffer, 0);
		content.set(body, headerBuffer.length);
		return content;
	}

	static async #computeHash(buffer: Uint8Array<ArrayBuffer>) {
		const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return hash;
	}

	static async create(kind: string, body: Uint8Array<ArrayBuffer>) {
		const buffer = Object.#toBuffer(kind, body);
		const hash = await Object.#computeHash(buffer);
		return new Object(hash, kind, body);
	}

	static async fromArrayBuffer(buffer: ArrayBuffer) {
		const uint8Array = new Uint8Array(buffer);
		const nullIndex = uint8Array.indexOf(0);
		if (nullIndex === -1) {
			throw new Error("Invalid object format: missing null byte");
		}
		const header = textDecoder.decode(uint8Array.slice(0, nullIndex));
		const [kind, sizeStr] = header.split(" ");
		const size = parseInt(sizeStr, 10);
		const hash = await Object.#computeHash(uint8Array);
		return new Object(hash, kind, uint8Array.slice(nullIndex + 1));
	}

	get hash() {
		return this.#hash;
	}

	get kind() {
		return this.#kind;
	}

	get body() {
		return this.#body;
	}

	toArrayBuffer() {
		return Object.#toBuffer(this.#kind, this.#body).buffer;
	}
}
