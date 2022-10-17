import { assertAutoId, AutoId } from "../autoid.ts";
import { Object } from "./object.ts";

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

	toObject(): Object {
		return new Object(this.hash, this.hash, "commit", {
			parent: this.parent,
			tree: this.tree,
			commiter: this.commiter,
			date: this.date.toISOString(),
		}, this.message);
	}

	static async fromObject(object: Object): Promise<Commit> {
		return new Commit(
			object.hash,
			object.headers.get("parent") ?? "",
			object.headers.get("tree") ?? "",
			object.headers.get("commiter") ?? "",
			new Date(object.headers.get("date") ?? ""),
			await object.text().catch((_) => ""),
		);
	}
}

export class InvalidCommitError extends Error {
	public name = "InvalidCommitError";
}
