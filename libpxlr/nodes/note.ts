import { AutoId, autoid } from "../autoid.ts";
import { Command, RenameCommand, ReplaceNodeCommand, SetContentCommand } from "./commands/mod.ts";
import { Object } from "../repository/mod.ts";
import { Node } from "./node.ts";
import { NodeRegistryEntry } from "./registry.ts";

export const NoteNodeRegistryEntry = new NodeRegistryEntry("note", async ({ object }) => {
	return new NoteNode(object.id, object.id, object.headers.get("name") ?? "", await object.text());
});

export class NoteNode extends Node {
	#content: string;
	public constructor(
		hash: AutoId,
		id: AutoId,
		name: string,
		content: string,
	) {
		super(hash, id, "note", name);
		this.#content = content;
	}

	get content() {
		return this.#content;
	}

	static new(name: string, content: string) {
		return new NoteNode(autoid(), autoid(), name, content);
	}

	executeCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new NoteNode(autoid(), this.id, command.renameTo, this.content);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(autoid(), this.id, this.name, command.newContent);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
		}
		return this;
	}

	toObject(): Object {
		return new Object(this.hash, this.id, "note", { name: this.name }, this.content);
	}

	setContent(newContent: string): SetContentCommand {
		return new SetContentCommand(this.id, newContent);
	}
}
