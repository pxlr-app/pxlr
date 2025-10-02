import { crypto } from "@std/crypto/crypto";

export class Commit {
	#hash: string;
	#parent: string | null;
	#tree: string;
	#commiter: string;
	#date: Date;
	#message: string;
	constructor(
		hash: string,
		parent: string | null,
		tree: string,
		commiter: string,
		date: Date,
		message: string,
	) {
		this.#hash = hash;
		this.#parent = parent;
		this.#tree = tree;
		this.#commiter = commiter;
		this.#date = date;
		this.#message = message;
	}

	static async create(
		parent: string | null,
		tree: string,
		commiter: string,
		date: Date,
		message: string,
	): Promise<Commit> {
		const hashBuffer = await crypto.subtle.digest("SHA-1", Commit.#toArrayBuffer(parent, tree, commiter, date, message));
		const hash = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return new Commit(hash, parent, tree, commiter, date, message);
	}

	static #toArrayBuffer(
		parent: string | null,
		tree: string,
		commiter: string,
		date: Date,
		message: string,
	): Uint8Array<ArrayBuffer> {
		// deno-fmt-ignore
		return new TextEncoder()
			.encode(`parent: ${parent ?? ""}\ntree: ${tree}\ncommiter: ${encodeURIComponent(commiter)}\ndate: ${date.toISOString()}\n\n${message}`);
	}

	get hash() {
		return this.#hash;
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

	static async fromReadableStream(stream: ReadableStream<Uint8Array<ArrayBuffer>>) {
		const payload = await new Response(stream).text();
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

		return Commit.create(
			headers.parent || null,
			headers.tree!,
			decodeURIComponent(headers.commiter!),
			new Date(headers.date!),
			parts.join("\n\n"),
		);
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		return ReadableStream.from([Commit.#toArrayBuffer(this.parent, this.tree, this.commiter, this.date, this.message)]);
	}
}
