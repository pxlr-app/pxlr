export class Blob {
	#kind: string;
	#content: Uint8Array;

	constructor(kind: string, content: Uint8Array) {
		this.#kind = kind;
		this.#content = content;
	}

	get kind() {
		return this.#kind;
	}

	get content() {
		return this.#content;
	}

	static async fromArrayBuffer(buffer: ArrayBuffer) {
		const uint8Array = new Uint8Array(buffer);
		const nullIndex = uint8Array.indexOf(0);
		if (nullIndex === -1) {
			throw new Error("Invalid object format: missing null byte");
		}
		const header = new TextDecoder().decode(uint8Array.slice(0, nullIndex));
		const [kind, sizeStr] = header.split(" ");
		const size = parseInt(sizeStr, 10);
		return new Blob(kind, uint8Array.slice(nullIndex + 1, nullIndex + 1 + size));
	}

	toArrayBuffer() {
		const header = new TextEncoder().encode(`${this.#kind} ${this.#content.length}\0`);
		const data = new Uint8Array(header.length + this.#content.length);
		data.set(header, 0);
		data.set(this.#content, header.length);
		return data.buffer;
	}
}
