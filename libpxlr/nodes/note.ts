import { autoid } from "../autoid.ts";
import { Command, RenameCommand, ReplaceNodeCommand, SetContentCommand } from "./commands/mod.ts";
import { Object } from "../repository/mod.ts";
import { Node } from "./node.ts";
import { NodeRegistryEntry } from "./registry.ts";

export const NoteNodeRegistryEntry = new NodeRegistryEntry("note", async ({ object }) => {
	return new NoteNode(object.id, object.headers.get("name") ?? "", await object.text());
});

export class NoteNode extends Node {
	public constructor(
		id: string,
		name: string,
		public readonly content: string,
	) {
		super(id, "note", name);
	}

	static new(name: string, content: string) {
		return new NoteNode(autoid(), name, content);
	}

	executeCommand(command: Command): Node {
		if (command.target === this.id) {
			if (command instanceof RenameCommand) {
				return new NoteNode(autoid(), command.renameTo, this.content);
			} else if (command instanceof SetContentCommand) {
				return new NoteNode(autoid(), this.name, command.newContent);
			} else if (command instanceof ReplaceNodeCommand) {
				return command.node;
			}
		}
		return this;
	}

	toObject(): Object {
		return new Object(this.id, "note", { name: this.name }, this.content);
	}

	setContent(newContent: string): SetContentCommand {
		return new SetContentCommand(this.id, newContent);
	}
}
