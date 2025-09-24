import { assertID, ID, isID } from "./id.ts";
import { ResponseReaderStream, ResponseWriterStream } from "./response.ts";

export class Commit {
	#hash: ID;
	#parent: ID | null;
	#tree: ID;
	#commiter: string;
	#date: Date;
	#message: string;
	constructor(
		hash: ID,
		parent: ID | null,
		tree: ID,
		commiter: string,
		date: Date,
		message: string,
	) {
		assertID(hash);
		parent && assertID(parent);
		tree && assertID(tree);
		this.#hash = hash;
		this.#parent = parent;
		this.#tree = tree;
		// TODO validate commiter
		this.#commiter = commiter;
		// TODO validate date
		this.#date = date;
		// TODO validate message
		this.#message = message;
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

	static async fromStream(hash: ID, stream: ReadableStream<Uint8Array>) {
		const decoder = new TextDecoder();
		const headers = new Map<string, string>();
		let message = "";
		const transformer = new ResponseWriterStream();
		stream.pipeThrough(transformer);
		for await (const chunk of transformer.readable) {
			if (chunk.type === "header") {
				headers.set(chunk.key, chunk.value);
			} else {
				message += decoder.decode(chunk.data);
			}
		}
		const parent = headers.get("parent");
		const tree = headers.get("tree");
		const commiter = headers.get("commiter") ?? "";
		const date = new Date(headers.get("date") ?? "");
		assertID(tree);
		return new Commit(
			hash,
			parent && isID(parent) ? parent : null,
			tree,
			commiter,
			date,
			message,
		);
	}

	toStream() {
		const transformer = new ResponseReaderStream();
		const writer = transformer.writable.getWriter();
		writer.write({ type: "header", key: "parent", value: this.parent ?? "" });
		writer.write({ type: "header", key: "tree", value: this.tree });
		writer.write({ type: "header", key: "commiter", value: this.commiter });
		writer.write({ type: "header", key: "date", value: this.date.toISOString() });
		writer.write({
			type: "body",
			data: new TextEncoder().encode(this.message),
		});
		writer.close();
		return transformer.readable;
	}
}

export class InvalidCommitError extends Error {
	public override name = "InvalidCommitError";
}
