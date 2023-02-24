import { assertAutoId, AutoId } from "../libpxlr/autoid.ts";
import { BaseObject, deserializeBaseObject, serializeBaseObject } from "./object.ts";

export class Commit {
	#hash: AutoId;
	#parent: AutoId;
	#tree: AutoId;
	#commiter: string;
	#date: Date;
	#message: string;
	constructor(
		hash: AutoId,
		parent: AutoId,
		tree: AutoId,
		commiter: string,
		date: Date,
		message: string,
	) {
		assertAutoId(hash);
		parent && assertAutoId(parent);
		tree && assertAutoId(tree);
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

	static async readFromStream(hash: AutoId, readableStream: ReadableStream<Uint8Array>) {
		const obj = await deserializeBaseObject(readableStream);
		return new Commit(
			hash,
			obj.headers.get("parent") ?? "",
			obj.headers.get("tree") ?? "",
			obj.headers.get("commiter") ?? "",
			new Date(obj.headers.get("date") ?? ""),
			await obj.text(),
		);
	}

	async writeToStream(writableStream: WritableStream<Uint8Array>) {
		const obj = new BaseObject({ parent: this.parent, tree: this.tree, commiter: this.commiter, date: this.date.toISOString() }, this.message);
		await serializeBaseObject(obj, writableStream);
	}
}

export class InvalidCommitError extends Error {
	public name = "InvalidCommitError";
}
