import { AutoId, isAutoid } from "../autoid.ts";
import { simpleDeserialize, simpleSerialize } from "./helper.ts";
import { Object, ObjectSerializer } from "./object.ts";

export class CommitObject extends Object {
	constructor(
		id: AutoId,
		public readonly parent: AutoId,
		public readonly tree: AutoId,
		public readonly commiter: string,
		public readonly date: Date,
		public readonly message: string,
	) {
		super(id, "commit");
		if (!isAutoid(parent)) {
			throw new TypeError(`Parameter "parent" does not appear to be an AutoId.`);
		}
		if (!isAutoid(tree)) {
			throw new TypeError(`Parameter "tree" does not appear to be an AutoId.`);
		}
	}
}

export class CommitObjectSerializer extends ObjectSerializer<CommitObject> {
	async serialize(stream: WritableStream, object: CommitObject) {
		await simpleSerialize(stream, { id: object.id, parent: object.parent, tree: object.tree, commiter: object.commiter, date: object.date.toISOString() }, object.message);
	}
	async deserialize(stream: ReadableStream) {
		const { headers, body } = await simpleDeserialize(stream);
		const message = await new Response(body).text();
		return new CommitObject(
			headers.get("id")!,
			headers.get("parent")!,
			headers.get("tree")!,
			headers.get("commiter")!,
			new Date(headers.get("date")!),
			message,
		);
	}
}
