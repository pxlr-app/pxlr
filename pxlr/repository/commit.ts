import { Blob } from "./blob.ts";

export class Commit {
	#parent: string | null;
	#tree: string;
	#commiter: string;
	#date: Date;
	#message: string;
	constructor(options: {
		parent?: string | null;
		tree: string;
		commiter: string;
		date: Date;
		message: string;
	}) {
		this.#parent = options.parent ?? null;
		this.#tree = options.tree;
		this.#commiter = options.commiter;
		this.#date = options.date;
		this.#message = options.message;
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
		const blob = await Blob.fromReadableStream(stream);

		return new Commit({
			parent: blob.headers.get("parent") || null,
			tree: blob.headers.get("tree")!,
			commiter: decodeURIComponent(blob.headers.get("commiter")!),
			date: new Date(blob.headers.get("date")!),
			message: new TextDecoder().decode(blob.content),
		});
	}

	toReadableStream(): ReadableStream<Uint8Array<ArrayBuffer>> {
		return new Blob(
			{
				"content-type": "application/x-pxlr-commit",
				"parent": this.#parent ?? "",
				"tree": this.#tree,
				"commiter": encodeURIComponent(this.#commiter),
				"date": this.#date.toISOString(),
			},
			new TextEncoder().encode(this.#message),
		).toReadableStream();
	}
}
