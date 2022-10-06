import { autoid } from "../autoid.ts";
import { Command, RenameCommand, SetContentCommand } from "../commands/mod.ts";
import { Object } from "../object.ts";
import { Node } from "./node.ts";

export class NoteNode extends Node {
	#content: string;

	public constructor(
		id: string,
		name: string,
		content: string,
	) {
		super(id, name);
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

	// static async deserialize(object: Object) {
	// 	if (object.type !== "note") {
	// 		throw new TypeError(`Object's type is not a note, got ${object.type}.`);
	// 	}
	// 	return new NoteNode(object.id, object.headers.get("name") ?? "", await object.text());
	// }

	serializeToObject(): Object {
		return Object.new(this.id, "note", { name: this.name }, this.content);
	}
}
