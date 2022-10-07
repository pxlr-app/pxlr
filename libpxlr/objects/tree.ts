import { AutoId, InvalidAutoIdError, isAutoId } from "../autoid.ts";
import { Object } from "./object.ts";

export type TreeItem = {
	readonly id: string;
	readonly kind: string;
	readonly name: string;
};

export class Tree {
	public constructor(
		public readonly id: AutoId,
		public readonly subKind: string,
		public readonly name: string,
		public readonly items: ReadonlyArray<TreeItem>,
	) {
		if (!isAutoId(id)) {
			throw new InvalidAutoIdError(id);
		}
		if (subKind === "") {
			throw new InvalidTreeError();
		}
		// TODO validate items
	}

	toObject(): Object {
		return new Object(this.id, {
			kind: "tree",
			"sub-kind": this.subKind,
			name: this.name,
		}, this.items.map((item) => `${item.kind} ${item.id} ${item.name}`).join(`\r\n`));
	}

	static async fromObject(object: Object): Promise<Tree> {
		const itemLines = await object.text();
		const items = itemLines.split(`\r\n`).map((line) => {
			const [kind, id, ...name] = line.split(" ");
			return { kind, id, name: name.join(" ") };
		});
		return new Tree(
			object.id,
			object.headers.get("sub-kind") ?? "",
			object.headers.get("name") ?? "",
			items,
		);
	}
}

export class InvalidTreeError extends Error {
	public name = "InvalidTreeError";
}
