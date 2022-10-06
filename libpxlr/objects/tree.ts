import { AutoId, isAutoid } from "../autoid.ts";
import { readResponse, writeResponse } from "./helper.ts";
import { Object, ObjectSerializer } from "./object.ts";

export type TreeObjectItem = {
	readonly id: string;
	readonly type: string;
	readonly name: string;
};

export class TreeObject extends Object {
	#name: string;
	#items: TreeObjectItem[];
	public constructor(
		id: AutoId,
		type: string,
		name: string,
		items: TreeObjectItem[],
	) {
		super(id, type);
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
		this.#name = name;
		this.#items = items;
	}

	get name() {
		return this.#name;
	}

	get items(): ReadonlyArray<TreeObjectItem> {
		return this.#items;
	}
}

export class TreeObjectSerializer extends ObjectSerializer<TreeObject> {
	async serialize(stream: WritableStream, object: TreeObject) {
		await writeResponse(stream, { id: object.id, type: object.type, name: object.name }, object.items.map((item) => `${item.type} ${item.id} ${item.name}`).join(`\r\n`));
	}
	async deserialize(stream: ReadableStream) {
		const { headers, body } = await readResponse(stream);
		const itemLines = await new Response(body).text();
		const items = itemLines.split(`\r\n`).map((line) => {
			const [type, id, ...name] = line.split(" ");
			return { type, id, name: name.join(" ") };
		});
		return new TreeObject(
			headers.get("id")!,
			headers.get("type")!,
			headers.get("name")!,
			items,
		);
	}
}
