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

	#toArrayBuffer(): Uint8Array<ArrayBuffer> {
		const payload = this.kind === "ref" ? `ref: ${this.reference}` : this.reference;
		const data = new TextEncoder().encode(payload);
		return data;
	}

	static async fromReadableStream(stream: ReadableStream<Uint8Array<ArrayBuffer>>) {
		const payload = await new Response(stream).text();
		const reference = payload.startsWith("ref: ") ? payload.slice(5).trim() : payload.trim();

		return new Reference(reference);
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		return ReadableStream.from([this.#toArrayBuffer()]);
	}
}
