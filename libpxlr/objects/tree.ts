import { AutoId, isAutoid } from "../autoid.ts";
import { simpleDeserialize, simpleSerialize } from "./helper.ts";
import { Object, ObjectSerializer } from "./object.ts";

export type TreeObjectItem = {
	readonly id: string;
	readonly kind: string;
	readonly name: string;
};

export class TreeObject extends Object {
	public constructor(
		id: AutoId,
		kind: string,
		public readonly name: string,
		public readonly items: ReadonlyArray<TreeObjectItem>,
	) {
		super(id, kind);
		if (!isAutoid(id)) {
			throw new TypeError(`Parameter "id" does not appear to be an AutoId.`);
		}
	}
}

export class TreeObjectSerializer extends ObjectSerializer<TreeObject> {
	async serialize(stream: WritableStream, object: TreeObject) {
		await simpleSerialize(stream, { id: object.id, kind: object.kind, name: object.name }, object.items.map((item) => `${item.kind} ${item.id} ${item.name}`).join(`\r\n`));
	}
	async deserialize(stream: ReadableStream) {
		const { headers, body } = await simpleDeserialize(stream);
		const itemLines = await new Response(body).text();
		const items = itemLines.split(`\r\n`).map((line) => {
			const [kind, id, ...name] = line.split(" ");
			return { kind, id, name: name.join(" ") };
		});
		return new TreeObject(
			headers.get("id")!,
			headers.get("kind")!,
			headers.get("name")!,
			items,
		);
	}
}
