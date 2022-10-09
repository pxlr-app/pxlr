import { assertAutoId, AutoId } from "../autoid.ts";
import { Object } from "./object.ts";

export class Commit {
	constructor(
		public readonly id: AutoId,
		public readonly parent: AutoId,
		public readonly tree: AutoId,
		public readonly commiter: string,
		public readonly date: Date,
		public readonly message: string,
	) {
		assertAutoId(id);
		parent && assertAutoId(parent);
		tree && assertAutoId(tree);
		// TODO validate commiter
		// TODO validate date
		// TODO validate message
	}

	toObject(): Object {
		return new Object(this.id, "commit", {
			parent: this.parent,
			tree: this.tree,
			commiter: this.commiter,
			date: this.date.toISOString(),
		}, this.message);
	}

	static async fromObject(object: Object): Promise<Commit> {
		return new Commit(
			object.id,
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
