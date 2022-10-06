import { AutoId, autoid } from "../autoid.ts";
import { Command, RenameCommand, SetContentCommand } from "../commands/mod.ts";
import { Node } from "./node.ts";
import { Object, ObjectSerializer } from "../objects/object.ts";
import { simpleDeserialize, simpleSerialize } from "../objects/helper.ts";

export class NoteNode extends Node<NoteObject> {
	#content: string;

	public constructor(
		id: string,
		name: string,
		content: string,
	) {
		super(id, "note", name);
		this.#content = content;
	}

	static new(name: string, content: string) {
		return new NoteNode(autoid(), name, content);
	}

	get content() {
		return this.#content;
	}

	executeCommand(command: Command) {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new NoteNode(autoid(), command.renameTo, this.#content);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(autoid(), this.name, command.setContent);
			}
		}
		return this;
	}

	toObject() {
		return new NoteObject(this.id, this.name, this.content);
	}
}
export class NoteObject extends Object {
	constructor(id: AutoId, public name: string, public content: string) {
		super(id, "note");
	}
}
export class NoteObjectSerializer extends ObjectSerializer<NoteObject> {
	async serialize(stream: WritableStream, object: NoteObject) {
		await simpleSerialize(stream, { id: object.id, name: object.name }, object.content);
	}
	async deserialize(stream: ReadableStream) {
		const { headers, body } = await simpleDeserialize(stream);
		const message = await new Response(body).text();
		return new NoteObject(headers.get("id")!, headers.get("name")!, message);
	}
}
