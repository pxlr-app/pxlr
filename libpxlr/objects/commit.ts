import { AutoId, isAutoid } from "../autoid.ts";
import { Object } from "./object.ts";

export class CommitObject extends Object {
	static new(
		id: AutoId,
		parent: AutoId,
		tree: AutoId,
		commiter: string,
		date: Date,
	) {
		if (!isAutoid(parent)) {
			throw new TypeError(`Parameter "parent" does not appear to be an AutoId.`);
		}
		if (!isAutoid(tree)) {
			throw new TypeError(`Parameter "tree" does not appear to be an AutoId.`);
		}
		return new CommitObject(id, "commit", new Map([["parent", parent], ["tree", tree], ["commiter", commiter], ["date", date.toISOString()]]));
	}

	get parent() {
		return this.headers.get("parent")!;
	}

	get tree() {
		return this.headers.get("tree")!;
	}

	get commiter() {
		return this.headers.get("commiter")!;
	}

	get date() {
		return new Date(this.headers.get("date")!);
	}
}
