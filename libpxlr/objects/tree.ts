import { AutoId, isAutoid } from "../autoid.ts";
import { Object } from "./object.ts";

export type TreeObjectItem = {
	readonly id: string;
	readonly type: string;
	readonly name: string;
};

export class TreeObject extends Object {
	#items: TreeObjectItem[];
	public constructor(
		id: AutoId,
		type: string,
		name: string,
		items: TreeObjectItem[],
	) {
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
		super(id, type, new Map([["name", name]]), items.map((object) => `${object.type} ${object.id} ${object.name}`).join(`\r\n`));
		this.#items = items;
	}

	get name() {
		return this.headers.get("name")!;
	}

	get items(): ReadonlyArray<TreeObjectItem> {
		return this.#items;
	}
}
