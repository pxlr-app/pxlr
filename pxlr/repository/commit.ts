export class Commit {
	#parent: string | null;
	#tree: string;
	#commiter: string;
	#date: Date;
	#message: string;
	constructor(
		parent: string | null,
		tree: string,
		commiter: string,
		date: Date,
		message: string,
	) {
		this.#parent = parent;
		this.#tree = tree;
		this.#commiter = commiter;
		this.#date = date;
		this.#message = message;
	}

	get parent() {
		return this.#parent;
	}

	get tree() {
		return this.#tree;
	}

	get commiter() {
		return this.#commiter;
	}

	get date() {
		return this.#date;
	}

	get message() {
		return this.#message;
	}

	static async fromArrayBuffer(buffer: ArrayBuffer) {
		const payload = new TextDecoder().decode(buffer);
		const [headerLines, ...parts] = payload.split("\n\n");

		const headers = headerLines
			.split(`\n`)
			.reduce(
				(acc, line) => {
					const [key, value] = line.split(": ");
					acc[key] = value;
					return acc;
				},
				{} as Record<string, string | null>,
			);

		return new Commit(
			headers.parent || null,
			headers.tree!,
			decodeURIComponent(headers.commiter!),
			new Date(headers.date!),
			parts.join("\n\n"),
		);
	}

	toArrayBuffer() {
		// deno-fmt-ignore
		const payload = `parent: ${this.#parent ?? ""}\ntree: ${this.#tree}\ncommiter: ${encodeURIComponent(this.#commiter)}\ndate: ${this.#date.toISOString()}\n\n${this.#message}`;
		const data = new TextEncoder().encode(payload);
		return data.buffer;
	}
}
