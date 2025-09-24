export class Reference {
	#reference: string;
	constructor(
		reference: string,
	) {
		this.#reference = reference;
	}

	get reference() {
		return this.#reference;
	}

	get kind() {
		return this.#reference.startsWith("refs/") ? "ref" : "hash";
	}

	static async fromArrayBuffer(buffer: ArrayBuffer) {
		const payload = new TextDecoder().decode(buffer);
		const reference = payload.startsWith("ref: ") ? payload.slice(5).trim() : payload.trim();

		return new Reference(reference);
	}

	toArrayBuffer() {
		const payload = this.kind === "ref" ? `ref: ${this.reference}` : this.reference;
		const data = new TextEncoder().encode(payload);
		return data.buffer;
	}
}
